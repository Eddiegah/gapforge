import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, abstract, type } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Find the top 10 academic journals for a ${type ?? "research"} paper on: "${topic}"
${abstract ? `\nAbstract: ${abstract.slice(0, 300)}` : ""}

Return JSON only:
{
  "journals": [
    {
      "id": "j1",
      "name": "Journal full name",
      "publisher": "Publisher name",
      "impactFactor": 8.5,
      "scope": "What this journal covers in 1 sentence",
      "acceptanceRate": "15-20%",
      "reviewTime": "6-8 weeks",
      "openAccess": false,
      "website": "https://...",
      "whyFit": "Specific reason this journal fits this paper topic (2 sentences)",
      "matchScore": 92,
      "rank": "Q1"
    }
  ]
}

Include Q1, Q2, Q3 journals — a mix of prestigious and accessible.
Use real journal names and realistic impact factors for 2024-2025.
Sort by matchScore descending.`;

  const { text } = await llmCall(
    "You are an expert academic publishing advisor who matches papers to appropriate journals.",
    prompt, 1600
  );

  const result = extractJson<{ journals: Journal[] }>(text);
  if (!result?.journals?.length) return NextResponse.json({ error: "Failed to find journals. Please try again." }, { status: 500 });

  return NextResponse.json({ journals: result.journals });
}

interface Journal {
  id: string; name: string; publisher: string; impactFactor: number;
  scope: string; acceptanceRate: string; reviewTime: string;
  openAccess: boolean; website: string; whyFit: string; matchScore: number; rank: string;
}
