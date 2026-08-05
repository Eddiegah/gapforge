/**
 * LLM Client — Gemini primary (free tier), Claude fallback
 *
 * Gemini 1.5 Flash: free up to 15 RPM / 1M TPM on Google AI Studio key
 * Claude: fallback only if Gemini fails or key is not set
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  text: string;
  provider: "gemini" | "claude";
}

async function callGemini(
  system: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: system,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
  });

  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}

async function callClaude(
  system: string,
  prompt: string,
  maxTokens = 4096
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5", // cheapest Claude model as fallback
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content
    .filter((c) => c.type === "text")
    .map((c) => (c as { type: "text"; text: string }).text)
    .join("");
}

/**
 * Main LLM call — tries Gemini first, falls back to Claude on failure.
 * Both keys optional individually, but at least one must be set.
 */
export async function llmCall(
  system: string,
  prompt: string,
  maxTokens = 4096
): Promise<LLMResponse> {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGemini && !hasClaude) {
    throw new Error("No LLM API key set. Add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY to your environment.");
  }

  // Try Gemini first
  if (hasGemini) {
    try {
      const text = await callGemini(system, prompt);
      return { text, provider: "gemini" };
    } catch (err) {
      console.warn("[LLM] Gemini failed, falling back to Claude:", err instanceof Error ? err.message : err);
      if (!hasClaude) throw err; // no fallback available
    }
  }

  // Claude fallback
  const text = await callClaude(system, prompt, maxTokens);
  return { text, provider: "claude" };
}

/** Shorter call for simpler tasks — uses Gemini Flash (faster/cheaper) */
export async function llmCallFast(system: string, prompt: string): Promise<LLMResponse> {
  return llmCall(system, prompt, 1024);
}
