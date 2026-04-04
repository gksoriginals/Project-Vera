import { z } from "zod";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { randomUUID } from "node:crypto";
import { getDefaultLlm } from "@/lib/server/models";
import { renderPrompt } from "@/lib/server/prompt-loader";
import type {
  ConversationChunk,
  ProcessChunkPayload,
  ProcessChunkResult,
  ReplyOption
} from "@/lib/types";

const PAUSE_READY_MIN_WORDS = 18;
const COMPLETE_THOUGHT_MIN_WORDS = 28;
const MAX_BUFFER_WORDS = 42;
const STOP_FLUSH_MIN_WORDS = 8;
const VISUAL_PRESSURE_THRESHOLD = 0.74;

const simplifiedSchema = z.object({
  simplifiedText: z.string(),
  responseExpected: z.boolean()
});

const quickReplySchema = z.object({
  options: z.array(z.string()).min(1).max(2)
});

type ReadinessDecision = {
  shouldSimplify: boolean;
  reason: string;
};

const ChunkGraphState = Annotation.Root({
  transcript: Annotation<string>,
  history: Annotation<ConversationChunk[]>,
  preferences: Annotation<ProcessChunkPayload["preferences"]>,
  surface: Annotation<ProcessChunkPayload["surface"]>,
  forceSimplify: Annotation<boolean>,
  groqApiKey: Annotation<string | undefined>,
  readiness: Annotation<ReadinessDecision | null>,
  simplifiedText: Annotation<string | null>,
  responseExpected: Annotation<boolean>,
  result: Annotation<ProcessChunkResult | null>
});

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasSentenceBoundary(text: string) {
  return /[.!?:]["')\]]?\s*$/.test(text.trim());
}

function normalizeTranscript(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function getTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function assessReadiness(state: typeof ChunkGraphState.State) {
  const transcript = normalizeTranscript(state.transcript);
  const wordCount = countWords(transcript);
  const hasBoundary = hasSentenceBoundary(transcript);
  const sentenceCount = transcript
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  const visualPressure =
    state.surface.isOverflowing ||
    state.surface.isAtMinimumFontSize ||
    state.surface.occupancy >= VISUAL_PRESSURE_THRESHOLD;

  if (!transcript) {
    return {
      readiness: {
        shouldSimplify: false,
        reason: "empty_buffer"
      }
    };
  }

  if (state.forceSimplify && wordCount >= STOP_FLUSH_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "forced_flush"
      }
    };
  }

  if (wordCount >= MAX_BUFFER_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "max_buffer_reached"
      }
    };
  }

  if (hasBoundary && sentenceCount >= 2 && wordCount >= COMPLETE_THOUGHT_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "thought_complete"
      }
    };
  }

  if (hasBoundary && wordCount >= PAUSE_READY_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "semantic_pause"
      }
    };
  }

  if (visualPressure && wordCount >= COMPLETE_THOUGHT_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "visual_pressure_fallback"
      }
    };
  }

  return {
    readiness: {
      shouldSimplify: false,
      reason: hasBoundary ? "waiting_for_more_context" : "buffering_for_stability"
    }
  };
}

function routeFromReadiness(state: typeof ChunkGraphState.State) {
  return state.readiness?.shouldSimplify ? "simplify_chunk" : "buffer_only";
}

function routeAfterSimplify(state: typeof ChunkGraphState.State) {
  return state.responseExpected ? "generate_quick_replies" : "commit_without_replies";
}

function keepBuffer(state: typeof ChunkGraphState.State) {
  const transcript = normalizeTranscript(state.transcript);

  return {
    result: {
      shouldCommit: false,
      pendingTranscript: transcript,
      readinessReason: state.readiness?.reason ?? "buffering_for_stability",
      replySuggestions: []
    }
  };
}

async function simplifyChunk(state: typeof ChunkGraphState.State) {
  const model = getDefaultLlm(state.groqApiKey);
  const recentHistory = state.history
    .slice(-2)
    .map((chunk) => `- ${chunk.simplified}`)
    .join("\n");
    
  const prompt = await renderPrompt("unified-processor", {
    transcript: state.transcript,
    readability: state.preferences.readability,
    pace: state.preferences.pace,
    language: state.preferences.language,
    recent_history: recentHistory || "- none",
    occupancy: Math.round(state.surface.occupancy * 100),
    surface_status: state.surface.isOverflowing ? "Overflowing" : state.surface.occupancy > 0.7 ? "Pressed" : "Normal"
  });

  console.log(`[Vera] Starting unified process for: "${state.transcript.substring(0, 30)}..."`);
  
  const candidates = await model.invokeStructured(simplifiedSchema, prompt, {
    name: "assistive_process"
  });
  
  console.log("[Vera] Unified process complete.");
  const normalizedTranscript = normalizeTranscript(state.transcript);

  if (!candidates) {
    return {
      simplifiedText: normalizedTranscript,
      responseExpected: false
    };
  }

  return {
    simplifiedText: candidates.simplifiedText,
    responseExpected: candidates.responseExpected
  };
}

function commitWithoutReplies(state: typeof ChunkGraphState.State) {
  const normalizedTranscript = normalizeTranscript(state.transcript);
  const simplifiedText = state.simplifiedText?.trim() || normalizedTranscript;

  return {
    result: {
      shouldCommit: true,
      pendingTranscript: "",
      readinessReason: state.readiness?.reason ?? "stable_sentence",
      chunk: {
        id: randomUUID(),
        speaker: "Partner",
        timestamp: getTimestamp(),
        original: normalizedTranscript,
        simplified: simplifiedText,
        replySuggestions: []
      },
      replySuggestions: []
    }
  };
}

async function generateQuickReplies(state: typeof ChunkGraphState.State) {
  const model = getDefaultLlm(state.groqApiKey);
  const normalizedTranscript = normalizeTranscript(state.transcript);
  const simplifiedText = state.simplifiedText?.trim() || normalizedTranscript;
  const context = state.history
    .slice(-2)
    .map((chunk) => chunk.simplified)
    .join("\n");
  const prompt = await renderPrompt("chunk-reply-options", {
    language: state.preferences.language,
    transcript: normalizedTranscript,
    simplified_text: simplifiedText,
    context: context || "No recent context."
  });
  const options = await model.invokeStructured(quickReplySchema, prompt, {
    name: "chunk_reply_suggestions"
  });
  const replySuggestions: ReplyOption[] = options.options.map((text) => ({
    id: randomUUID(),
    text,
    tags: []
  }));

  return {
    result: {
      shouldCommit: true,
      pendingTranscript: "",
      readinessReason: state.readiness?.reason ?? "stable_sentence",
      chunk: {
        id: randomUUID(),
        speaker: "Partner",
        timestamp: getTimestamp(),
        original: normalizedTranscript,
        simplified: simplifiedText,
        replySuggestions
      },
      replySuggestions
    }
  };
}

const chunkGraph = new StateGraph(ChunkGraphState)
  .addNode("assess_readiness", assessReadiness)
  .addNode("buffer_only", keepBuffer)
  .addNode("simplify_chunk", simplifyChunk)
  .addNode("commit_without_replies", commitWithoutReplies)
  .addNode("generate_quick_replies", generateQuickReplies)
  .addEdge(START, "assess_readiness")
  .addConditionalEdges("assess_readiness", routeFromReadiness, [
    "buffer_only",
    "simplify_chunk"
  ])
  .addEdge("buffer_only", END)
  .addConditionalEdges("simplify_chunk", routeAfterSimplify, [
    "commit_without_replies",
    "generate_quick_replies"
  ])
  .addEdge("commit_without_replies", END)
  .addEdge("generate_quick_replies", END)
  .compile();

export async function runChunkGraph(payload: ProcessChunkPayload) {
  const result = await chunkGraph.invoke({
    transcript: normalizeTranscript(payload.transcript),
    history: payload.history,
    preferences: payload.preferences,
    surface: payload.surface,
    forceSimplify: payload.forceSimplify ?? false,
    groqApiKey: payload.groqApiKey,
    readiness: null,
    simplifiedText: null,
    responseExpected: false,
    result: null
  });

  return result.result!;
}
