import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { gap } = await req.json() as { gap: DetectedGap };
  if (!gap?.title) return NextResponse.json({ error: "No gap provided." }, { status: 400 });

  const citations = gap.citations
    .map((c, i) => `[${i + 1}] ${c.authors.slice(0, 3).join(", ")}${c.authors.length > 3 ? " et al." : ""}. "${c.title}". ${c.year ?? "n.d."}. ${c.doi ? `DOI: ${c.doi}` : c.url}`)
    .join("\n");

  const system = `You are an expert academic research proposal writer. Write clear, specific, compelling research proposals that directly address identified gaps. Use formal academic language. Structure the proposal with the exact sections requested.`;

  const prompt = `Write a complete research proposal for the following identified research gap.

GAP TITLE: ${gap.title}
CATEGORY: ${gap.category}
DESCRIPTION: ${gap.description}
WHAT'S MISSING: ${gap.whatsMissing ?? gap.description}
WHY IT MATTERS: ${gap.whyItMatters ?? ""}
WHY UNRESOLVED: ${gap.whyUnresolved ?? ""}
SUGGESTED DIRECTION: ${gap.suggestedDirection ?? gap.researchSuggestion}

SUPPORTING LITERATURE:
${citations || "No citations available"}

Write a structured research proposal with these exact sections. Be specific, cite the supporting literature using [N] notation, and make it immediately usable:

1. **Title** — A precise, academic title for the proposed research
2. **Abstract** — 150-word summary of the proposed research
3. **Introduction & Background** — Context, why this gap exists, what's been done so far (cite the supporting papers)
4. **Research Objectives** — 3-5 specific, measurable objectives
5. **Methodology** — Specific methods, datasets, approaches to address the gap
6. **Expected Outcomes** — Concrete, testable predictions
7. **Significance & Impact** — Why this research matters and who benefits
8. **Timeline** — Phased 12-18 month research timeline
9. **References** — Full citation list

Return as plain text with markdown formatting.`;

  const { text } = await llmCall(system, prompt, 3000);

  return NextResponse.json({ proposal: text });
}
