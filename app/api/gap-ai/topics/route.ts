import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { topic } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "No topic" }, { status: 400 });

  const { text } = await llmCallFast(
    "You suggest related academic research topics. Return only JSON.",
    `For the research topic "${topic}", suggest 8 related subtopics, 4 emerging methodologies, and 4 cross-disciplinary angles.
Return JSON: { "subtopics": string[], "methodologies": string[], "crossDisciplinary": string[] }
Return ONLY JSON.`
  );

  try {
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return NextResponse.json({
      subtopics: data.subtopics ?? [],
      methodologies: data.methodologies ?? [],
      crossDisciplinary: data.crossDisciplinary ?? [],
    });
  } catch {
    return NextResponse.json({ subtopics: [], methodologies: [], crossDisciplinary: [] });
  }
}
