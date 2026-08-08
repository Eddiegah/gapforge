import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, background, methods, results, conclusion, style, wordLimit } = await req.json();
  if (!background?.trim()) return NextResponse.json({ error: "Background required" }, { status: 400 });

  const styleInstructions: Record<string, string> = {
    structured: "Use clearly labeled sections: Background, Methods, Results, Conclusion.",
    narrative: "Write as flowing academic prose without section headers.",
    ieee: "Follow IEEE abstract style: single paragraph, past tense for methods/results, present for conclusions.",
    apa: "Follow APA abstract style: single paragraph, concise, third person.",
  };

  const prompt = `Write a publication-ready academic abstract.

${title ? `TITLE: ${title}` : ""}
BACKGROUND / PROBLEM: ${background}
${methods ? `METHODOLOGY: ${methods}` : ""}
${results ? `RESULTS: ${results}` : ""}
${conclusion ? `CONCLUSION: ${conclusion}` : ""}

STYLE: ${styleInstructions[style] ?? styleInstructions.structured}
WORD LIMIT: Approximately ${wordLimit ?? 250} words.

Write the abstract now. Return only the abstract text, no preamble.`;

  const { text } = await llmCall(
    "You are an expert academic writer specializing in research abstracts. Write clear, precise, publication-ready abstracts.",
    prompt, 500
  );

  return NextResponse.json({ abstract: text.trim() });
}
