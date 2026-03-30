import type { TtsVoice } from "@/lib/types";

export type TextToSpeechModel = {
  synthesize(
    text: string,
    options?: {
      voice?: TtsVoice;
    }
  ): Promise<ArrayBuffer>;
};
