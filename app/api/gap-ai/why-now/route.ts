import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  let recentActivity = 0;
  let recentPaperTitles: string[] = [];
  try {
    const result = await orchestrateQuery(gap.title);
    const currentYear = new Date().getFullYear();
    const recentPapers = result.papers.filter(p => p.year !== null && p.year >= currentYear - 2);
    recentActivity = recentPapers.length;
    recentPaperTitles = recentPapers.slice(0, 4).map(p => p.title);
  } catch { /* non-critical */ }

  const { text } = await llmCallFast(
    "You assess research timing and urgency. Return only valid JSON.",
    `Assess WHY NOW is the right time to address this research gap.
Gap: ${gap.title}
Description: ${gap.description.slice(0, 250)}
Recent activity: ${recentActivity} papers, titles: ${recentPaperTitles.slice(0, 3).join("; ")}

Return JSON ONLY:
{
  "whyNowScore": 8,
  "whyNowLabel": "Perfect timing",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "risks": "One sentence on risk of inaction"
}`
  );

  let whyNow = null;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) whyNow = JSON.parse(m[0]);
  } catch { /* next */ }
  if (!whyNow) {
    try { whyNow = JSON.parse(text.trim()); } catch { /* give up */ }
  }

  if (!whyNow) {
    return NextResponse.json({ error: "Failed to analyze timing. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ whyNow, recentActivity });
}
