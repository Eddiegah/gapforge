import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { text, tone, purpose } = await req.json() as {
    text: string;
    tone: string;
    purpose?: string;
  };

  if (!text?.trim()) return NextResponse.json({ error: "Text is required." }, { status: 400 });
  if (text.length > 3000) return NextResponse.json({ error: "Text too long. Maximum 3000 characters." }, { status: 400 });

  const toneGuides: Record<string, string> = {
    academic: "Rewrite in formal academic language suitable for peer-reviewed journals. Use precise terminology.",
    simple: "Rewrite in clear, plain language that a non-specialist can easily understand. Avoid jargon.",
    concise: "Rewrite more concisely, cutting unnecessary words while preserving all key meaning. Aim for 30% shorter.",
    fluent: "Rewrite to improve flow and readability while maintaining the same academic register.",
    formal: "Rewrite in formal, professional language with no colloquialisms.",
    creative: "Rewrite with more engaging, vivid language while maintaining academic accuracy.",
  };

  const toneInstruction = toneGuides[tone] ?? toneGuides.academic;
  const purposeContext = purpose ? `Purpose/context: ${purpose}` : "";

  const { text: result } = await llmCallFast(
    "You are an expert academic editor. Paraphrase text accurately — never change the meaning, just the expression.",
    `${toneInstruction}
${purposeContext}

Original text:
"${text}"

Provide ONLY the paraphrased version. Do not add explanations or commentary.`
  );

  return NextResponse.json({ paraphrased: result, original: text, tone });
}
