import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

const FORMAT_GUIDE: Record<string, string> = {
  nih: "NIH R01 format: Specific Aims, Significance, Innovation, Approach",
  nsf: "NSF format: Intellectual Merit and Broader Impacts",
  eu: "EU Horizon Europe: Excellence, Impact, Implementation",
  general: "General grant proposal format",
};

export async function POST(req: NextRequest) {
  const { gap, format } = await req.json() as { gap: DetectedGap; format?: string };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const fmt = format ?? "general";
  const fmtGuide = FORMAT_GUIDE[fmt] ?? FORMAT_GUIDE.general;
  const citations = gap.citations.slice(0, 3).map((c, i) => `[${i+1}] "${c.title}" (${c.year})`).join("; ");

  const { text } = await llmCall(
    "You write compelling academic grant proposals. Use the specified format. Be specific and persuasive.",
    `Write a grant proposal using ${fmtGuide}.

Gap: ${gap.title}
Description: ${gap.description.slice(0, 250)}
Why it matters: ${(gap.whyItMatters ?? "").slice(0, 150)}
Direction: ${(gap.suggestedDirection ?? gap.researchSuggestion ?? "").slice(0, 150)}
References: ${citations}

Write a complete draft with markdown section headers. Keep each section concise but compelling.`,
    1800
  );

  return NextResponse.json({ grant: text, format: fmt });
}
