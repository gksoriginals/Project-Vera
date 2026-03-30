import { z } from "zod";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { randomUUID } from "node:crypto";
import { getDefaultLlm } from "@/lib/server/models";
import { renderPrompt } from "@/lib/server/prompt-loader";
import type {
  ContextAnswer,
  ReplyOption,
  RouteInputPayload,
  RouteInputResult
} from "@/lib/types";

const replyOptionsSchema = z.object({
  options: z.array(z.string()).min(1).max(3)
});

const answerSchema = z.object({
  title: z.string(),
  body: z.string(),
  supportingPoints: z.array(z.string()).min(1).max(3)
});

const InputGraphState = Annotation.Root({
  text: Annotation<string>,
  history: Annotation<RouteInputPayload["history"]>,
  preferences: Annotation<RouteInputPayload["preferences"]>,
  groqApiKey: Annotation<string | undefined>,
  intent: Annotation<"reply" | "question" | null>,
  result: Annotation<RouteInputResult | null>
});

function routeIntent(state: typeof InputGraphState.State) {
  const normalized = state.text.trim().toLowerCase();
  const looksLikeQuestion =
    normalized.endsWith("?") ||
    /^(what|why|how|when|where|who|can|could|do|does|did|is|are|will|should)\b/.test(
      normalized
    );
  const intent: "reply" | "question" = looksLikeQuestion ? "question" : "reply";

  return {
    intent
  };
}

async function answerQuestion(state: typeof InputGraphState.State) {
  const model = getDefaultLlm(state.groqApiKey);
  const context = state.history
    .slice(-4)
    .map((chunk) => `Original: ${chunk.original}\nSimplified: ${chunk.simplified}`)
    .join("\n\n");
  const prompt = await renderPrompt("context-answer", {
    context: context || "No prior conversation context available.",
    question: state.text
  });

  const answer = await model.invokeStructured(
    answerSchema,
    prompt,
    {
      name: "explain_context"
    }
  );

  const formatted: ContextAnswer = {
    id: randomUUID(),
    title: answer.title,
    body: answer.body,
    supportingPoints: answer.supportingPoints
  };

  return {
    result: {
      intent: "question",
      answer: formatted
    }
  };
}

async function generateReplies(state: typeof InputGraphState.State) {
  const model = getDefaultLlm(state.groqApiKey);
  const context = state.history
    .slice(-2)
    .map((chunk) => chunk.simplified)
    .join("\n");
  const prompt = await renderPrompt("reply-options", {
    language: state.preferences.language,
    readability: state.preferences.readability,
    context: context || "No recent context.",
    draft_reply: state.text
  });

  const options = await model.invokeStructured(
    replyOptionsSchema,
    prompt,
    {
      name: "provide_suggestions"
    }
  );

  const formatted: ReplyOption[] = options.options.map((text) => ({
    id: randomUUID(),
    text,
    tags: []
  }));

  return {
    result: {
      intent: "reply",
      options: formatted
    }
  };
}

function selectBranch(state: typeof InputGraphState.State) {
  return state.intent === "question" ? "answer_question" : "generate_replies";
}

const inputGraph = new StateGraph(InputGraphState)
  .addNode("route_intent", routeIntent)
  .addNode("answer_question", answerQuestion)
  .addNode("generate_replies", generateReplies)
  .addEdge(START, "route_intent")
  .addConditionalEdges("route_intent", selectBranch, {
    answer_question: "answer_question",
    generate_replies: "generate_replies"
  })
  .addEdge("answer_question", END)
  .addEdge("generate_replies", END)
  .compile();

export async function runInputGraph(payload: RouteInputPayload) {
  const result = await inputGraph.invoke({
    text: payload.text,
    history: payload.history,
    preferences: payload.preferences,
    groqApiKey: payload.groqApiKey,
    intent: null,
    result: null
  });

  return result.result!;
}
