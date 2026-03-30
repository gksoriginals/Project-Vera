import {
  AudioByteStream,
  type APIConnectOptions,
  tts
} from "@livekit/agents";
import type { AudioFrame } from "@livekit/rtc-node";
import type { TtsVoice } from "../lib/types";

const DEFAULT_MODEL = "playai-tts";
const DEFAULT_VOICE: TtsVoice = "hannah";
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_SAMPLE_RATE = 24_000;
const DEFAULT_NUM_CHANNELS = 1;

export type GroqLiveKitTtsOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  voice?: TtsVoice;
  sampleRate?: number;
  numChannels?: number;
};

type ParsedWave = {
  pcm: Uint8Array;
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
};

function getRequiredApiKey(apiKey?: string) {
  const resolved = apiKey || process.env.GROQ_API_KEY;

  if (!resolved) {
    throw new Error("Groq API key is required, whether as an argument or as $GROQ_API_KEY");
  }

  return resolved;
}

export function parsePcmWave(buffer: ArrayBuffer): ParsedWave {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  if (bytes.byteLength < 44) {
    throw new Error("Groq TTS returned an audio payload that is too small to be a WAV file.");
  }

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const wave = String.fromCharCode(...bytes.slice(8, 12));

  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("Groq TTS returned an unsupported audio container. Expected WAV.");
  }

  let offset = 12;
  let dataOffset = -1;
  let dataSize = 0;
  let sampleRate = DEFAULT_SAMPLE_RATE;
  let numChannels = DEFAULT_NUM_CHANNELS;
  let bitsPerSample = 16;
  let isPcm = false;

  while (offset + 8 <= bytes.byteLength) {
    const chunkId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkDataOffset + chunkSize > bytes.byteLength) {
      break;
    }

    if (chunkId === "fmt ") {
      const audioFormat = view.getUint16(chunkDataOffset, true);
      numChannels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
      isPcm = audioFormat === 1;
    }

    if (chunkId === "data") {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (!isPcm) {
    throw new Error("Groq TTS returned a WAV file that is not PCM encoded.");
  }

  if (bitsPerSample !== 16) {
    throw new Error("Groq TTS returned a WAV file that is not 16-bit PCM.");
  }

  if (dataOffset < 0 || dataSize <= 0) {
    throw new Error("Groq TTS returned a WAV file without a data chunk.");
  }

  return {
    pcm: bytes.slice(dataOffset, dataOffset + dataSize),
    sampleRate,
    numChannels,
    bitsPerSample
  };
}

export class GroqLiveKitTTS extends tts.TTS {
  label = "groq.TTS";
  #options: Required<Pick<GroqLiveKitTtsOptions, "baseUrl" | "model" | "voice">> &
    Pick<GroqLiveKitTtsOptions, "sampleRate" | "numChannels">;
  #apiKey: string;

  constructor(options: GroqLiveKitTtsOptions = {}) {
    super(
      options.sampleRate ?? DEFAULT_SAMPLE_RATE,
      options.numChannels ?? DEFAULT_NUM_CHANNELS,
      { streaming: false }
    );

    this.#apiKey = getRequiredApiKey(options.apiKey);
    this.#options = {
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      model: options.model ?? DEFAULT_MODEL,
      voice: options.voice ?? DEFAULT_VOICE,
      sampleRate: options.sampleRate ?? DEFAULT_SAMPLE_RATE,
      numChannels: options.numChannels ?? DEFAULT_NUM_CHANNELS
    };
  }

  get model() {
    return this.#options.model;
  }

  get provider() {
    return "groq.com";
  }

  synthesize(
    text: string,
    connOptions?: APIConnectOptions,
    abortSignal?: AbortSignal
  ) {
    const payload = fetch(`${this.#options.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.#options.model,
        voice: this.#options.voice,
        input: text.slice(0, 500),
        response_format: "wav"
      }),
      signal: abortSignal
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Groq TTS request failed with status ${response.status}.`);
      }

      return response.arrayBuffer();
    });

    return new GroqChunkedStream(this, text, payload, connOptions, abortSignal);
  }

  stream(): tts.SynthesizeStream {
    throw new Error("Streaming is not supported on Groq TTS.");
  }
}

class GroqChunkedStream extends tts.ChunkedStream {
  label = "groq.ChunkedStream";
  #payload: Promise<ArrayBuffer>;

  constructor(
    speech: GroqLiveKitTTS,
    text: string,
    payload: Promise<ArrayBuffer>,
    connOptions?: APIConnectOptions,
    abortSignal?: AbortSignal
  ) {
    super(text, speech, connOptions, abortSignal);
    this.#payload = payload;
  }

  protected async run() {
    try {
      const wav = await this.#payload;
      const parsed = parsePcmWave(wav);
      const requestId = crypto.randomUUID();
      const audioByteStream = new AudioByteStream(
        parsed.sampleRate,
        parsed.numChannels
      );
      const frames = [
        ...audioByteStream.write(
          parsed.pcm.slice().buffer
        ),
        ...audioByteStream.flush()
      ];

      let lastFrame: AudioFrame | undefined;
      const pushLastFrame = (final: boolean) => {
        if (!lastFrame) {
          return;
        }

        this.queue.put({
          requestId,
          segmentId: requestId,
          frame: lastFrame,
          final
        });
        lastFrame = undefined;
      };

      for (const frame of frames) {
        pushLastFrame(false);
        lastFrame = frame;
      }

      pushLastFrame(true);
    } finally {
      this.queue.close();
    }
  }
}
