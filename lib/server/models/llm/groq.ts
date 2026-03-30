import { ChatOpenAI } from "@langchain/openai";
import type { z } from "zod";
import { getGroqApiKey } from "@/lib/server/models/shared";
import type { StructuredLlm } from "@/lib/server/models/llm/base";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export class GroqStructuredLlm implements StructuredLlm {
  constructor(
    private readonly options: {
      model?: string;
      temperature?: number;
      apiKey?: string;
    } = {}
  ) {}

  async invokeStructured<Schema extends z.ZodType>(
    schema: Schema,
    prompt: string,
    config?: {
      name?: string;
      temperature?: number;
    }
  ) {
    const apiKey = this.options.apiKey || getGroqApiKey();

    if (!apiKey) {
      throw new Error("Groq API Key is missing. Please provide one in the UI or .env.");
    }
    const chatModel = new ChatOpenAI({
      apiKey,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1"
      },
      modelName: this.options.model ?? DEFAULT_MODEL,
      temperature: config?.temperature ?? this.options.temperature ?? 0
    });

    console.log(`[Groq] Sending to LLM (${this.options.model ?? DEFAULT_MODEL}):`, prompt.substring(0, 100) + "...");
    
    const response = await chatModel.invoke(prompt, {
      response_format: { type: "json_object" }
    });

    let content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    console.log(`[Groq] Received content:`, content);

    try {
      const parsed = JSON.parse(content);
      
      // Self-healing: flatten any accidental objects to strings (common in small models, GPT-4o shouldn't need it but good to have)
      const heal = (v: any): any => {
        if (Array.isArray(v)) return v.map(i => (typeof i === 'object' && i?.type ? i.type : heal(i)));
        if (typeof v === 'object' && v !== null) {
          return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, heal(val)]));
        }
        return v;
      };

      return schema.parse(heal(parsed)) as Promise<z.infer<Schema>>;
    } catch (error) {
      console.error("[Groq] Failed to parse JSON response:", content);
      throw error;
    }
  }
}
