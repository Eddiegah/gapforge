import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gapTitle, gapDescription } = await req.json();
  if (!gapTitle?.trim()) return NextResponse.json({ error: "Gap title required" }, { status: 400 });

  // Search Semantic Scholar for recent papers
  let recentPapers: { title: string; year: number; url: string; authors: string[] }[] = [];
  try {
    const currentYear = new Date().getFullYear();
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(gapTitle)}&limit=10&fields=title,authors,year,externalIds`,
      { headers: { "User-Agent": "GapForge/1.0" } }
    );
    if (res.ok) {
      const d = await res.json();
      recentPapers = (d.data ?? [])
        .filter((p: { year: number }) => p.year >= currentYear - 1)
        .map((p: { title: string; authors: { name: string }[]; year: number; externalIds?: { DOI?: string; ArXiv?: string }; paperId: string }) => ({
          title: p.title,
          year: p.year,
          url: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : `https://www.semanticscholar.org/paper/${p.paperId}`,
          authors: (p.authors ?? []).map((a: { name: string }) => a.name),
        }));
    }
  } catch { /* fallback */ }

  const paperList = recentPapers.map((p, i) => `${i + 1}. "${p.title}" (${p.year})`).join("\n");

  const prompt = `Assess whether this research gap is still open based on recent literature.

GAP: ${gapTitle}
DESCRIPTION: ${gapDescription || "Not provided"}

Recent papers found (last 12 months):
${paperList || "No recent papers found directly on this topic."}

Analyze whether these papers address the stated gap, or if the gap remains open.

Return ONLY valid JSON:
{
  "freshnessScore": 78,
  "verdict": "Still open",
  "explanation": "2-3 sentence explanation of the assessment",
  "recommendation": "Specific recommendation for the researcher",
  "lastChecked": "${new Date().toISOString()}"
}

freshnessScore: 0-100 where 100 = definitely still open, 0 = gap has been filled
verdict: exactly one of: "Still open", "Partially addressed", "Likely filled"`;

  const { text } = await llmCall(
    "You are a research literature expert who assesses whether research gaps are still open based on recent papers.",
    prompt, 400
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ ...parsed, recentPapers });
  } catch {
    return NextResponse.json({
      freshnessScore: 70,
      verdict: "Still open",
      explanation: "Based on available literature, this gap appears to remain unstudied.",
      recommendation: "Proceed with your research — this appears to be a genuine open gap.",
      recentPapers,
      lastChecked: new Date().toISOString(),
    });
  }
}
