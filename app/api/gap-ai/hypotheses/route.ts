import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const citations = gap.citations.slice(0, 4)
    .map((c, i) => `[${i+1}] "${c.title}" (${c.year ?? "n.d."})`)
    .join("\n");

  const { text } = await llmCall(
    "You generate specific, falsifiable research hypotheses grounded in real evidence. Be precise and scientific.",
    `Generate 4 testable hypotheses for this research gap.

Gap: ${gap.title}
Description: ${gap.description.slice(0, 400)}
Supporting literature:
${citations || "None cited"}

For each hypothesis:
- State it as a clear, falsifiable H1 statement
- Identify the key variables (independent, dependent)
- Suggest a method to test it (1 sentence)
- Rate testability: Easy / Moderate / Challenging

Return JSON array:
[{
  "hypothesis": "H1: ...",
  "independentVariable": "string",
  "dependentVariable": "string", 
  "testMethod": "string",
  "testability": "Easy" | "Moderate" | "Challenging",
  "rationale": "string (1 sentence grounding this in the cited evidence)"
}]
Return ONLY JSON.`,
    1200
  );

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const hypotheses = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ hypotheses });
  } catch {
    return NextResponse.json({ hypotheses: [] });
  }
}
