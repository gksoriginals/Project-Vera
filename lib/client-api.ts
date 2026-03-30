"use client";

import type {
  BootstrapPayload,
  ProcessChunkPayload,
  ProcessChunkResult,
  RouteInputPayload,
  RouteInputResult,
  SessionRecord,
  UserPreferences
} from "@/lib/types";

const SESSION_STORAGE_KEY = "vera-session-id";

function getAudioFilename(blob: Blob) {
  const mimeType = blob.type.toLowerCase();

  if (mimeType.includes("mp4")) {
    return "segment.mp4";
  }

  if (mimeType.includes("mpeg")) {
    return "segment.mp3";
  }

  if (mimeType.includes("ogg")) {
    return "segment.ogg";
  }

  if (mimeType.includes("wav")) {
    return "segment.wav";
  }

  return "segment.webm";
}

function ensureSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next = window.crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

async function apiRequest(path: string, init?: RequestInit) {
  const sessionId = ensureSessionId();
  const headers = new Headers(init?.headers);

  headers.set("x-vera-session-id", sessionId);

  return fetch(path, {
    ...init,
    headers
  });
}

export async function bootstrapSession() {
  const response = await apiRequest("/api/bootstrap");

  if (!response.ok) {
    throw new Error("Unable to bootstrap Vera session.");
  }

  return (await response.json()) as BootstrapPayload;
}

export async function getPreferences() {
  const response = await apiRequest("/api/preferences");

  if (!response.ok) {
    throw new Error("Unable to load preferences.");
  }

  return (await response.json()) as { preferences: UserPreferences };
}

export async function updatePreferences(preferences: UserPreferences) {
  const response = await apiRequest("/api/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ preferences })
  });

  if (!response.ok) {
    throw new Error("Unable to save preferences.");
  }

  return (await response.json()) as { preferences: UserPreferences };
}

export async function getCurrentSession() {
  const response = await apiRequest("/api/sessions/current");

  if (!response.ok) {
    throw new Error("Unable to load session.");
  }

  return (await response.json()) as SessionRecord;
}

export async function processChunk(payload: ProcessChunkPayload) {
  const response = await apiRequest("/api/chunks/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to process transcript chunk.");
  }

  return (await response.json()) as ProcessChunkResult;
}

export async function routeInput(payload: RouteInputPayload) {
  const response = await apiRequest("/api/input/route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Unable to route user input.");
  }

  return (await response.json()) as RouteInputResult;
}

export async function transcribeAudio(blob: Blob, language: string) {
  const body = new FormData();
  body.append("file", blob, getAudioFilename(blob));
  body.append("language", language);

  const response = await apiRequest("/api/audio/transcribe", {
    method: "POST",
    body
  });

  if (!response.ok) {
    throw new Error("Unable to transcribe microphone audio.");
  }

  return (await response.json()) as { transcript: string };
}

export async function synthesizeSpeech(text: string, groqApiKey?: string) {
  const response = await apiRequest("/api/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, groqApiKey })
  });

  if (!response.ok) {
    throw new Error("Unable to synthesize speech.");
  }

  return response.blob();
}

export async function createLiveKitSession(payload?: {
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  room_name?: string;
  groq_api_key?: string;
}) {
  const response = await apiRequest("/api/livekit/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload ?? {})
  });

  if (!response.ok) {
    throw new Error("Unable to create a LiveKit session.");
  }

  return (await response.json()) as {
    server_url: string;
    participant_token: string;
    room_name: string;
    participant_identity: string;
    agent_name?: string;
  };
}
