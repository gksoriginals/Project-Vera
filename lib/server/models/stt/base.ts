export type SpeechToTextModel = {
  transcribe(
    file: Blob,
    options?: {
      language?: string;
    }
  ): Promise<string>;
};
