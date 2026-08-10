import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

const TYPE_GUIDE: Record<string, string> = {
  phd: "PhD application cover letter / statement of purpose",
  postdoc: "Postdoctoral position application letter",
  faculty: "Faculty / lecturer position cover letter",
  industry: "Industry research position cover letter",
  fellowship: "Fellowship or scholarship application letter",
  journal: "Journal submission cover letter to the editor",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, position, institution, background, whyThis } = await req.json();

  const prompt = `Write a professional ${TYPE_GUIDE[type] ?? "cover letter"} for ${name || "the applicant"}.

Position/Program: ${position || "Not specified"}
Institution/Journal: ${institution || "Not specified"}
Applicant background: ${background || "A researcher with strong academic background"}
Why this position: ${whyThis || "Strong alignment with research interests"}

Requirements:
- Professional academic tone
- 3-4 paragraphs
- Specific and tailored — not generic
- Shows genuine enthusiasm and fit
- Clear opening, body with qualifications and fit, strong closing
- 300-400 words
- ${type === "journal" ? "Mention the paper title, significance, and why it fits the journal scope" : "Reference specific research experience and goals"}

Write the full letter now. Start with the date and formal salutation.`;

  const { text } = await llmCall(
    "You are an expert academic career advisor who writes compelling, specific cover letters.",
    prompt, 700
  );

  return NextResponse.json({ letter: text.trim() });
}
