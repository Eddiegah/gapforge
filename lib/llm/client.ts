/**
 * LLM Client
 * Primary: Gemini 1.5 Flash (free tier, reliable)
 * Fallback: Groq (free, fast)
 * Last resort: Claude Haiku
 */

export interface LLMResponse {
  text: string;
  provider: "groq" | "gemini" | "claude";
}

async function callGroq(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  
  // Use fetch directly to avoid SDK issues
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant", // faster, lower quota usage
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Groq returned empty response");
  return text;
}

async function callGemini(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  // Try multiple models in case one hits quota
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.0-pro"];
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const fullPrompt = `${system}\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("exceeded")) {
        console.warn(`[LLM] ${modelName} quota hit, trying next`);
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error("All Gemini models failed");
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
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGemini && !hasGroq && !hasClaude) {
    throw new Error("No LLM API key configured. Add GEMINI_API_KEY to Vercel environment variables.");
  }

  // Gemini first — most reliable free tier
  if (hasGemini) {
    try {
      const text = await callGemini(system, prompt, maxTokens);
      return { text, provider: "gemini" };
    } catch (err) {
      console.warn("[LLM] Gemini failed:", err instanceof Error ? err.message : err);
    }
  }

  // Groq second
  if (hasGroq) {
    try {
      const text = await callGroq(system, prompt, maxTokens);
      return { text, provider: "groq" };
    } catch (err) {
      console.warn("[LLM] Groq failed:", err instanceof Error ? err.message : err);
    }
  }

  // Claude last
  if (hasClaude) {
    try {
      const text = await callClaude(system, prompt, maxTokens);
      return { text, provider: "claude" };
    } catch (err) {
      console.warn("[LLM] Claude failed:", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("All LLM providers failed. Your GEMINI_API_KEY may have hit its daily quota — wait a few hours and try again.");
}

export async function llmCallFast(system: string, prompt: string): Promise<LLMResponse> {
  return llmCall(system, prompt, 1024);
}
