/**
 * LLM Client — Reliability-first ordering
 * 1. Groq (fastest, generous free tier, rarely hits quota)
 * 2. Gemini 1.5 Flash (multiple models tried on quota hit)
 * 3. OpenAI GPT-4o-mini (if key present)
 * 4. Claude Haiku (last resort)
 */

export interface LLMResponse {
  text: string;
  provider: "groq" | "gemini" | "openai" | "claude";
}

async function callGroq(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: Math.min(maxTokens, 4096),
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    // If rate limited on 70b, try 8b
    if (res.status === 429 || err.includes("rate_limit")) {
      const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
          max_tokens: Math.min(maxTokens, 4096),
          temperature: 0.3,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (res2.ok) {
        const d = await res2.json();
        const text = d.choices?.[0]?.message?.content ?? "";
        if (text) return text;
      }
    }
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 200)}`);
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
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-lite",
    "gemini-1.0-pro",
  ];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const fullPrompt = `${system}\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isQuota = msg.includes("quota") || msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") || msg.includes("exceeded") ||
        msg.includes("rate");
      if (isQuota) {
        console.warn(`[LLM] Gemini ${modelName} quota/rate hit, trying next`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All Gemini models quota-exhausted");
}

async function callOpenAI(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      max_tokens: Math.min(maxTokens, 4096),
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenAI returned empty response");
  return text;
}

async function callClaude(system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: Math.min(maxTokens, 4096),
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content
    .filter(c => c.type === "text")
    .map(c => (c as { type: "text"; text: string }).text)
    .join("");
}

export async function llmCall(
  system: string,
  prompt: string,
  maxTokens = 4096
): Promise<LLMResponse> {
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGroq && !hasGemini && !hasOpenAI && !hasClaude) {
    throw new Error("No LLM API key configured. Add GROQ_API_KEY or GEMINI_API_KEY to Vercel environment variables.");
  }

  const errors: string[] = [];

  // 1. Groq first — fastest, most generous free tier
  if (hasGroq) {
    try {
      const text = await callGroq(system, prompt, maxTokens);
      return { text, provider: "groq" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Groq: ${msg}`);
      console.warn("[LLM] Groq failed:", msg);
    }
  }

  // 2. Gemini second
  if (hasGemini) {
    try {
      const text = await callGemini(system, prompt, maxTokens);
      return { text, provider: "gemini" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Gemini: ${msg}`);
      console.warn("[LLM] Gemini failed:", msg);
    }
  }

  // 3. OpenAI GPT-4o-mini
  if (hasOpenAI) {
    try {
      const text = await callOpenAI(system, prompt, maxTokens);
      return { text, provider: "openai" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`OpenAI: ${msg}`);
      console.warn("[LLM] OpenAI failed:", msg);
    }
  }

  // 4. Claude last resort
  if (hasClaude) {
    try {
      const text = await callClaude(system, prompt, maxTokens);
      return { text, provider: "claude" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Claude: ${msg}`);
      console.warn("[LLM] Claude failed:", msg);
    }
  }

  throw new Error(
    "AI search is temporarily unavailable — all providers are at capacity. Please try again in a few minutes."
  );
}

export async function llmCallFast(system: string, prompt: string): Promise<LLMResponse> {
  return llmCall(system, prompt, 1024);
}
