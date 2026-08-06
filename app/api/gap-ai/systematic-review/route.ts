import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import { orchestrateQuery } from "@/lib/gapAI/orchestrator";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required." }, { status: 400 });

  // Fetch papers
  const result = await orchestrateQuery(topic);
  if (result.papers.length === 0) return NextResponse.json({ error: "No papers found." }, { status: 404 });

  const paperList = result.papers.slice(0, 20).map((p, i) =>
    `[${i+1}] "${p.title}" — ${p.authors.slice(0,2).join(", ")} (${p.year ?? "n.d."}) [${p.source}]`
  ).join("\n");

  const { text } = await llmCall(
    "You write structured systematic reviews of academic literature. Be precise, cite papers by number, identify consensus and contradictions honestly.",
    `Write a systematic review outline for: "${topic}"

Papers found (${result.papers.length} total, showing top 20):
${paperList}

Write a PRISMA-style systematic review with these sections:
## Overview
## Search Strategy & Sources
## Key Themes (identify 3-4 major themes across the papers)
## Consensus Areas (what the literature agrees on)
## Contradictions & Debates (where papers disagree)
## Research Gaps (what's missing from the literature)
## Recommendations for Future Research
## References (cite [N] for papers above)

Be specific. Cite papers by number. This should be immediately useful to a researcher.`,
    2500
  );

  return NextResponse.json({
    review: text,
    topic,
    papersAnalyzed: result.papers.length,
    sourcesQueried: result.sourcesQueried,
  });
}
