import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gapTitle, gapDescription, field } = await req.json();
  if (!gapTitle?.trim()) return NextResponse.json({ error: "Gap title required" }, { status: 400 });

  const prompt = `Generate a comprehensive startup idea based on this research gap:

GAP: ${gapTitle}
DESCRIPTION: ${gapDescription || "Not provided"}
FIELD: ${field || "General research"}

Return ONLY valid JSON:
{
  "startupName": "Catchy startup name",
  "tagline": "One-line value proposition",
  "uniqueAdvantage": "What makes this startup uniquely positioned to solve this problem",
  "problem": "2-3 sentence problem statement backed by the gap",
  "solution": "2-3 sentence description of the product/service solution",
  "targetMarkets": [
    { "segment": "Primary market", "size": "$XB market", "pain": "Specific pain point" },
    { "segment": "Secondary market", "size": "$XM market", "pain": "Specific pain point" },
    { "segment": "Tertiary market", "size": "$XM market", "pain": "Specific pain point" }
  ],
  "businessModel": "Revenue model — SaaS/marketplace/freemium/etc with pricing",
  "mvpFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "competitors": [
    { "name": "Competitor 1", "weakness": "What they don't do well" },
    { "name": "Competitor 2", "weakness": "What they don't do well" },
    { "name": "Competitor 3", "weakness": "What they don't do well" }
  ],
  "fundingSources": [
    { "source": "Funder name", "amount": "$X-Xk", "fit": "Why this funder is a good fit" },
    { "source": "Funder name", "amount": "$X-Xk", "fit": "Why this funder is a good fit" },
    { "source": "Funder name", "amount": "$X-Xk", "fit": "Why this funder is a good fit" }
  ],
  "goToMarket": "3-4 sentence go-to-market strategy",
  "actionPlan": [
    { "day": "Days 1-30", "action": "Specific action" },
    { "day": "Days 31-60", "action": "Specific action" },
    { "day": "Days 61-90", "action": "Specific action" }
  ]
}`;

  const { text } = await llmCall(
    "You are a research strategy expert who builds compelling, fundable startup ideas from research gaps.",
    prompt, 1400
  );

  // Robust JSON extraction with markdown stripping
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  let startup = null;
  for (const strategy of [
    () => { const m = cleaned.match(/\{[\s\S]*"startupName"[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; },
    () => JSON.parse(cleaned),
  ]) {
    try { startup = strategy(); if (startup?.startupName) break; } catch { /* next */ }
  }

  if (!startup) {
    return NextResponse.json({ error: "Failed to generate startup idea. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ startup });
}
