import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionId, prompt, topic, gapContext, field } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "Topic required" }, { status: 400 });

  const systemPrompt = `You are an expert academic research writer with deep knowledge across scientific disciplines. 
Write in formal academic English. Use precise language. Cite hypothetical references in APA format where appropriate. 
Do not use bullet points for narrative sections — use proper academic prose. 
Field: ${field || "general research"}.`;

  const userPrompt = `Write the "${sectionId}" section of a research paper with the following context:

RESEARCH TOPIC: ${topic}

RESEARCH FIELD: ${field || "Not specified"}

GAP CONTEXT:
${gapContext || "A significant but unstudied gap in the literature."}

SECTION TASK: ${prompt}

Write this section in full academic style, approximately 400-600 words. Use proper paragraph structure. Be specific and evidence-grounded.`;

  const { text } = await llmCall(systemPrompt, userPrompt, 900);

  return NextResponse.json({ content: text });
}
