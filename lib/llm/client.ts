/**
 * LLM Client — Reliability-first ordering
 * 1. Azure OpenAI (GPT-4o — no daily quota, uses Azure credits)
 * 2. Groq (fast free fallback)
 * 3. Gemini (multiple models on quota hit)
 * 4. OpenAI direct
 * 5. Claude Haiku (last resort)
 */

export interface LLMResponse {
  text: string;
  provider: "azure-openai" | "groq" | "gemini" | "openai" | "claude";
}

async function callAzureOpenAI(system: string, prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview";
  if (!apiKey || !endpoint) throw new Error("Azure OpenAI not configured");

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      max_tokens: Math.min(maxTokens, 4096),
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(35000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure OpenAI ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Azure OpenAI empty response");
  return text;
}

async function callGroq(system: string, prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const tryModel = async (model: string) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        max_tokens: Math.min(maxTokens, 4096),
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Groq empty");
    return text;
  };

  try {
    return await tryModel("llama-3.1-70b-versatile");
  } catch {
    return await tryModel("llama-3.1-8b-instant");
  }
}

async function callGemini(system: string, prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite", "gemini-1.0-pro"];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${system}\n\n${prompt}`);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("quota") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("rate")) continue;
      throw err;
    }
  }
  throw new Error("All Gemini models exhausted");
}

async function callOpenAI(system: string, prompt: string, maxTokens: number): Promise<string> {
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
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenAI empty");
  return text;
}

async function callClaude(system: string, prompt: string, maxTokens: number): Promise<string> {
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
  const hasAzure = !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasAzure && !hasGroq && !hasGemini && !hasOpenAI && !hasClaude) {
    throw new Error("No LLM API key configured.");
  }

  if (hasAzure) {
    try { return { text: await callAzureOpenAI(system, prompt, maxTokens), provider: "azure-openai" }; }
    catch (err) { console.warn("[LLM] Azure failed:", err instanceof Error ? err.message : err); }
  }
  if (hasGroq) {
    try { return { text: await callGroq(system, prompt, maxTokens), provider: "groq" }; }
    catch (err) { console.warn("[LLM] Groq failed:", err instanceof Error ? err.message : err); }
  }
  if (hasGemini) {
    try { return { text: await callGemini(system, prompt, maxTokens), provider: "gemini" }; }
    catch (err) { console.warn("[LLM] Gemini failed:", err instanceof Error ? err.message : err); }
  }
  if (hasOpenAI) {
    try { return { text: await callOpenAI(system, prompt, maxTokens), provider: "openai" }; }
    catch (err) { console.warn("[LLM] OpenAI failed:", err instanceof Error ? err.message : err); }
  }
  if (hasClaude) {
    try { return { text: await callClaude(system, prompt, maxTokens), provider: "claude" }; }
    catch (err) { console.warn("[LLM] Claude failed:", err instanceof Error ? err.message : err); }
  }

  throw new Error("AI search is temporarily unavailable. Please try again in a few minutes.");
}

export async function llmCallFast(system: string, prompt: string): Promise<LLMResponse> {
  return llmCall(system, prompt, 1024);
}
