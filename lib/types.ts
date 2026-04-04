export type ReadabilityPreference =
  | "Balanced simplification"
  | "Clearer wording"
  | "Compressed for speed";

export type PacePreference = "Steady pace" | "Faster updates" | "More spacing";

export type TtsVoice = "hannah" | "autumn" | "austin" | "daniel" | "diana" | "troy";

export type UserPreferences = {
  language: string;
  readability: ReadabilityPreference;
  pace: PacePreference;
  ttsVoice: TtsVoice;
};

export type ReplyOption = {
  id: string;
  text: string;
  tags: string[];
};

export type ContextAnswer = {
  id: string;
  title: string;
  body: string;
  supportingPoints: string[];
  triggers?: string[];
};

export type ConversationChunk = {
  id: string;
  speaker: string;
  timestamp: string;
  original: string;
  simplified: string;
  replySuggestions?: ReplyOption[];
};

export type SessionReplyEvent = {
  id: string;
  text: string;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  createdAt: string;
  preferences: UserPreferences;
  chunks: ConversationChunk[];
  repliesPlayed: SessionReplyEvent[];
};

export type LiveSurfaceMetrics = {
  occupancy: number;
  lineCount: number;
  fontSize: number;
  isAtMinimumFontSize: boolean;
  isOverflowing: boolean;
};

export type BootstrapPayload = {
  appCopy: {
    purpose: string;
  };
  preferences: UserPreferences;
  sessionId: string;
};

export type ProcessChunkPayload = {
  transcript: string;
  history: ConversationChunk[];
  preferences: UserPreferences;
  surface: LiveSurfaceMetrics;
  forceSimplify?: boolean;
  groqApiKey?: string;
};

export type ProcessChunkResult = {
  shouldCommit: boolean;
  pendingTranscript: string;
  readinessReason: string;
  chunk?: ConversationChunk;
  replySuggestions: ReplyOption[];
};

export type RouteInputPayload = {
  text: string;
  history: ConversationChunk[];
  preferences: UserPreferences;
  groqApiKey?: string;
};

export type RouteInputResult =
  | {
      intent: "reply";
      options: ReplyOption[];
    }
  | {
      intent: "question";
      answer: ContextAnswer;
    };
