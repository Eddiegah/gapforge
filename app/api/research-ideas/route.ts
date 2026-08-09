import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { expertise, interests, resources } = await req.json();

  const prompt = `Generate 8 specific, novel, fundable research project ideas.

RESEARCHER PROFILE:
- Expertise: ${expertise || "General researcher"}
- Interests: ${interests || "Open to any field"}
- Resources: ${resources || "Standard university resources"}

Requirements for each idea:
- Specific enough to form a full research project
- Novel and not already heavily studied
- Feasible with the described resources
- Fundable by NIH, NSF, EU Horizon, or similar

You MUST return valid JSON in exactly this format. No text before or after the JSON:

{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Specific project title here",
      "oneLiner": "One sentence essence",
      "description": "2-3 sentences describing the research and its novelty",
      "noveltyScore": 85,
      "feasibilityScore": 70,
      "impactScore": 80,
      "timeframe": "2-3 years",
      "fundingPotential": "NSF CAREER, $400K",
      "skillsNeeded": ["Skill A", "Skill B", "Skill C"],
      "nextStep": "First concrete action to take",
      "category": "Computational"
    }
  ]
}

Generate all 8 ideas. Categories: Experimental, Computational, Clinical, Review/Meta-analysis, Translational, Interdisciplinary`;

  const { text } = await llmCall(
    "You are a research innovation expert. Generate specific, novel research ideas. Always respond with valid JSON only.",
    prompt, 2000
  );

  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  // Try multiple JSON extraction strategies
  let ideas = null;

  // Strategy 1: standard match
  try {
    const match = cleaned.match(/\{[\s\S]*"ideas"[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.ideas) && parsed.ideas.length > 0) {
        ideas = parsed.ideas;
      }
    }
  } catch { /* try next */ }

  // Strategy 2: find JSON array directly
  if (!ideas) {
    try {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const arr = JSON.parse(arrayMatch[0]);
        if (Array.isArray(arr) && arr.length > 0) ideas = arr;
      }
    } catch { /* try next */ }
  }

  // Strategy 3: try parsing the whole text
  if (!ideas) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.ideas) ideas = parsed.ideas;
      else if (Array.isArray(parsed)) ideas = parsed;
    } catch { /* give up */ }
  }

  if (!ideas || ideas.length === 0) {
    console.error("[Research Ideas] Failed to parse LLM response:", text.slice(0, 500));
    return NextResponse.json({
      error: "Failed to generate ideas. The AI response was malformed. Please try again.",
      ideas: [],
    }, { status: 500 });
  }

  // Ensure all required fields are present with defaults
  const sanitized = ideas.map((idea: Record<string, unknown>, i: number) => ({
    id: idea.id ?? `idea-${i + 1}`,
    title: idea.title ?? "Research Idea",
    oneLiner: idea.oneLiner ?? idea.one_liner ?? "",
    description: idea.description ?? "",
    noveltyScore: Number(idea.noveltyScore ?? idea.novelty_score ?? 75),
    feasibilityScore: Number(idea.feasibilityScore ?? idea.feasibility_score ?? 70),
    impactScore: Number(idea.impactScore ?? idea.impact_score ?? 75),
    timeframe: idea.timeframe ?? "2-3 years",
    fundingPotential: idea.fundingPotential ?? idea.funding_potential ?? "NIH/NSF",
    skillsNeeded: Array.isArray(idea.skillsNeeded) ? idea.skillsNeeded : Array.isArray(idea.skills_needed) ? idea.skills_needed : [],
    nextStep: idea.nextStep ?? idea.next_step ?? "Begin literature review",
    category: idea.category ?? "Research",
  }));

  return NextResponse.json({ ideas: sanitized });
}
