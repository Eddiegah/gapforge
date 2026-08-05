/**
 * LLM Client
 * Primary: Groq (free tier, llama-3.3-70b — extremely fast, no quota issues)
 * Fallback: Gemini 1.5 Flash
 * Last resort: Claude Haiku
 */

import Groq from "groq-sdk";

export interface LLMResponse {
  text: string;
  provider: "groq" | "gemini" | "claude";
}

async function callGroq(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned empty response");
  return text;
}

async function callGemini(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: system,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
  });

  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function callClaude(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");
}

export async function llmCall(system: string, prompt: string, maxTokens = 4096): Promise<LLMResponse> {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGroq && !hasGemini && !hasClaude) {
    throw new Error("No LLM API key set. Add GROQ_API_KEY (free at console.groq.com) to your environment.");
  }

  // Try Groq first — fastest and free
  if (hasGroq) {
    try {
      const text = await callGroq(system, prompt, maxTokens);
      return { text, provider: "groq" };
    } catch (err) {
      console.warn("[LLM] Groq failed, trying Gemini:", err instanceof Error ? err.message : err);
    }
  }

  // Gemini fallback
  if (hasGemini) {
    try {
      const text = await callGemini(system, prompt, maxTokens);
      return { text, provider: "gemini" };
    } catch (err) {
      console.warn("[LLM] Gemini failed, trying Claude:", err instanceof Error ? err.message : err);
    }
  }

  // Claude last resort
  const text = await callClaude(system, prompt, maxTokens);
  return { text, provider: "claude" };
}

export async function llmCallFast(system: string, prompt: string): Promise<LLMResponse> {
  return llmCall(system, prompt, 1024);
}
