import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const topCitations = gap.citations.slice(0, 3)
    .map((c, i) => `[${i + 1}] ${c.authors[0] ?? "Unknown"} et al. "${c.title}" (${c.year ?? "n.d."})`)
    .join("\n");

  const prompt = `Write a research proposal for this gap:

TITLE: ${gap.title}
DESCRIPTION: ${gap.description.slice(0, 300)}
DIRECTION: ${(gap.suggestedDirection ?? gap.researchSuggestion ?? "").slice(0, 200)}
REFERENCES: ${topCitations || "None"}

Include these sections with markdown headers:
## Title
## Abstract (100 words)
## Introduction & Background
## Research Objectives (3 bullet points)
## Methodology
## Expected Outcomes
## Significance & Impact
## Timeline (6 months phases)
## References

Be specific and cite [1], [2] etc. Keep each section concise.`;

  try {
    const { text } = await llmCall(
      "You write concise, specific academic research proposals. Use markdown headers. Be direct.",
      prompt,
      2000
    );
    return NextResponse.json({ proposal: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
