import { getGroqApiKey } from "@/lib/server/models/shared";
import type { TextToSpeechModel } from "@/lib/server/models/tts/base";
import type { TtsVoice } from "@/lib/types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export class GroqTextToSpeechModel implements TextToSpeechModel {
  constructor(
    private readonly options: {
      model?: string;
      defaultVoice?: TtsVoice;
      apiKey?: string;
    } = {}
  ) {}

  async synthesize(text: string, options?: { voice?: TtsVoice }) {
    const apiKey = this.options.apiKey || getGroqApiKey();

    if (!apiKey) {
      throw new Error("Groq API Key is missing. Please provide one in the UI or .env.");
    }

    const response = await fetch(`${GROQ_BASE_URL}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.options.model ?? "canopylabs/orpheus-v1-english",
        voice: options?.voice ?? this.options.defaultVoice ?? "hannah",
        input: text.slice(0, 200),
        response_format: "wav"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Groq TTS] Synthesis failed:", response.status, errorText);
      throw new Error("Groq speech synthesis request failed.");
    }

    return response.arrayBuffer();
  }
}
