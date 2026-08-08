import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { term, context, level } = await req.json();
  if (!term?.trim()) return NextResponse.json({ error: "Term required" }, { status: 400 });

  const levelGuides: Record<string, string> = {
    elementary: "Explain as if to a curious 10-year-old. Use simple words, no jargon. Maximum 2 short sentences.",
    undergraduate: "Explain as if to a first-year university student. Some technical terms OK if briefly defined.",
    graduate: "Explain as if to a graduate student familiar with the field. Use proper terminology.",
    expert: "Explain as if to a domain expert. Be precise, technical, and concise.",
  };

  const prompt = `Explain the term "${term}"${context ? ` in the context of ${context}` : ""}.

Level: ${levelGuides[level ?? "undergraduate"]}

Return ONLY valid JSON:
{
  "term": "${term}",
  "simple": "Clear explanation at the requested level (2-4 sentences)",
  "analogy": "A memorable real-world analogy that makes it click (1-2 sentences)",
  "whyItMatters": "Why researchers care about this — its importance in the field (1-2 sentences)",
  "relatedTerms": ["related term 1", "related term 2", "related term 3", "related term 4"],
  "deeperReading": "A specific suggestion for learning more — a textbook, author, or resource",
  "level": "${level ?? "undergraduate"}"
}`;

  const { text } = await llmCall(
    "You are an expert science communicator who can explain any academic concept clearly at any level.",
    prompt, 600
  );

  try {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    return NextResponse.json({ explanation: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to parse explanation" }, { status: 500 });
  }
}
