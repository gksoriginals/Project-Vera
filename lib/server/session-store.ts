import { APP_COPY, DEFAULT_PREFERENCES } from "@/lib/mock-data";
import type {
  ConversationChunk,
  SessionRecord,
  SessionReplyEvent,
  UserPreferences
} from "@/lib/types";

type VeraStore = {
  sessions: Map<string, SessionRecord>;
};

declare global {
  var __veraStore: VeraStore | undefined;
}

function getStore() {
  if (!globalThis.__veraStore) {
    globalThis.__veraStore = {
      sessions: new Map()
    };
  }

  return globalThis.__veraStore;
}

export function getOrCreateSession(sessionId: string) {
  const store = getStore();
  const existing = store.sessions.get(sessionId);

  if (existing) {
    return existing;
  }

  const created: SessionRecord = {
    id: sessionId,
    createdAt: new Date().toISOString(),
    preferences: DEFAULT_PREFERENCES,
    chunks: [],
    repliesPlayed: []
  };

  store.sessions.set(sessionId, created);
  return created;
}

export function getBootstrapPayload(sessionId: string) {
  const session = getOrCreateSession(sessionId);

  return {
    appCopy: APP_COPY,
    preferences: session.preferences,
    sessionId: session.id
  };
}

export function getPreferences(sessionId: string) {
  return getOrCreateSession(sessionId).preferences;
}

export function updateSessionPreferences(sessionId: string, preferences: UserPreferences) {
  const session = getOrCreateSession(sessionId);
  session.preferences = preferences;
  return session.preferences;
}

export function addChunkToSession(sessionId: string, chunk: ConversationChunk) {
  const session = getOrCreateSession(sessionId);
  session.chunks.push(chunk);
  return chunk;
}

export function addReplyToSession(sessionId: string, text: string) {
  const session = getOrCreateSession(sessionId);
  const reply: SessionReplyEvent = {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date().toISOString()
  };

  session.repliesPlayed.push(reply);
  return reply;
}

export function getSessionRecord(sessionId: string) {
  return getOrCreateSession(sessionId);
}

export function clearSession(sessionId: string) {
  const store = getStore();
  const existing = store.sessions.get(sessionId);
  if (existing) {
    existing.chunks = [];
    existing.repliesPlayed = [];
    // Reset preferences if needed, or keep them? 
    // Usually starting fresh means clearing messages.
  }
}
