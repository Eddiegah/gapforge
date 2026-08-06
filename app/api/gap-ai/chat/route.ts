import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { message, gap, history } = await req.json() as {
    message: string;
    gap: DetectedGap;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim() || !gap) {
    return NextResponse.json({ error: "Message and gap required." }, { status: 400 });
  }

  const gapContext = `
Research Gap: ${gap.title}
Category: ${gap.category}
Description: ${gap.description}
What's Missing: ${gap.whatsMissing ?? ""}
Why It Matters: ${gap.whyItMatters ?? ""}
Suggested Direction: ${gap.suggestedDirection ?? gap.researchSuggestion ?? ""}
Supporting papers: ${gap.citations.map((c, i) => `[${i+1}] "${c.title}" (${c.year})`).join("; ")}
`.trim();

  const conversationHistory = history.slice(-6).map(m =>
    `${m.role === "user" ? "Researcher" : "Assistant"}: ${m.content}`
  ).join("\n");

  const prompt = `You are a helpful research intelligence assistant. A researcher has found this gap and wants to explore it further.

${gapContext}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ""}
Researcher: ${message}

Answer concisely and helpfully. Focus on practical research guidance. If asked about methods, funding, collaborators, or next steps — be specific.`;

  const { text } = await llmCall(
    "You are a helpful research assistant who helps researchers explore and act on identified research gaps.",
    prompt,
    800
  );

  return NextResponse.json({ reply: text });
}
