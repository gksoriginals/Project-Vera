"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ContextAnswerSheet } from "@/components/context-answer-sheet";
import {
  DesktopLiveShell,
  MobileLiveShell,
  TabletLiveShell
} from "@/components/live-shell-layouts";
import { FullCaptionSurface } from "@/components/full-caption-surface";
import { SimplifiedPager } from "@/components/simplified-pager";
import { useLiveConversation } from "@/hooks/use-live-conversation";

function ResetIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M3 6h 18M19 6 v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M10.3 2h3.4l.5 2.2c.7.2 1.4.5 2 .8l2-1.1 2.4 2.4-1.1 2c.4.6.6 1.3.8 2L22 10.3v3.4l-2.2.5c-.2.7-.5 1.4-.8 2l1.1 2-2.4 2.4-2-1.1c-.6.4-1.3.6-2 .8L13.7 22h-3.4l-.5-2.2c-.7-.2-1.4-.5-2-.8l-2 1.1-2.4-2.4 1.1-2c-.4-.6-.6-1.3-.8-2L2 13.7v-3.4l2.2-.5c.2-.7.5-1.4.8-2l-1.1-2 2.4-2.4 2 1.1c.6-.4 1.3-.6 2-.8L10.3 2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M4 7.5h7M4 12h16M13 16.5h7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <path
        d="M12 3.5a3.2 3.2 0 0 1 3.2 3.2v5.2a3.2 3.2 0 1 1-6.4 0V6.7A3.2 3.2 0 0 1 12 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.5 11.6a5.5 5.5 0 0 0 11 0M12 17.1v3.4M8.8 20.5h6.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        ry="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M10 13h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

type LiveShellMode = "mobile" | "tablet" | "desktop";

function getLiveShellMode(width: number): LiveShellMode {
  if (width <= 640) {
    return "mobile";
  }

  if (width <= 1024) {
    return "tablet";
  }

  return "desktop";
}

export function LiveConversationDemo() {
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [showFocusedFullText, setShowFocusedFullText] = useState(false);
  const [shellMode, setShellMode] = useState<LiveShellMode>("tablet");
  const {
    answer,
    captionMode,
    composerValue,
    connectionLabel,
    dismissAnswer,
    simplifiedHistoryPages,
    isListening,
    keyboardInputRef,
    latestChunk,
    pageIndex,
    replySuggestions,
    speakingReplyId,
    totalPages,
    visibleActiveWords,
    goToPage,
    handleLiveSurfaceMetricsChange,
    isMicrophoneSupported,
    setComposerValue,
    toggleMicrophone,
    submitComposer,
    speakText,
    speakReply,
    toggleCaptionMode,
    resetSession
  } = useLiveConversation();

  const [viewportBottom, setViewportBottom] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWindowResize = () => {
      setShellMode(getLiveShellMode(window.innerWidth));
    };

    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      
      const offset = vv.height < window.innerHeight 
        ? window.innerHeight - vv.height - vv.offsetTop
        : 0;
      
      setViewportBottom(offset);
    };

    handleResize();
    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);

  useEffect(() => {
    setShowFocusedFullText(false);
  }, [latestChunk?.id, captionMode]);

  const fullTranscriptChunks = [...simplifiedHistoryPages.slice().reverse(), ...(latestChunk ? [latestChunk] : [])]
    .filter((chunk) => chunk.original.trim().length > 0);
  const fullTranscriptHistoryText = fullTranscriptChunks
    .map((chunk) => chunk.original.trim())
    .join(" ");
  const showDesktopCompare = captionMode === "full";

  const simplifiedSurface = (
    <SimplifiedPager
      className="single-simplified-pager"
      currentChunk={latestChunk}
      currentMaxFontSize={42}
      currentMinFontSize={22}
      goToPage={goToPage}
      historyMaxFontSize={42}
      historyMinFontSize={22}
      historyChunks={simplifiedHistoryPages}
      onToggleFullText={() => setShowFocusedFullText((value) => !value)}
      pageIndex={pageIndex}
      showFullText={showFocusedFullText}
      totalPages={totalPages}
    />
  );

  const desktopSimplifiedCompareSurface = (
    <SimplifiedPager
      className="desktop-simplified-compare-surface"
      currentChunk={latestChunk}
      currentMaxFontSize={34}
      currentMinFontSize={18}
      goToPage={goToPage}
      historyMaxFontSize={34}
      historyMinFontSize={18}
      historyChunks={simplifiedHistoryPages}
      onToggleFullText={() => setShowFocusedFullText((value) => !value)}
      pageIndex={pageIndex}
      showFullText={showFocusedFullText}
      totalPages={totalPages}
    />
  );

  const fullCaptionSurface = (
    <FullCaptionSurface
      historyText={fullTranscriptHistoryText}
      isCompareMode={showDesktopCompare}
      liveText={visibleActiveWords}
      shellMode={shellMode}
      onMetricsChange={handleLiveSurfaceMetricsChange}
    />
  );
  const mobileAnswerSheet = (
    <ContextAnswerSheet
      answer={answer}
      className="mobile-answer-sheet"
      onDismiss={dismissAnswer}
    />
  );

  const desktopAnswerSheet = (
    <ContextAnswerSheet
      answer={answer}
      className="desktop-answer-sheet"
      onDismiss={dismissAnswer}
    />
  );

  const shellContent =
    shellMode === "desktop" ? (
      <DesktopLiveShell
        desktopAnswerSheet={desktopAnswerSheet}
        fullCaptionSurface={fullCaptionSurface}
        showCompare={showDesktopCompare}
        simplifiedSurface={desktopSimplifiedCompareSurface}
      />
    ) : shellMode === "tablet" ? (
      <TabletLiveShell
        answerSheet={mobileAnswerSheet}
        fullCaptionSurface={fullCaptionSurface}
        showCompare={showDesktopCompare}
        simplifiedSurface={simplifiedSurface}
      />
    ) : (
      <MobileLiveShell
        answerSheet={mobileAnswerSheet}
        fullCaptionSurface={fullCaptionSurface}
        showCompare={showDesktopCompare}
        simplifiedSurface={simplifiedSurface}
      />
    );

  return (
    <main className="live-shell">
      <section className="live-panel app-shell">
        <header className="top-bar">
          <div className="top-bar-leading">
            <span className="wordmark">Vera</span>
            <span
              aria-label={connectionLabel}
              className="connection-dot"
              title={connectionLabel}
            />
          </div>
        </header>

        {shellContent}

        <footer className="composer-area">
          {replySuggestions.length > 0 ? (
            <div className="reply-bubble-row" role="list" aria-label="AI-generated reply suggestions">
              {replySuggestions.map((reply) => (
                <button
                  className={speakingReplyId === reply.id ? "reply-bubble active" : "reply-bubble"}
                  key={reply.id}
                  onClick={() => {
                    void speakReply(reply);
                  }}
                  type="button"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          ) : null}

          <div className="composer-form">
            <div className="composer-row-container relative min-h-[64px] flex items-center justify-center">
              {/* Buttons: Managed via Vanilla CSS for reliable high-speed hiding */}
              <div className={showMessageInput ? "composer-row control-row centered-controls hidden-controls" : "composer-row control-row centered-controls"}>
                <button
                  aria-label={
                    captionMode === "full"
                      ? "Show simplified captions"
                      : "Show full version captions"
                  }
                  className={captionMode === "full" ? "secondary-button mic-toggle active" : "secondary-button mic-toggle"}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    toggleCaptionMode();
                  }}
                  title={
                    captionMode === "full"
                      ? "Show simplified"
                      : "Show full version"
                  }
                  type="button"
                >
                  <CompareIcon />
                </button>

                <button
                  aria-label={isListening ? "Stop microphone" : "Start microphone"}
                  className={isListening ? "secondary-button mic-toggle active" : "secondary-button mic-toggle"}
                  disabled={!isMicrophoneSupported && !isListening}
                  onPointerDown={(e) => {
                    e.preventDefault(); 
                    void toggleMicrophone();
                  }}
                  title={isListening ? "Stop microphone" : "Start microphone"}
                  type="button"
                >
                  <MicrophoneIcon />
                </button>
                
                <button
                  aria-label="Activate keyboard"
                  className="secondary-button mic-toggle"
                  onPointerDown={(e) => {
                    // Critical: Focus input BEFORE state change to ensure synchronous keyboard trigger
                    e.preventDefault();
                    keyboardInputRef.current?.focus();
                    setShowMessageInput(true);
                  }}
                  title="Pop up keyboard"
                  type="button"
                >
                  <KeyboardIcon />
                </button>

                <button
                  aria-label="New Session"
                  className="secondary-button mic-toggle"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (confirm("Start a new session? This will clear current history.")) {
                      void resetSession();
                    }
                  }}
                  title="New Session"
                  type="button"
                >
                  <ResetIcon />
                </button>

                <Link
                  aria-label="Settings"
                  className="secondary-button mic-toggle"
                  href="/settings"
                  title="Settings"
                >
                  <SettingsIcon />
                </Link>
              </div>

              {/* Phantom Footer Input: Always present for zero-latency focus */}
              <div 
                className={`floating-text-container ${showMessageInput ? "active" : ""}`}
                style={showMessageInput ? { bottom: `${viewportBottom + 12}px` } : {}}
              >
                <div className="floating-input-shell">
                  <input
                    ref={keyboardInputRef}
                    autoComplete="off"
                    className="floating-input"
                    onFocus={() => setShowMessageInput(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (document.activeElement !== keyboardInputRef.current) {
                          setShowMessageInput(false);
                          setComposerValue("");
                        }
                      }, 120);
                    }}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const val = composerValue.trim();
                        if (val) {
                          // DIRECT Synchronous TTS Call for Mobile Context
                          void speakText(val);
                          void submitComposer();
                        }
                        setShowMessageInput(false);
                        keyboardInputRef.current?.blur();
                      } else if (event.key === "Escape") {
                        setShowMessageInput(false);
                        keyboardInputRef.current?.blur();
                      }
                    }}
                    placeholder="Type to speak..."
                    type="text"
                    value={composerValue}
                  />
                </div>
              </div>
            </div>
          </div>
        </footer>

      </section>
    </main>
  );
}
