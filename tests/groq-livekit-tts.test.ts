import { describe, expect, it } from "vitest";
import { parsePcmWave } from "../agent/groq-livekit-tts";

function createMonoPcmWave() {
  const samples = new Int16Array([0, 1024, -1024, 2048]);
  const dataBytes = samples.byteLength;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  bytes.set([82, 73, 70, 70], 0); // RIFF
  view.setUint32(4, 36 + dataBytes, true);
  bytes.set([87, 65, 86, 69], 8); // WAVE
  bytes.set([102, 109, 116, 32], 12); // fmt
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24_000, true);
  view.setUint32(28, 24_000 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  bytes.set([100, 97, 116, 97], 36); // data
  view.setUint32(40, dataBytes, true);
  bytes.set(new Uint8Array(samples.buffer), 44);

  return buffer;
}

describe("parsePcmWave", () => {
  it("extracts PCM bytes and wave metadata from a mono wav buffer", () => {
    const parsed = parsePcmWave(createMonoPcmWave());

    expect(parsed.sampleRate).toBe(24_000);
    expect(parsed.numChannels).toBe(1);
    expect(parsed.bitsPerSample).toBe(16);
    expect(parsed.pcm.byteLength).toBe(8);
  });

  it("rejects non-wav payloads", () => {
    expect(() => parsePcmWave(new TextEncoder().encode("not-a-wave").buffer)).toThrow(
      /WAV/
    );
  });
});
