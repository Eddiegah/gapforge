import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";
import { extractJson } from "@/lib/llm/parseJson";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { myName, myRole, gapTopic, recipientType, purpose } = await req.json();

  const purposeMap: Record<string, string> = {
    collaboration: "proposing a research collaboration",
    mentorship: "requesting mentorship",
    data: "requesting data or resource sharing",
    feedback: "asking for feedback on a research idea",
    "join-lab": "inquiring about joining their research group",
  };

  const recipientMap: Record<string, string> = {
    professor: "a professor/faculty member",
    postdoc: "a postdoctoral researcher",
    industry: "an industry researcher",
    peer: "a peer researcher at similar career stage",
    funder: "a grant funding officer",
  };

  const prompt = `Write a professional cold email from ${myName || "a researcher"} (${myRole || "researcher"}) to ${recipientMap[recipientType] ?? recipientType}, ${purposeMap[purpose] ?? purpose}.

Research topic: "${gapTopic}"

Requirements:
- Professional but warm tone
- Specific about the research gap (not generic)
- Shows genuine interest in their work
- Clear ask in 1 sentence
- 150-200 words maximum
- No excessive flattery
- Ends with clear next step

Return JSON:
{"subject": "email subject line", "body": "full email body text"}`;

  const { text } = await llmCall(
    "You write professional, specific, concise academic cold emails that get replies.",
    prompt, 500
  );

  const result = extractJson<{ subject: string; body: string }>(text);
  if (!result?.subject || !result?.body) {
    return NextResponse.json({ error: "Failed to generate email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ email: result });
}
