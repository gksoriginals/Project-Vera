import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProcessChunkPayload } from "../lib/types";

const { invokeStructured, renderPrompt } = vi.hoisted(() => ({
  invokeStructured: vi.fn(),
  renderPrompt: vi.fn(async (name: string) => name)
}));

vi.mock("../lib/server/models", () => ({
  getDefaultLlm: vi.fn(() => ({
    invokeStructured
  }))
}));

vi.mock("../lib/server/prompt-loader", () => ({
  renderPrompt
}));

import { runChunkGraph } from "../lib/server/graphs/chunk-graph";

const basePayload: ProcessChunkPayload = {
  transcript: "",
  history: [],
  preferences: {
    language: "English",
    readability: "Balanced simplification",
    pace: "Steady pace",
    ttsVoice: "hannah"
  },
  surface: {
    occupancy: 0.2,
    lineCount: 2,
    fontSize: 42,
    isAtMinimumFontSize: false,
    isOverflowing: false
  },
  forceSimplify: false,
  groqApiKey: "test-key"
};

describe("runChunkGraph", () => {
  beforeEach(() => {
    invokeStructured.mockReset();
    renderPrompt.mockClear();
  });

  it("keeps buffering when the transcript is too short and unstable", async () => {
    const result = await runChunkGraph({
      ...basePayload,
      transcript: "we should maybe"
    });

    expect(result).toEqual({
      shouldCommit: false,
      pendingTranscript: "we should maybe",
      readinessReason: "buffering_for_stability",
      replySuggestions: []
    });
    expect(invokeStructured).not.toHaveBeenCalled();
  });

  it("commits a simplified chunk without quick replies when no response is expected", async () => {
    invokeStructured.mockResolvedValueOnce({
      simplifiedText: "The meeting moved to tomorrow morning.",
      responseExpected: false
    });

    const result = await runChunkGraph({
      ...basePayload,
      transcript:
        "The meeting has been moved to tomorrow morning because the team needs more time to prepare everything before we start.",
      forceSimplify: true
    });

    expect(result.shouldCommit).toBe(true);
    expect(result.readinessReason).toBe("forced_flush");
    expect(result.chunk?.simplified).toBe("The meeting moved to tomorrow morning.");
    expect(result.replySuggestions).toEqual([]);
    expect(result.chunk?.replySuggestions).toEqual([]);
    expect(invokeStructured).toHaveBeenCalledTimes(1);
    expect(renderPrompt).toHaveBeenCalledWith(
      "unified-processor",
      expect.objectContaining({
        transcript:
          "The meeting has been moved to tomorrow morning because the team needs more time to prepare everything before we start."
      })
    );
  });

  it("generates quick replies only when the simplifier marks the chunk as reply-worthy", async () => {
    invokeStructured
      .mockResolvedValueOnce({
        simplifiedText: "Do you want me to send the update now?",
        responseExpected: true
      })
      .mockResolvedValueOnce({
        options: ["Yes, send it now.", "Please wait a moment."]
      });

    const result = await runChunkGraph({
      ...basePayload,
      transcript:
        "Do you want me to send the update now, or would you prefer that I wait until this afternoon?",
      forceSimplify: true
    });

    expect(result.shouldCommit).toBe(true);
    expect(result.chunk?.simplified).toBe("Do you want me to send the update now?");
    expect(result.replySuggestions.map((option) => option.text)).toEqual([
      "Yes, send it now.",
      "Please wait a moment."
    ]);
    expect(result.chunk?.replySuggestions?.map((option) => option.text)).toEqual([
      "Yes, send it now.",
      "Please wait a moment."
    ]);
    expect(invokeStructured).toHaveBeenCalledTimes(2);
    expect(renderPrompt).toHaveBeenNthCalledWith(
      2,
      "chunk-reply-options",
      expect.objectContaining({
        simplified_text: "Do you want me to send the update now?"
      })
    );
  });

  it("simplifies long completed thoughts without requiring force flush", async () => {
    invokeStructured.mockResolvedValueOnce({
      simplifiedText: "The clinic moved your visit to Thursday morning. The hearing test can still happen after lunch.",
      responseExpected: false
    });

    const result = await runChunkGraph({
      ...basePayload,
      transcript:
        "The clinic moved your visit to Thursday morning because the lab needs more time to process the samples. The hearing test can still happen after lunch if you want, but there may be a short wait.",
      forceSimplify: false
    });

    expect(result.shouldCommit).toBe(true);
    expect(result.readinessReason).toBe("thought_complete");
    expect(result.chunk?.simplified).toContain("Thursday morning");
    expect(invokeStructured).toHaveBeenCalledTimes(1);
  });
});
