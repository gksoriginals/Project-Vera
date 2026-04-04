import type {
  ContextAnswer,
  ConversationChunk,
  ReplyOption,
  UserPreferences
} from "@/lib/types";

export const APP_COPY = {
  purpose: "Live speech appears as calm, readable text so the conversation stays easier to follow."
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: "English",
  readability: "Balanced simplification",
  pace: "Steady pace",
  ttsVoice: "hannah"
};

export const STREAM_INTERVAL_MS = 320;

export const MOCK_STANZAS: ConversationChunk[] = [
  {
    id: "chunk-1",
    speaker: "Partner",
    timestamp: "2:14 PM",
    original:
      "The clinic moved your appointment to Thursday morning because the earlier slot had a scheduling conflict with the lab team.",
    simplified:
      "Your appointment moved to Thursday morning because the lab schedule changed."
  },
  {
    id: "chunk-2",
    speaker: "Partner",
    timestamp: "2:15 PM",
    original:
      "If you still want the hearing test on the same day, they can keep it after lunch, but you may need to wait about twenty minutes.",
    simplified:
      "You can still do the hearing test that day after lunch, with about a twenty minute wait."
  },
  {
    id: "chunk-3",
    speaker: "Partner",
    timestamp: "2:16 PM",
    original:
      "I can text the details to your sister as well, and she can meet you there if that makes travel easier.",
    simplified:
      "They can text your sister the details, and she can meet you there if that helps."
  }
];

export const MOCK_TTS_REPLIES: ReplyOption[] = [
  {
    id: "reply-1",
    text: "Please keep the hearing test after lunch.",
    tags: ["keep", "test", "after lunch"]
  },
  {
    id: "reply-2",
    text: "Thursday morning works for me. Please send the updated time.",
    tags: ["thursday", "time", "works"]
  },
  {
    id: "reply-3",
    text: "Yes, please text my sister the details too.",
    tags: ["sister", "text", "details"]
  }
];

export const MOCK_ANSWERS: ContextAnswer[] = [
  {
    id: "answer-1",
    title: "What changed?",
    body: "The appointment time changed from an earlier slot to Thursday morning because the lab schedule conflicted.",
    supportingPoints: [
      "The hearing test can still happen the same day.",
      "There may be a short wait after lunch.",
      "Your sister can also receive the updated details."
    ],
    triggers: ["what changed", "why", "appointment", "moved"]
  },
  {
    id: "answer-2",
    title: "What should you reply?",
    body: "A simple reply would confirm Thursday morning and whether you want the hearing test kept after lunch.",
    supportingPoints: [
      "You can also ask them to text your sister.",
      "The shortest useful confirmation is enough."
    ],
    triggers: ["what should i say", "reply", "respond"]
  }
];
