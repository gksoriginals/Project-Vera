import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RouteInputPayload } from "../lib/types";

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

import { runInputGraph } from "../lib/server/graphs/input-graph";

const basePayload: RouteInputPayload = {
  text: "",
  history: [],
  preferences: {
    language: "English",
    readability: "Balanced simplification",
    pace: "Steady pace",
    ttsVoice: "hannah"
  },
  groqApiKey: "test-key"
};

describe("runInputGraph", () => {
  beforeEach(() => {
    invokeStructured.mockReset();
    renderPrompt.mockClear();
  });

  it("routes direct questions to the answer branch", async () => {
    invokeStructured.mockResolvedValueOnce({
      title: "What changed?",
      body: "The appointment is now tomorrow morning.",
      supportingPoints: ["The lab needed more time."]
    });

    const result = await runInputGraph({
      ...basePayload,
      text: "What changed?"
    });

    expect(result.intent).toBe("question");
    if (result.intent === "question") {
      expect(result.answer.title).toBe("What changed?");
      expect(result.answer.body).toContain("tomorrow morning");
      expect(result.answer.supportingPoints).toEqual(["The lab needed more time."]);
    }
    expect(renderPrompt).toHaveBeenCalledWith(
      "context-answer",
      expect.objectContaining({
        question: "What changed?"
      })
    );
  });

  it("routes non-questions to the reply suggestion branch", async () => {
    invokeStructured.mockResolvedValueOnce({
      options: ["Tomorrow morning works for me.", "Please send the new time."]
    });

    const result = await runInputGraph({
      ...basePayload,
      text: "Tomorrow morning works for me"
    });

    expect(result.intent).toBe("reply");
    if (result.intent === "reply") {
      expect(result.options.map((option) => option.text)).toEqual([
        "Tomorrow morning works for me.",
        "Please send the new time."
      ]);
    }
    expect(renderPrompt).toHaveBeenCalledWith(
      "reply-options",
      expect.objectContaining({
        draft_reply: "Tomorrow morning works for me"
      })
    );
  });

  it("treats leading question words as questions even without punctuation", async () => {
    invokeStructured.mockResolvedValueOnce({
      title: "What time?",
      body: "The meeting starts at 3 PM.",
      supportingPoints: ["It is scheduled for the afternoon."]
    });

    const result = await runInputGraph({
      ...basePayload,
      text: "what time is the meeting"
    });

    expect(result.intent).toBe("question");
    expect(invokeStructured).toHaveBeenCalledTimes(1);
  });
});
