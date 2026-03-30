import { readFile } from "node:fs/promises";
import path from "node:path";

const promptCache = new Map<string, string>();

export async function loadPrompt(name: string) {
  const cached = promptCache.get(name);

  if (cached) {
    return cached;
  }

  const filePath = path.join(process.cwd(), "prompts", `${name}.txt`);
  const template = await readFile(filePath, "utf8");
  promptCache.set(name, template);
  return template;
}

export async function renderPrompt(
  name: string,
  variables: Record<string, string | number | boolean | null | undefined>
) {
  const template = await loadPrompt(name);

  return Object.entries(variables).reduce((current, [key, value]) => {
    return current.replaceAll(`{{${key}}}`, String(value ?? ""));
  }, template);
}
