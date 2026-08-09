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
- Questions must be specific enough to form a research project
- Ranked by novelty × impact composite score
- Each must have a clear empirical or computational approach
- Avoid vague questions — be precise about population, context, mechanism

Return ONLY valid JSON with this structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "Specific research question?",
      "rationale": "Why this is important and unstudied (2 sentences)",
      "novelty": 85,
      "feasibility": 70,
      "impact": 90,
      "methodology": "Randomized controlled trial",
      "timeframe": "2-3 years",
      "funding": "NIH R01"
    }
  ]
}

Generate all 10. Be creative and specific.`;

  const { text } = await llmCall(
    "You are a research strategy expert who generates novel, specific, fundable research questions.",
    prompt, 1400
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ questions: parsed.questions ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 });
  }
}
