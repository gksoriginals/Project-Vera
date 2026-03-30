import { z } from "zod";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { randomUUID } from "node:crypto";
import { getDefaultLlm } from "@/lib/server/models";
import { renderPrompt } from "@/lib/server/prompt-loader";
import type {
  AssistiveAction,
  ChunkProblemType,
  ConversationChunk,
  ProcessChunkPayload,
  ProcessChunkResult,
  ReplyOption
} from "@/lib/types";

const problemTypes = [
  "dense_language",
  "filler_noise",
  "too_much_information",
  "low_confidence",
  "mixed_language",
  "already_clear"
] as const satisfies readonly ChunkProblemType[];

const assistiveActions = [
  "keep_verbatim",
  "clean_transcript",
  "simplify_language",
  "compress_for_speed",
  "attach_explanation",
  "repair_low_confidence"
] as const satisfies readonly AssistiveAction[];

const SENTENCE_READY_MIN_WORDS = 12;
const DENSITY_READY_MIN_WORDS = 22;
const STOP_FLUSH_MIN_WORDS = 2; // Aggressive simplification for testing
const VISUAL_PRESSURE_THRESHOLD = 0.74;

const diagnosisSchema = z.object({
  problemTypes: z.array(z.enum(problemTypes)).max(3),
  assistiveAction: z.enum(assistiveActions),
  reasoning: z.string().optional()
});

const candidateSchema = z.object({
  simplifiedText: z.string(),
  quickReplies: z.array(z.string()).min(1).max(2),
  complexityScore: z.number().min(0).max(1).default(0.3),
  rationale: z.string().optional()
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
  diagnosis: Annotation<z.infer<typeof diagnosisSchema> | null>,
  candidates: Annotation<z.infer<typeof candidateSchema> | null>,
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

  if (hasBoundary && wordCount >= SENTENCE_READY_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "stable_sentence"
      }
    };
  }

  if (visualPressure && wordCount >= DENSITY_READY_MIN_WORDS) {
    return {
      readiness: {
        shouldSimplify: true,
        reason: "visual_pressure"
      }
    };
  }

  return {
    readiness: {
      shouldSimplify: false,
      reason: hasBoundary ? "sentence_too_short" : "buffering_for_stability"
    }
  };
}

function routeFromReadiness(state: typeof ChunkGraphState.State) {
  return state.readiness?.shouldSimplify ? "unified_process" : "buffer_only";
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

async function unifiedProcess(state: typeof ChunkGraphState.State) {
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
  
  const unifiedSchema = z.object({
    diagnosis: diagnosisSchema,
    candidates: candidateSchema
  });

  const processed = await model.invokeStructured(unifiedSchema, prompt, {
    name: "assistive_process"
  });
  
  console.log(`[Vera] Unified process complete. Action: ${processed.diagnosis.assistiveAction}`);

  return {
    diagnosis: processed.diagnosis,
    candidates: processed.candidates
  };
}

function selectCaption(state: typeof ChunkGraphState.State) {
  const diagnosis = state.diagnosis;
  const candidates = state.candidates;
  const normalizedTranscript = normalizeTranscript(state.transcript);

  if (!diagnosis || !candidates) {
    const fallbackChunk: ConversationChunk = {
      id: randomUUID(),
      speaker: "Partner",
      timestamp: getTimestamp(),
      original: normalizedTranscript,
      simplified: normalizedTranscript,
      assistiveAction: "keep_verbatim",
      problemTypes: ["already_clear"],
      replySuggestions: []
    };

    return {
      result: {
        shouldCommit: true,
        pendingTranscript: "",
        readinessReason: state.readiness?.reason ?? "fallback_commit",
        chunk: fallbackChunk,
        replySuggestions: []
      }
    };
  }

  const replySuggestions: ReplyOption[] = candidates.quickReplies.map((text) => ({
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
        simplified: candidates.simplifiedText,
        assistiveAction: diagnosis.assistiveAction,
        problemTypes: (diagnosis.problemTypes.length > 0 ? diagnosis.problemTypes : ["already_clear"]) as ChunkProblemType[],
        replySuggestions
      },
      replySuggestions,
      complexityScore: candidates.complexityScore
    }
  };
}

const chunkGraph = new StateGraph(ChunkGraphState)
  .addNode("assess_readiness", assessReadiness)
  .addNode("buffer_only", keepBuffer)
  .addNode("unified_process", unifiedProcess)
  .addNode("select_caption", selectCaption)
  .addEdge(START, "assess_readiness")
  .addConditionalEdges("assess_readiness", routeFromReadiness, [
    "buffer_only",
    "unified_process"
  ])
  .addEdge("buffer_only", END)
  .addEdge("unified_process", "select_caption")
  .addEdge("select_caption", END)
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
    diagnosis: null,
    candidates: null,
    result: null
  });

  return result.result!;
}
