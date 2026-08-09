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

Return a JSON array ONLY (no text before or after):
[{
  "hypothesis": "H1: ...",
  "independentVariable": "string",
  "dependentVariable": "string",
  "testMethod": "string",
  "testability": "Easy",
  "rationale": "string"
}]`,
    1200
  );

  // Multi-strategy extraction
  let hypotheses = null;
  try {
    const m = text.match(/\[[\s\S]*\]/);
    if (m) hypotheses = JSON.parse(m[0]);
  } catch { /* next */ }
  if (!hypotheses) {
    try { hypotheses = JSON.parse(text.trim()); } catch { /* give up */ }
  }

  if (!Array.isArray(hypotheses) || hypotheses.length === 0) {
    return NextResponse.json({ error: "Failed to generate hypotheses. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ hypotheses });
}
