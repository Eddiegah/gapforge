import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, paperType } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const prompt = `Find the top 10 academic conferences for a ${paperType ?? "full paper"} on: "${topic}"

Return ONLY valid JSON — no text before or after:
{
  "conferences": [
    {
      "id": "conf1",
      "name": "Full conference name",
      "shortName": "ACRONYM",
      "description": "What this covers",
      "field": "Primary field",
      "rank": "A*",
      "website": "https://...",
      "typicalDeadline": "October 2025",
      "typicalDate": "March 2026",
      "location": "City, Country",
      "acceptanceRate": "20-25%",
      "submissionTypes": ["Full paper"],
      "whyFit": "Why this fits",
      "matchScore": 92
    }
  ]
}`;

  const { text } = await llmCall(
    "You are an expert academic advisor. Return only valid JSON, no other text.",
    prompt, 1600
  );

  let conferences = null;
  try {
    const m = text.match(/\{[\s\S]*"conferences"[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      if (Array.isArray(parsed.conferences) && parsed.conferences.length > 0) conferences = parsed.conferences;
    }
  } catch { /* next */ }
  if (!conferences) {
    try { const p = JSON.parse(text.trim()); conferences = p.conferences ?? null; } catch { /* give up */ }
  }

  if (!conferences || conferences.length === 0) {
    return NextResponse.json({ error: "Failed to find conferences. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ conferences });
}
