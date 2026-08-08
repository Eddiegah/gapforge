import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, gapContext, pi, institution, amount, format, sectionTitle } = await req.json();

  const formatGuides: Record<string, string> = {
    "nih-r01": "Follow NIH R01 formatting and language conventions. Use scientific precision.",
    "nsf": "Follow NSF proposal guidelines. Emphasize broader impacts and intellectual merit.",
    "eu-horizon": "Follow EU Horizon Europe conventions. Emphasize European Research Area and open science.",
    "wellcome": "Follow Wellcome Trust style. Emphasize health impact and plain language.",
    "general": "Write in clear, compelling grant language suitable for any scientific funder.",
  };

  const prompt = `Write the "${sectionTitle}" section of a ${format} grant proposal.

PROJECT TITLE: ${topic}
PI: ${pi || "Principal Investigator"}
INSTITUTION: ${institution || "Research Institution"}
REQUESTED AMOUNT: ${amount || "Not specified"}
RESEARCH CONTEXT: ${gapContext || "A significant research gap in the field."}

FORMAT GUIDE: ${formatGuides[format] ?? formatGuides["general"]}

Write this section with:
- Appropriate length (400-700 words for most sections)
- Formal grant language
- Specific, evidence-based arguments
- Compelling case for funding
- Appropriate headers and structure where needed

Return only the section content in markdown format.`;

  const { text } = await llmCall(
    "You are an expert grant writer with extensive experience winning NIH, NSF, EU Horizon, and Wellcome Trust grants. Write compelling, specific, fundable grant sections.",
    prompt, 900
  );

  return NextResponse.json({ content: text.trim() });
}
