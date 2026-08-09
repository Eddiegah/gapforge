import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, expertise } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Generate exactly 10 specific, original, publishable research questions for the topic: "${topic}"
${expertise ? `Researcher background: ${expertise}` : ""}

Requirements:
- Each question must be specific enough to form a research project
- Ranked by novelty × impact composite score
- Each must have a clear empirical or computational approach
- Avoid vague questions — be precise about population, context, mechanism

Return a JSON object with a "questions" array. Each question object has:
id, question, rationale (2 sentences), novelty (0-100), feasibility (0-100), impact (0-100), methodology, timeframe, funding

Example format:
{"questions":[{"id":"q1","question":"...","rationale":"...","novelty":85,"feasibility":70,"impact":90,"methodology":"RCT","timeframe":"2-3 years","funding":"NIH R01"}]}

Generate all 10 now:`;

  const { text } = await llmCall(
    "You are a research strategy expert. Output only valid JSON, no markdown formatting, no code blocks.",
    prompt, 1600
  );

  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  let questions = null;

  // Strategy 1: find questions array in object
  try {
    const m = cleaned.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) questions = parsed.questions;
    }
  } catch { /* next */ }

  // Strategy 2: direct array
  if (!questions) {
    try {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (m) {
        const arr = JSON.parse(m[0]);
        if (Array.isArray(arr) && arr.length > 0) questions = arr;
      }
    } catch { /* next */ }
  }

  // Strategy 3: full parse
  if (!questions) {
    try {
      const parsed = JSON.parse(cleaned);
      questions = parsed.questions ?? (Array.isArray(parsed) ? parsed : null);
    } catch { /* give up */ }
  }

  if (!questions || questions.length === 0) {
    console.error("[Research Questions] Parse failed, raw:", text.slice(0, 300));
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 });
  }

  // Sanitize fields
  const sanitized = questions.map((q: Record<string, unknown>, i: number) => ({
    id: q.id ?? `q${i + 1}`,
    question: q.question ?? "",
    rationale: q.rationale ?? "",
    novelty: Number(q.novelty ?? 75),
    feasibility: Number(q.feasibility ?? 70),
    impact: Number(q.impact ?? 75),
    methodology: q.methodology ?? "Mixed methods",
    timeframe: q.timeframe ?? "2-3 years",
    funding: q.funding ?? "Major grant agency",
  }));

  return NextResponse.json({ questions: sanitized });
}
