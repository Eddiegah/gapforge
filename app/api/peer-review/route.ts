import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, abstract, field, targetJournal } = await req.json();
  if (!abstract?.trim()) return NextResponse.json({ error: "Abstract required" }, { status: 400 });

  const prompt = `You are a rigorous academic peer reviewer. Review this paper submission.

TITLE: ${title || "Untitled"}
FIELD: ${field || "General research"}
TARGET JOURNAL: ${targetJournal || "Top-tier journal"}
ABSTRACT/TEXT:
${abstract}

Provide a thorough peer review. Return ONLY valid JSON:
{
  "overallScore": 7,
  "verdict": "minor_revision",
  "summary": "One paragraph overall assessment",
  "scores": [
    { "label": "Novelty & Originality", "score": 8, "comment": "Brief comment" },
    { "label": "Methodology", "score": 7, "comment": "Brief comment" },
    { "label": "Significance & Impact", "score": 8, "comment": "Brief comment" },
    { "label": "Clarity & Writing", "score": 6, "comment": "Brief comment" },
    { "label": "Literature Coverage", "score": 7, "comment": "Brief comment" },
    { "label": "Data & Evidence", "score": 7, "comment": "Brief comment" }
  ],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "specificComments": "Detailed line-by-line comments in markdown",
  "suggestedRevisions": ["Revision 1", "Revision 2", "Revision 3", "Revision 4"],
  "recommendedJournals": ["Journal 1", "Journal 2", "Journal 3"]
}

Verdict must be one of: accept, minor_revision, major_revision, reject
Be honest and constructive. Use real academic reviewing standards.`;

  const { text } = await llmCall(
    "You are a rigorous but fair academic peer reviewer with expertise across scientific disciplines.",
    prompt, 1500
  );

  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  let review = null;
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) review = JSON.parse(m[0]);
  } catch { /* next */ }
  if (!review) {
    try { review = JSON.parse(cleaned); } catch { /* give up */ }
  }
  if (!review) return NextResponse.json({ error: "Failed to generate review. Please try again." }, { status: 500 });
  return NextResponse.json({ review });
}
