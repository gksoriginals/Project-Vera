import type { z } from "zod";

export type StructuredLlm = {
  invokeStructured<Schema extends z.ZodType>(
    schema: Schema,
    prompt: string,
    config?: {
      name?: string;
      temperature?: number;
    }
  ): Promise<z.infer<Schema>>;
};
