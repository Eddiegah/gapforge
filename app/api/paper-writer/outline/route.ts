import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, gapContext, field } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Generate a detailed research paper outline for the following:

TOPIC: ${topic}
FIELD: ${field || "General research"}
GAP: ${gapContext || "Unstudied area in the literature"}

Produce a structured outline with:
1. Paper title (proposed)
2. Abstract (key points only)
3. Introduction (3 sub-points)
4. Literature Review (4 themes to cover)
5. Methodology (approach + 3 steps)
6. Expected Results (2-3 hypotheses)
7. Discussion (3 implications)
8. Conclusion (main contribution)

Keep it concise — bullet points for each section. This is a planning outline, not the paper itself.`;

  const { text } = await llmCall(
    "You are an expert academic research planner. Generate clear, structured research paper outlines.",
    prompt, 600
  );

  return NextResponse.json({ outline: text });
}
