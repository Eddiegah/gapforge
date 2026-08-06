import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import { llmCallFast } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  // Search for very recent papers (last 3 months) on this topic
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

  // Ask LLM to assess if the gap has been filled
  const paperList = recentPapers.length > 0
    ? recentPapers.map((p, i) => `[${i+1}] "${p.title}" (${p.year ?? "recent"})`).join("\n")
    : "No very recent papers found on this exact topic.";

  const { text } = await llmCallFast(
    "You assess whether a research gap has been filled by recent literature. Be honest and precise.",
    `Research gap to validate:
Title: ${gap.title}
Description: ${gap.description.slice(0, 300)}

Recent papers found (last 1-2 years):
${paperList}

Assess:
1. Is this gap still open, partially addressed, or likely filled?
2. Confidence: High / Medium / Low
3. Brief explanation (2-3 sentences)
4. Recommendation for the researcher

Return JSON:
{
  "status": "still_open" | "partially_addressed" | "likely_filled",
  "confidence": "High" | "Medium" | "Low",
  "explanation": "string",
  "recommendation": "string",
  "recentPapersRelevant": number
}
Return ONLY JSON.`
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const assessment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return NextResponse.json({
      assessment,
      recentPapers,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ assessment: null, recentPapers, checkedAt: new Date().toISOString() });
  }
}
