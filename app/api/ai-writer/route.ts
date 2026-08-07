import { NextRequest, NextResponse } from "next/server";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 60;

type Section = "title" | "abstract" | "introduction" | "methodology" | "results" | "discussion" | "conclusion" | "full";

const SECTION_PROMPTS: Record<Section, string> = {
  title: "Generate 5 strong academic paper title options.",
  abstract: "Write a structured academic abstract (Background, Objectives, Methods, Results, Conclusions) in 200-250 words.",
  introduction: "Write a compelling Introduction section (600-800 words) covering: background, problem statement, research gap, objectives, and paper structure.",
  methodology: "Write a detailed Methodology section (500-700 words) covering: research design, participants/data, instruments, procedure, and analysis approach.",
  results: "Write a Results section placeholder (400-500 words) with appropriate subsections and example findings structure.",
  discussion: "Write a Discussion section (600-700 words) covering: interpretation of findings, comparison with literature, implications, limitations, and future directions.",
  conclusion: "Write a Conclusion section (200-300 words) summarizing key findings and contributions.",
  full: "Write a complete academic paper structure with all sections: Abstract, Introduction, Methodology, Results, Discussion, Conclusion, and References. Each section should be substantive.",
};

export async function POST(req: NextRequest) {
  const { topic, section, tone, field, additionalContext } = await req.json() as {
    topic: string;
    section: Section;
    tone?: string;
    field?: string;
    additionalContext?: string;
  };

  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const toneGuide = tone === "simple" ? "Write in clear, accessible language avoiding unnecessary jargon." :
    tone === "technical" ? "Write in precise technical academic language appropriate for expert readers." :
    "Write in standard academic language suitable for peer-reviewed journals.";

  const fieldContext = field ? `Field: ${field}. ` : "";
  const extra = additionalContext ? `\nAdditional context: ${additionalContext}` : "";

  const sectionInstruction = SECTION_PROMPTS[section] ?? SECTION_PROMPTS.abstract;

  const { text } = await llmCall(
    `You are an expert academic writer. ${toneGuide} Use proper academic structure and citations format [Author, Year] where appropriate.`,
    `Research topic: "${topic}"
${fieldContext}${extra}

${sectionInstruction}

Write the content now. Use markdown headers for structure. Be specific and substantive — avoid generic filler.`,
    section === "full" ? 4000 : 1500
  );

  return NextResponse.json({ content: text, section, topic });
}
