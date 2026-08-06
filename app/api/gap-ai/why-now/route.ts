import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  // Get very recent papers (last 2 years)
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
    "You assess research timing and urgency. Be specific and honest.",
    `Assess WHY NOW is the right time to address this research gap.

Gap: ${gap.title}
Description: ${gap.description.slice(0, 250)}
Recent activity (last 2 years): ${recentActivity} related papers found
Recent papers: ${recentPaperTitles.slice(0, 3).join("; ")}

Provide a JSON response:
{
  "whyNowScore": number 1-10 (how urgent/timely this is RIGHT NOW),
  "whyNowLabel": "Perfect timing" | "Good timing" | "Emerging opportunity" | "Early but promising" | "Not urgent yet",
  "reasons": string[] (3 specific reasons why now is the right time — technology, data availability, funding trends, recent breakthroughs),
  "risks": string (1 sentence on what happens if this gap isn't addressed soon)
}
Return ONLY JSON.`
  );

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return NextResponse.json({ whyNow: data, recentActivity });
  } catch {
    return NextResponse.json({ whyNow: null, recentActivity });
  }
}
