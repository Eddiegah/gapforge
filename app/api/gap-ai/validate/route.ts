import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { llmCallFast } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const recentQuery = `${gap.title} ${new Date().getFullYear()}`;
  let recentPapers: { title: string; year: number | null; source: string; url: string }[] = [];
  try {
    const result = await orchestrateQuery(recentQuery);
    const currentYear = new Date().getFullYear();
    recentPapers = result.papers
      .filter(p => p.year !== null && p.year >= currentYear - 1)
      .slice(0, 8)
      .map(p => ({ title: p.title, year: p.year, source: p.source, url: p.url }));
  } catch { /* non-critical */ }

  const paperList = recentPapers.length > 0
    ? recentPapers.map((p, i) => `[${i+1}] "${p.title}" (${p.year ?? "recent"})`).join("\n")
    : "No very recent papers found on this exact topic.";

  const { text } = await llmCallFast(
    "You assess whether a research gap has been filled by recent literature. Return only valid JSON.",
    `Research gap: ${gap.title}
Description: ${gap.description.slice(0, 300)}
Recent papers: ${paperList}

Return JSON ONLY:
{
  "status": "still_open",
  "confidence": "High",
  "explanation": "2-3 sentences",
  "recommendation": "string",
  "recentPapersRelevant": 0
}`
  );

  let assessment = null;
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) assessment = JSON.parse(m[0]);
  } catch { /* next */ }
  if (!assessment) {
    try { assessment = JSON.parse(text.trim()); } catch { /* give up */ }
  }

  if (!assessment) {
    return NextResponse.json({ error: "Failed to validate gap. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ assessment, recentPapers, checkedAt: new Date().toISOString() });
}
