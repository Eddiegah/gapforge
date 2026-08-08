import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { expertise, interests, resources } = await req.json();

  const prompt = `Generate 8 specific, novel, fundable research ideas for a researcher with:
EXPERTISE: ${expertise || "General researcher"}
INTERESTS: ${interests || "Open to any field"}
RESOURCES: ${resources || "Standard university resources"}

Each idea must be:
- Specific enough to form a full research project (not vague)
- Novel — not already heavily studied
- Feasible given the described resources
- Fundable by major agencies

Return ONLY valid JSON:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Specific research project title",
      "oneLiner": "One sentence that captures the essence",
      "description": "2-3 sentence description of the research, what makes it novel, and expected contribution",
      "noveltyScore": 88,
      "feasibilityScore": 72,
      "impactScore": 85,
      "timeframe": "2-3 years",
      "fundingPotential": "NIH R01, $500K",
      "skillsNeeded": ["Skill 1", "Skill 2", "Skill 3"],
      "nextStep": "Specific first action to take",
      "category": "Experimental"
    }
  ]
}

Categories: Experimental, Computational, Clinical, Review/Meta-analysis, Translational, Interdisciplinary
All scores 0-100. Generate exactly 8 ideas. Be specific and creative.`;

  const { text } = await llmCall(
    "You are a research innovation expert who generates specific, novel, and fundable research project ideas.",
    prompt, 1600
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ ideas: parsed.ideas ?? [] });
  } catch {
    return NextResponse.json({ ideas: [] });
  }
}
