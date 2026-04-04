"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteAudioTrack,
  type TranscriptionSegment
} from "livekit-client";
import {
  createLiveKitSession,
  getCurrentSession,
  processChunk,
  routeInput,
  synthesizeSpeech
} from "@/lib/client-api";
import { useSessionContext } from "@/lib/contexts/session-context";
import { DEFAULT_PREFERENCES } from "@/lib/mock-data";
import type {
  ContextAnswer,
  ConversationChunk,
  LiveSurfaceMetrics,
  ReplyOption,
  UserPreferences
} from "@/lib/types";

const HISTORY_CHUNKS_PER_PAGE = 2;
const AUTO_FLUSH_DEBOUNCE_MS = 800;
const SILENCE_BUFFER_FLUSH_MS = 1400;
const SILENCE_FORCE_FLUSH_MS = 2400;
const CLIENT_SENTENCE_READY_MIN_WORDS = 24;
const MIN_STOP_FLUSH_WORDS = 8;
const CLIENT_VISUAL_PRESSURE_THRESHOLD = 0.72;
const EMPTY_SURFACE_METRICS: LiveSurfaceMetrics = {
  occupancy: 0,
  lineCount: 0,
  fontSize: 0,
  isAtMinimumFontSize: false,
  isOverflowing: false
};
type LiveKitSegmentRecord = {
  id: string;
  text: string;
  final: boolean;
  firstReceivedTime: number;
};

type VeraSpeechWindow = Window & {
  __veraActiveUtterance?: SpeechSynthesisUtterance | null;
};

function sortSegments(values: LiveKitSegmentRecord[]) {
  return [...values].sort((left, right) => left.firstReceivedTime - right.firstReceivedTime);
}

function mergeOrderedSegmentText(values: LiveKitSegmentRecord[], finalOnly: boolean) {
  const text = sortSegments(values)
    .filter((segment) => (finalOnly ? segment.final : !segment.final))
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ");

  return text.replace(/\s+/g, " ").trim();
}

function mergeTranscriptBuffer(existing: string, next: string) {
  if (!existing.trim()) {
    return next.trim();
  }

  if (!next.trim()) {
    return existing.trim();
  }

  return `${existing.trim()} ${next.trim()}`.replace(/\s+/g, " ").trim();
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasSentenceBoundary(text: string) {
  return /[.!?:]["')\]]?\s*$/.test(text.trim());
}

function collectPendingSegmentText(segments: Map<string, LiveKitSegmentRecord>) {
  return mergeOrderedSegmentText(Array.from(segments.values()), false);
}

function isPretextVisuallyPressured(metrics: LiveSurfaceMetrics) {
  return (
    metrics.isOverflowing ||
    metrics.isAtMinimumFontSize ||
    metrics.occupancy >= CLIENT_VISUAL_PRESSURE_THRESHOLD
  );
}

function getPretextPaceMultiplier(metrics: LiveSurfaceMetrics) {
  const occupancyFactor = Math.max(0, metrics.occupancy) * 0.35;
  const lineFactor = Math.max(0, metrics.lineCount - 2) * 0.08;
  const constrainedFactor =
    metrics.isOverflowing || metrics.isAtMinimumFontSize ? 0.2 : 0;

  return Math.min(1.65, 1 + occupancyFactor + lineFactor + constrainedFactor);
}

async function playAudioBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);

  try {
    const audio = new Audio(url);
    await audio.play();
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Unable to play synthesized audio."));
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function animateWords(
  baseText: string,
  transcript: string,
  delay: number,
  onWord: (text: string) => void
) {
  const words = transcript.split(/\s+/).filter(Boolean);

  for (let index = 0; index < words.length; index += 1) {
    onWord(mergeTranscriptBuffer(baseText, words.slice(0, index + 1).join(" ")));
    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }
}

async function waitForLayoutTick() {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
}

export type LiveConversationViewModel = {
  answer: ContextAnswer | null;
  captionMode: "full" | "simplified";
  composerValue: string;
  connectionLabel: string;
  historyPages: ConversationChunk[][];
  isBusy: boolean;
  isListening: boolean;
  keyboardInputRef: RefObject<HTMLInputElement | null>;
  latestChunk?: ConversationChunk;
  livePageClassName: string;
  pageIndex: number;
  paceValue: number;
  previousChunk: ConversationChunk | null;
  replySuggestions: ReplyOption[];
  runningCaptionsEnabled: boolean;
  speakingReplyId: string | null;
  statusNote: string;
  totalPages: number;
  visibleActiveWords: string;
  dismissAnswer: () => void;
  goToPage: (nextPage: number) => void;
  handleLiveSurfaceMetricsChange: (metrics: LiveSurfaceMetrics) => void;
  isMicrophoneSupported: boolean;
  openKeyboard: () => void;
  setComposerValue: (value: string) => void;
  setPaceValue: (value: number) => void;
  toggleMicrophone: () => Promise<void>;
  submitComposer: () => Promise<void>;
  speakText: (text: string) => Promise<void>;
  speakReply: (reply: ReplyOption) => Promise<void>;
  toggleCaptionMode: () => void;
  resetSession: () => Promise<void>;
};

export function useLiveConversation(): LiveConversationViewModel {
  const { config, clearConfig } = useSessionContext();
  const [preferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [history, setHistory] = useState<ConversationChunk[]>([]);
  const [replySuggestions, setReplySuggestions] = useState<ReplyOption[]>([]);
  const [speakingReplyId, setSpeakingReplyId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [fullCaptionsEnabled, setFullCaptionsEnabled] = useState(false);
  const [paceValue, setPaceValue] = useState(50);
  const [visibleActiveWords, setVisibleActiveWords] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [answer, setAnswer] = useState<ContextAnswer | null>(null);
  const [statusNote, setStatusNote] = useState(
    "Session ready. Start the microphone when you are ready."
  );
  const [connectionLabel, setConnectionLabel] = useState("Ready");
  const [isListening, setIsListening] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isMicrophoneSupported, setIsMicrophoneSupported] = useState(true);
  const keyboardInputRef = useRef<HTMLInputElement | null>(null);
  const roomRef = useRef<Room | null>(null);
  const pendingRoomRef = useRef<Room | null>(null);
  const remoteAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<ConversationChunk[]>([]);
  const preferencesRef = useRef<UserPreferences>(DEFAULT_PREFERENCES);
  const liveTranscriptBufferRef = useRef("");
  const liveSurfaceMetricsRef = useRef<LiveSurfaceMetrics>(EMPTY_SURFACE_METRICS);
  const isListeningRef = useRef(false);
  const liveKitSegmentsRef = useRef(new Map<string, LiveKitSegmentRecord>());
  const finalizedSegmentIdsRef = useRef(new Set<string>());
  const acceptingTranscriptionsRef = useRef(false);
  const flushTimeoutRef = useRef<number | null>(null);
  const silenceBufferFlushTimeoutRef = useRef<number | null>(null);
  const silenceFlushTimeoutRef = useRef<number | null>(null);
  const isProcessingChunkRef = useRef(false);
  const pendingFlushRequestedRef = useRef(false);
  const pendingFlushForceRef = useRef(false);
  const pendingFlushEpochRef = useRef(0);
  const flushEpochRef = useRef(0);
  const recentWordMetricsRef = useRef<{ timestamp: number; wordCount: number }[]>([]);
  const connectAttemptRef = useRef(0);
  const isConnectingRef = useRef(false);

  const latestChunk = history.at(-1);
  const previousChunk = history.length > 1 ? history[history.length - 2] : null;

  const historyPages = useMemo(() => {
    const chunks = history.slice(0, -1).reverse();
    const pages: ConversationChunk[][] = [];

    for (let index = 0; index < chunks.length; index += HISTORY_CHUNKS_PER_PAGE) {
      pages.push(chunks.slice(index, index + HISTORY_CHUNKS_PER_PAGE));
    }

    return pages;
  }, [history]);

  const totalPages = 1 + historyPages.length;
  const showPausedPair = !visibleActiveWords && Boolean(previousChunk && latestChunk);

  const livePageClassName = latestChunk
    ? visibleActiveWords
      ? "page-stack"
      : showPausedPair
        ? "page-stack double-summary"
        : "page-stack summary-priority"
    : "page-stack solo-live";

  useEffect(() => {
    setPageIndex((value) => Math.min(value, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    // Start fresh on refresh - reset the session record on the backend
    getCurrentSession().then(async (s) => {
      if (s.id) {
        await fetch("/api/session/reset", {
          method: "POST",
          body: JSON.stringify({ sessionId: s.id }),
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Then clear the local state
      setHistory([]);
      setReplySuggestions([]);
      setAnswer(null);
      setVisibleActiveWords("");
      liveTranscriptBufferRef.current = "";
    });
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimeoutRef.current !== null) {
        window.clearTimeout(flushTimeoutRef.current);
      }

      if (silenceBufferFlushTimeoutRef.current !== null) {
        window.clearTimeout(silenceBufferFlushTimeoutRef.current);
      }

      if (silenceFlushTimeoutRef.current !== null) {
        window.clearTimeout(silenceFlushTimeoutRef.current);
      }

      connectAttemptRef.current += 1;
      isConnectingRef.current = false;
      const room = roomRef.current;
      const pendingRoom = pendingRoomRef.current;
      roomRef.current = null;
      pendingRoomRef.current = null;
      void room?.disconnect();
      if (pendingRoom && pendingRoom !== room) {
        void pendingRoom.disconnect();
      }
      remoteAudioElementRef.current?.remove();
    };
  }, []);

  function clearScheduledFlush() {
    if (flushTimeoutRef.current !== null) {
      window.clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
  }

  function clearSilenceFlush() {
    if (silenceFlushTimeoutRef.current !== null) {
      window.clearTimeout(silenceFlushTimeoutRef.current);
      silenceFlushTimeoutRef.current = null;
    }
  }

  function clearSilenceBufferFlush() {
    if (silenceBufferFlushTimeoutRef.current !== null) {
      window.clearTimeout(silenceBufferFlushTimeoutRef.current);
      silenceBufferFlushTimeoutRef.current = null;
    }
  }

  async function flushBufferedTranscript(forceSimplify: boolean, epoch: number) {
    const transcript = liveTranscriptBufferRef.current.trim();

    if (!transcript) {
      return;
    }

    if (forceSimplify && countWords(transcript) < MIN_STOP_FLUSH_WORDS) {
      liveTranscriptBufferRef.current = "";
      setVisibleActiveWords("");
      return;
    }

    try {
      const processed = await processChunk({
        transcript,
        history: historyRef.current,
        preferences: preferencesRef.current,
        surface: liveSurfaceMetricsRef.current,
        forceSimplify,
        groqApiKey: config.groqApiKey
      });

      if (epoch !== flushEpochRef.current) {
        return;
      }

      liveTranscriptBufferRef.current = processed.pendingTranscript;
      setVisibleActiveWords(processed.pendingTranscript);

      if (processed.shouldCommit && processed.chunk) {
        setHistory((previous) => [...previous, processed.chunk!]);
        setReplySuggestions(processed.replySuggestions);
        setAnswer(null);
      }

      setStatusNote(
        processed.shouldCommit
          ? "Simplified the buffered live speech into a committed caption."
          : `Buffering live speech until it is stable enough to simplify (${processed.readinessReason}).`
      );
    } catch {
      if (epoch !== flushEpochRef.current) {
        return;
      }

      setStatusNote("Caption processing is catching up. Buffering more speech before retrying.");
    }
  }

  async function requestBufferedTranscriptFlush(
    forceSimplify: boolean,
    epoch = flushEpochRef.current
  ) {
    pendingFlushRequestedRef.current = true;
    pendingFlushForceRef.current = pendingFlushForceRef.current || forceSimplify;
    pendingFlushEpochRef.current = epoch;

    if (isProcessingChunkRef.current) {
      return;
    }

    isProcessingChunkRef.current = true;

    try {
      while (pendingFlushRequestedRef.current) {
        const nextForceSimplify = pendingFlushForceRef.current;
        const nextEpoch = pendingFlushEpochRef.current;

        pendingFlushRequestedRef.current = false;
        pendingFlushForceRef.current = false;

        await flushBufferedTranscript(nextForceSimplify, nextEpoch);
      }
    } finally {
      isProcessingChunkRef.current = false;
    }
  }

  function scheduleBufferedTranscriptFlush(forceSimplify: boolean) {
    if (forceSimplify) {
      clearScheduledFlush();
      void requestBufferedTranscriptFlush(true);
      return;
    }

    clearScheduledFlush();
    const epoch = flushEpochRef.current;
    flushTimeoutRef.current = window.setTimeout(() => {
      flushTimeoutRef.current = null;
      void requestBufferedTranscriptFlush(false, epoch);
    }, AUTO_FLUSH_DEBOUNCE_MS);
  }

  function scheduleSilenceFlushes() {
    clearSilenceBufferFlush();
    clearSilenceFlush();
    const epoch = flushEpochRef.current;

    silenceBufferFlushTimeoutRef.current = window.setTimeout(() => {
      silenceBufferFlushTimeoutRef.current = null;

      if (!acceptingTranscriptionsRef.current) {
        return;
      }

      if (!liveTranscriptBufferRef.current.trim()) {
        return;
      }

      void requestBufferedTranscriptFlush(false, epoch);
    }, SILENCE_BUFFER_FLUSH_MS);

    silenceFlushTimeoutRef.current = window.setTimeout(() => {
      silenceFlushTimeoutRef.current = null;

      if (!acceptingTranscriptionsRef.current) {
        return;
      }

      const transcript = liveTranscriptBufferRef.current.trim();
      const wordCount = countWords(transcript);
      const hasBoundary = hasSentenceBoundary(transcript);
      const isVisuallyPressured = isPretextVisuallyPressured(
        liveSurfaceMetricsRef.current
      );

      if (!transcript || wordCount < MIN_STOP_FLUSH_WORDS) {
        return;
      }

      if (
        !hasBoundary &&
        !isVisuallyPressured &&
        wordCount < CLIENT_SENTENCE_READY_MIN_WORDS
      ) {
        return;
      }

      void requestBufferedTranscriptFlush(true, epoch);
    }, SILENCE_FORCE_FLUSH_MS);
  }

  async function handleIncomingTranscriptions(transcription: TranscriptionSegment[]) {
    if (!acceptingTranscriptionsRef.current) {
      return;
    }

    scheduleSilenceFlushes();

    for (const segment of transcription) {
      liveKitSegmentsRef.current.set(segment.id, {
        id: segment.id,
        text: segment.text,
        final: segment.final,
        firstReceivedTime: segment.firstReceivedTime
      });
    }

    const orderedSegments = Array.from(liveKitSegmentsRef.current.values());
    const pendingText = mergeOrderedSegmentText(orderedSegments, false);
    const finalSegments = sortSegments(orderedSegments).filter((segment) => segment.final);
    const newFinalSegments = finalSegments.filter(
      (segment) => !finalizedSegmentIdsRef.current.has(segment.id)
    );

    setVisibleActiveWords(
      mergeTranscriptBuffer(liveTranscriptBufferRef.current, pendingText)
    );

    if (newFinalSegments.length === 0) {
      return;
    }

    const finalizedText = newFinalSegments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(" ");

    newFinalSegments.forEach((segment) => {
      finalizedSegmentIdsRef.current.add(segment.id);
    });

    if (!finalizedText) {
      return;
    }

    const baseText = liveTranscriptBufferRef.current;
    const nextBuffer = mergeTranscriptBuffer(baseText, finalizedText);

    // Automation: Calculate Words Per Second (WPS) over a sliding window
    const now = Date.now();
    const wordCount = countWords(finalizedText);
    recentWordMetricsRef.current.push({ timestamp: now, wordCount });
    recentWordMetricsRef.current = recentWordMetricsRef.current.filter(
      (m) => now - m.timestamp < 10000
    );

    const totalWords = recentWordMetricsRef.current.reduce((acc, m) => acc + m.wordCount, 0);
    const windowSeconds = 10;
    const wps = totalWords / windowSeconds;

    // Map WPS (expected 1.5 to 4.5) to a pace value (0 to 100)
    // If the person speaks faster, we slow down the captions (higher pace)
    const baseWpsPace = Math.min(100, Math.max(0, (wps - 1.5) * (100 / (4.5 - 1.5))));
    
    // Also consider visual pressure from Pretext library
    // If metrics indicate pressure, we slow down more
    const pressureMultiplier = isPretextVisuallyPressured(liveSurfaceMetricsRef.current) ? 1.2 : 1.0;
    const automatedPace = Math.min(100, baseWpsPace * pressureMultiplier);

    // Update pace value for the slider and the delay calculation
    setPaceValue(Math.round(automatedPace));

    // Calculate base delay: map pace 0-100 to 50ms-240ms delay
    const baseDelay = 50 + (automatedPace / 100) * (240 - 50);

    const delay = baseDelay * getPretextPaceMultiplier(liveSurfaceMetricsRef.current);

    await animateWords(baseText, finalizedText, delay, (text) => {
      setVisibleActiveWords(text);
    });

    liveTranscriptBufferRef.current = nextBuffer;
    setVisibleActiveWords(nextBuffer);
    await waitForLayoutTick();
    scheduleBufferedTranscriptFlush(false);
  }

  async function ensureRemoteAudioPlayback(track: RemoteAudioTrack) {
    let audioElement = remoteAudioElementRef.current;

    if (!audioElement) {
      audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "true");
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      remoteAudioElementRef.current = audioElement;
    }

    track.attach(audioElement);
    await roomRef.current?.startAudio();
  }

  async function startMicrophone() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsMicrophoneSupported(false);
      setConnectionLabel("Unsupported");
      setStatusNote("This browser cannot access the microphone for Vera.");
      return;
    }

    if (isConnectingRef.current || roomRef.current) {
      return;
    }

    const attempt = connectAttemptRef.current + 1;

    try {
      connectAttemptRef.current = attempt;
      isConnectingRef.current = true;
      flushEpochRef.current += 1;
      clearScheduledFlush();
      clearSilenceBufferFlush();
      clearSilenceFlush();
      pendingFlushRequestedRef.current = false;
      pendingFlushForceRef.current = false;
      setIsBusy(true);
      setConnectionLabel("Connecting");
      setStatusNote("Connecting to LiveKit and preparing the microphone.");

      const session = await createLiveKitSession({
        participant_name: "Vera User",
        groq_api_key: config.groqApiKey
      });
      const room = new Room();

      pendingRoomRef.current = room;
      acceptingTranscriptionsRef.current = true;
      liveKitSegmentsRef.current.clear();
      finalizedSegmentIdsRef.current.clear();

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          void ensureRemoteAudioPlayback(track as RemoteAudioTrack);
        }
      });

      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        if (participant && participant.identity !== room.localParticipant.identity) {
          return;
        }

        void handleIncomingTranscriptions(segments);
      });

      room.on(RoomEvent.AudioPlaybackStatusChanged, (playing) => {
        if (!playing) {
          setStatusNote("Tap the page once if browser audio playback is blocked.");
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        acceptingTranscriptionsRef.current = false;
        setIsListening(false);
        setConnectionLabel("Ready");
      });

      await room.connect(session.server_url, session.participant_token);

      if (connectAttemptRef.current !== attempt) {
        await room.disconnect().catch(() => undefined);
        return;
      }

      pendingRoomRef.current = null;
      roomRef.current = room;
      await room.startAudio();
      await room.localParticipant.setMicrophoneEnabled(true);

      setIsListening(true);
      setIsMicrophoneSupported(true);
      setConnectionLabel("Live");
      setStatusNote("Connected to LiveKit. Listening for live speech.");
    } catch {
      acceptingTranscriptionsRef.current = false;
      const room = pendingRoomRef.current;
      pendingRoomRef.current = null;

      if (roomRef.current === room) {
        roomRef.current = null;
      }

      await room?.disconnect().catch(() => undefined);

      if (connectAttemptRef.current === attempt) {
        setConnectionLabel("Permission needed");
        setStatusNote("Microphone access and a healthy LiveKit connection are required.");
      }
    } finally {
      if (connectAttemptRef.current === attempt) {
        isConnectingRef.current = false;
        setIsBusy(false);
      }
    }
  }

  async function stopMicrophone() {
    const room = roomRef.current;
    const pendingRoom = pendingRoomRef.current;
    const stopEpoch = flushEpochRef.current + 1;
    const pendingSegmentText = collectPendingSegmentText(liveKitSegmentsRef.current);

    connectAttemptRef.current += 1;
    isConnectingRef.current = false;
    pendingRoomRef.current = null;
    flushEpochRef.current = stopEpoch;
    acceptingTranscriptionsRef.current = false;
    clearScheduledFlush();
    clearSilenceBufferFlush();
    clearSilenceFlush();

    if (pendingSegmentText) {
      liveTranscriptBufferRef.current = mergeTranscriptBuffer(
        liveTranscriptBufferRef.current,
        pendingSegmentText
      );
      setVisibleActiveWords(liveTranscriptBufferRef.current);
    }

    liveKitSegmentsRef.current.clear();
    finalizedSegmentIdsRef.current.clear();

    if (room) {
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      await room.disconnect();
    }

    if (pendingRoom && pendingRoom !== room) {
      await pendingRoom.disconnect().catch(() => undefined);
    }

    roomRef.current = null;
    setIsListening(false);
    setIsBusy(false);
    setConnectionLabel("Ready");
    setStatusNote("Microphone stopped. Flushing the final buffered transcript.");
    await requestBufferedTranscriptFlush(true, stopEpoch);
  }

  async function toggleMicrophone() {
    if (isListening || isConnectingRef.current) {
      await stopMicrophone();
      return;
    }

    await startMicrophone();
  }

  function goToPage(nextPage: number) {
    setPageIndex(Math.max(0, Math.min(nextPage, totalPages - 1)));
  }

  async function speakText(text: string, id: string | null = null) {
    if (id) setSpeakingReplyId(id);
    const room = roomRef.current;
    
    // Non-blocking mic mute to preserve speech context
    if (isListening && room) {
      void room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    }

    try {
      // Emergency: Browser Speech API (Zero-terms, Zero-latency)
      // Must be called as close to the user event as possible
      if ("speechSynthesis" in window) {
        const speechWindow = window as VeraSpeechWindow;
        // DO NOT call .cancel() here as it permanently freezes the iOS Safari speech engine
        window.speechSynthesis.resume(); // Wake up iOS audio context
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Prevent aggressive Safari garbage collection that cuts off speech mid-sentence
        speechWindow.__veraActiveUtterance = utterance; 
        
        const voices = window.speechSynthesis.getVoices();
        
        // Select an appropriate voice (system defaults are usually best on mobile)
        const samantha = voices.find(v => v.name.includes("Samantha") && v.lang.startsWith("en"));
        const google = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"));
        if (samantha || google) {
          utterance.voice = samantha || google || null;
        }
        
        utterance.onend = () => {
          if (id) setSpeakingReplyId(null);
          // Auto-resume mic (generous delay based on sentence length)
          setTimeout(() => {
            if (isListening && room) void room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
          }, 400);
          speechWindow.__veraActiveUtterance = null;
        };
        
        utterance.onerror = (e) => {
           console.error("[Vera TTS Error]", e);
           if (id) setSpeakingReplyId(null);
           if (isListening && room) void room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
           speechWindow.__veraActiveUtterance = null;
        };

        window.speechSynthesis.speak(utterance);
        setStatusNote("Speaking locally...");
      } else {
        // High-quality Fallback: Groq TTS
        const audio = await synthesizeSpeech(text, config.groqApiKey);
        await playAudioBlob(audio);
        if (id) setSpeakingReplyId(null);
        if (isListening && room) void room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
      }
    } catch (e) {
      console.error("[Vera TTS Error]", e);
      setStatusNote("Speech engine busy.");
      if (id) setSpeakingReplyId(null);
      if (isListening && room) void room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
    }
  }

  async function speakReply(reply: ReplyOption) {
    await speakText(reply.text, reply.id);
  }

  async function submitComposer() {
    const text = composerValue.trim();

    if (!text) {
      return;
    }

    setIsBusy(true);
    setConnectionLabel("Thinking");
    setComposerValue("");
    void speakText(text);

    try {
      const result = await routeInput({
        text,
        history: historyRef.current,
        preferences: preferencesRef.current,
        groqApiKey: config.groqApiKey
      });

      if (result.intent === "question") {
        setAnswer(result.answer);
      } else {
        setReplySuggestions(result.options);
      }
    } catch {
      setStatusNote("Input routing failed. Please try again.");
    } finally {
      setIsBusy(false);
      setConnectionLabel(isListening ? "Live" : "Ready");
    }
  }

  function toggleCaptionMode() {
    setFullCaptionsEnabled((value) => !value);
  }

  function openKeyboard() {
    keyboardInputRef.current?.focus();
  }

  function handleLiveSurfaceMetricsChange(metrics: LiveSurfaceMetrics) {
    liveSurfaceMetricsRef.current = metrics;
  }

  return {
    answer,
    captionMode: fullCaptionsEnabled ? "full" : "simplified",
    composerValue,
    connectionLabel,
    historyPages,
    isBusy,
    isListening,
    keyboardInputRef,
    latestChunk,
    livePageClassName,
    pageIndex,
    paceValue,
    previousChunk,
    replySuggestions,
    runningCaptionsEnabled: fullCaptionsEnabled,
    speakingReplyId,
    statusNote,
    totalPages,
    visibleActiveWords: fullCaptionsEnabled ? visibleActiveWords : "",
    dismissAnswer: () => setAnswer(null),
    goToPage,
    handleLiveSurfaceMetricsChange,
    isMicrophoneSupported,
    openKeyboard,
    setComposerValue,
    setPaceValue,
    toggleMicrophone,
    submitComposer,
    speakText,
    speakReply,
    toggleCaptionMode,
    resetSession: async () => {
      const session = await getCurrentSession();
      if (session.id) {
        await fetch("/api/session/reset", {
          method: "POST",
          body: JSON.stringify({ sessionId: session.id }),
          headers: { "Content-Type": "application/json" }
        });
      }
      setHistory([]);
      setReplySuggestions([]);
      setAnswer(null);
      setVisibleActiveWords("");
      liveTranscriptBufferRef.current = "";
      clearConfig(); // WIPE API KEYS
      setStatusNote("Session reset. API keys cleared from memory.");
    }
  };
}
