import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gap, audience, style } = await req.json();
  if (!gap?.trim()) return NextResponse.json({ error: "Gap required" }, { status: 400 });

  const audienceGuide: Record<string, string> = {
    general: "general public — no jargon, relatable analogies",
    researchers: "academic researchers — can use technical terms",
    policymakers: "government and policy makers — focus on impact and urgency",
    students: "undergraduate and graduate students — educational and inspiring",
  };

  const prompt = `Turn this research gap into a compelling Twitter/X ${style === "thread" ? "thread (5-7 tweets)" : style === "single" ? "single tweet" : "hook tweet"} for ${audienceGuide[audience] ?? audienceGuide.general}.

RESEARCH GAP: ${gap}

Rules:
- Each tweet max 270 characters
- Hook tweet must stop the scroll
- No academic jargon for general audience
- Use numbers and specifics where possible
- End the thread with a call to action or question
- Include relevant hashtags

Return JSON:
{
  "hook": "The most compelling opening tweet",
  "tweets": ["Tweet 1", "Tweet 2", "Tweet 3", "Tweet 4", "Tweet 5"],
  "hashtags": ["#ResearchGap", "#Science", "#relevant"]
}`;

  const { text } = await llmCall(
    "You are a science communicator who makes research accessible and shareable on social media.",
    prompt, 800
  );

  const result = extractJson<{ hook: string; tweets: string[]; hashtags: string[] }>(text);
  if (!result?.tweets?.length) return NextResponse.json({ error: "Failed to generate. Please try again." }, { status: 500 });

  return NextResponse.json({ thread: result });
}
