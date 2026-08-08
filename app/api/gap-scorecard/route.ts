import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, context } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Generate a comprehensive research gap score card for:

TOPIC: ${topic}
CONTEXT: ${context || "No additional context provided."}

Return ONLY valid JSON:
{
  "gapTitle": "${topic}",
  "field": "Research field name",
  "overallScore": 72,
  "verdict": "Pursue with caution",
  "confidence": 75,
  "novelty": 85,
  "feasibility": 65,
  "fundingPotential": 80,
  "competitionLevel": 30,
  "impactScore": 82,
  "timeToPublish": "2-3 years",
  "estimatedCost": "$150,000 - $400,000",
  "requiredExpertise": ["Expertise 1", "Expertise 2", "Expertise 3"],
  "topFunders": ["NIH", "NSF", "Wellcome Trust"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "recommendedAction": "Specific action recommendation paragraph"
}

Verdict must be one of: "Strongly pursue", "Pursue with caution", "Low priority", "Not recommended"
All scores are 0-100. competitionLevel: 0 = no competition, 100 = highly competitive field.
Be specific, realistic, and evidence-based.`;

  const { text } = await llmCall(
    "You are a research strategy expert who evaluates research gaps for scientific merit, feasibility, and strategic value.",
    prompt, 900
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ scorecard: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse scorecard" }, { status: 500 });
  }
}
