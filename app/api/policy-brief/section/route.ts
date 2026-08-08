import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sectionTitle, sectionPrompt, gapTitle, gapDesc, audience, country, urgency } = await req.json();

  const audienceMap: Record<string, string> = {
    government: "national government ministers and cabinet members",
    parliament: "members of parliament and legislative committees",
    ngo: "NGO directors and civil society leaders",
    un: "UN agencies and international development bodies",
    donors: "international development donors and funding agencies",
    local: "local government officials and municipal leaders",
  };

  const prompt = `Write the "${sectionTitle}" section of a policy brief.

ISSUE: ${gapTitle}
EVIDENCE: ${gapDesc || "A significant research gap requiring policy attention."}
AUDIENCE: ${audienceMap[audience] ?? audience}
COUNTRY/REGION: ${country}
URGENCY: ${urgency}

TASK: ${sectionPrompt}

Write in clear, non-technical language appropriate for policy makers. Be specific, action-oriented, and reference the ${country} context where relevant. Use evidence and data. Be concise — policy makers have limited time.

Return only the section content in markdown.`;

  const { text } = await llmCall(
    "You are an expert policy advisor who writes clear, evidence-based policy briefs for government and NGO decision-makers.",
    prompt, 700
  );

  return NextResponse.json({ content: text.trim() });
}
