import { getGroqApiKey } from "@/lib/server/models/shared";
import type { SpeechToTextModel } from "@/lib/server/models/stt/base";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function getAudioFilename(file: Blob) {
  const mimeType = file.type.toLowerCase();

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

function mapLanguage(language: string) {
  const normalized = language.trim().toLowerCase();

  if (normalized.startsWith("hi") || normalized.includes("hindi")) {
    return "hi";
  }

  if (normalized.startsWith("ta") || normalized.includes("tamil")) {
    return "ta";
  }

  return "en";
}

export class GroqSpeechToTextModel implements SpeechToTextModel {
  constructor(
    private readonly options: {
      model?: string;
      apiKey?: string;
    } = {}
  ) {}

  async transcribe(file: Blob, options?: { language?: string }) {
    const formData = new FormData();
    formData.append("file", file, getAudioFilename(file));
    formData.append("model", this.options.model ?? "whisper-large-v3-turbo");
    formData.append("response_format", "json");
    formData.append("language", mapLanguage(options?.language ?? "English"));

    const apiKey = this.options.apiKey || getGroqApiKey();

    if (!apiKey) {
      throw new Error("Groq API Key is missing. Please provide one in the UI or .env.");
    }

    const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Groq transcription request failed (${response.status} ${response.statusText}): ${details}`
      );
    }

    const payload = (await response.json()) as { text?: string };
    return payload.text?.trim() ?? "";
  }
}
