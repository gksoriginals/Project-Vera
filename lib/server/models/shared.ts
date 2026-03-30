export function getGroqApiKey() {
  return process.env.GROQ_API_KEY || null;
}

export function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY || null;
}
