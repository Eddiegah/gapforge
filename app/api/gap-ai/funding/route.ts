import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap" }, { status: 400 });

  const { text } = await llmCallFast(
    "You identify real funding opportunities for research gaps. Be specific.",
    `Find 4 real funding opportunities for this research gap.

Gap: ${gap.title}
Description: ${gap.description.slice(0, 200)}

List real grant programs (NIH, NSF, EU Horizon, Wellcome Trust, etc.) that fund this type of research.

Return JSON array: [{
  "funder": "string", "program": "string", "amount": "string",
  "deadline": "string", "url": "string", "fit": "High" | "Medium",
  "notes": "string (1 sentence)"
}]
Return ONLY JSON.`
  );

  try {
    const match = text.match(/\[[\s\S]*\]/);
    return NextResponse.json({ opportunities: match ? JSON.parse(match[0]) : [] });
  } catch {
    return NextResponse.json({ opportunities: [] });
  }
}
