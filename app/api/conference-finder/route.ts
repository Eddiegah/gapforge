import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, paperType } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Find the top 10 academic conferences for a ${paperType ?? "full paper"} on this topic: "${topic}"

Return ONLY valid JSON:
{
  "conferences": [
    {
      "id": "conf1",
      "name": "Full conference name",
      "shortName": "ACRONYM",
      "description": "What this conference covers (1 sentence)",
      "field": "Primary field",
      "rank": "A* or A or B or C or Workshop",
      "website": "https://...",
      "typicalDeadline": "Month YYYY",
      "typicalDate": "Month YYYY",
      "location": "City, Country or Virtual",
      "acceptanceRate": "20-25%",
      "submissionTypes": ["Full paper", "Short paper"],
      "whyFit": "Specific reason this conference fits the given topic (2 sentences)",
      "matchScore": 92
    }
  ]
}

Include a mix of: top-tier (A*), strong (A), accessible (B), and workshop venues.
Use real conference names, real websites, and realistic deadlines for 2025-2026.
Sort by matchScore descending.`;

  const { text } = await llmCall(
    "You are an expert academic advisor helping researchers find the best conferences for their work.",
    prompt, 1600
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ conferences: parsed.conferences ?? [] });
  } catch {
    return NextResponse.json({ conferences: [] });
  }
}
