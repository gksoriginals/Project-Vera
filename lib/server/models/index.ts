import { GroqStructuredLlm } from "@/lib/server/models/llm/groq";
import { GroqSpeechToTextModel } from "@/lib/server/models/stt/groq";
import { GroqTextToSpeechModel } from "@/lib/server/models/tts/groq";

export function getDefaultLlm(apiKey?: string) {
  return new GroqStructuredLlm({ apiKey });
}

export function getDefaultStt(apiKey?: string) {
  return new GroqSpeechToTextModel({ apiKey });
}

export function getDefaultTts(apiKey?: string) {
  return new GroqTextToSpeechModel({ apiKey });
}
