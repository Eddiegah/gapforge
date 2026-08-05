import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap, audience } = await req.json() as { gap: DetectedGap; audience?: string };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const audienceMap: Record<string, string> = {
    general: "a general non-scientific audience (no jargon, plain English)",
    undergraduate: "an undergraduate student new to the field",
    policymaker: "a government policymaker or funding body",
    journalist: "a science journalist writing for a newspaper",
  };

  const targetAudience = audienceMap[audience ?? "general"] ?? audienceMap.general;

  const { text } = await llmCallFast(
    "You explain complex research gaps in simple, engaging language. Be accurate but accessible.",
    `Explain this research gap for ${targetAudience}. Use 3-4 short paragraphs. No jargon. Make it engaging and clear why it matters.

Gap title: ${gap.title}
Description: ${gap.description}
Category: ${gap.category}
Why it matters: ${gap.whyItMatters ?? ""}
Suggested direction: ${gap.suggestedDirection ?? gap.researchSuggestion}

Write the simplified explanation now:`
  );

  return NextResponse.json({ simplified: text, audience: audience ?? "general" });
}
