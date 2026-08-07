import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { claim, topic } = await req.json() as { claim: string; topic?: string };
  if (!claim?.trim()) return NextResponse.json({ error: "Claim required." }, { status: 400 });

  const searchQuery = topic ? `${topic} ${claim.slice(0, 100)}` : claim.slice(0, 150);

  let papers: { title: string; authors: string[]; year: number | null; doi: string | null; url: string; source: string }[] = [];
  try {
    const result = await orchestrateQuery(searchQuery);
    papers = result.papers.slice(0, 8).map(p => ({
      title: p.title, authors: p.authors, year: p.year,
      doi: p.doi, url: p.url, source: p.source,
    }));
  } catch { /* fallback */ }

  const paperList = papers.map((p, i) => `[${i+1}] "${p.title}" — ${p.authors.slice(0,2).join(", ")} (${p.year ?? "n.d."})`).join("\n");

  const { text } = await llmCallFast(
    "You help researchers find the best citations to support their academic claims.",
    `Claim to support: "${claim}"

Papers found from academic sources:
${paperList || "No papers found"}

Identify which papers BEST support this claim and explain why. Also suggest what type of additional evidence would strengthen it.

Return JSON:
{
  "topCitations": [{ "index": number, "reason": string, "quote": string (1 sentence that supports the claim) }],
  "missingEvidence": string (what type of study/data would further strengthen this claim),
  "strengthScore": number 0-100 (how well the available papers support this claim)
}
Return ONLY JSON.`
  );

  try {
    const match = text.match(/\{[\s\S]*\}/);
    const analysis = match ? JSON.parse(match[0]) : {};
    return NextResponse.json({ analysis, papers });
  } catch {
    return NextResponse.json({ analysis: null, papers });
  }
}
