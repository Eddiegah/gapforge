import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap" }, { status: 400 });

  const { text } = await llmCallFast(
    "You identify real funding opportunities for research gaps. Return only valid JSON.",
    `Find 4 real funding opportunities for this research gap.

Gap: ${gap.title}
Description: ${gap.description.slice(0, 200)}

Return a JSON array ONLY:
[{
  "funder": "string",
  "program": "string",
  "amount": "string",
  "deadline": "string",
  "url": "string",
  "fit": "High",
  "notes": "string"
}]`
  );

  let opportunities = null;
  try {
    const m = text.match(/\[[\s\S]*\]/);
    if (m) opportunities = JSON.parse(m[0]);
  } catch { /* next */ }
  if (!opportunities) {
    try { opportunities = JSON.parse(text.trim()); } catch { /* give up */ }
  }

  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    return NextResponse.json({ error: "Failed to find funding opportunities. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ opportunities });
}
