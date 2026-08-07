import { NextRequest, NextResponse } from "next/server";
import { llmCallFast } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { text } = await req.json() as { text: string };
  if (!text?.trim()) return NextResponse.json({ error: "Text required." }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "Text too long. Max 5000 characters." }, { status: 400 });

  const { text: result } = await llmCallFast(
    "You are an expert at detecting AI-generated academic text. Analyze text for specific linguistic patterns that distinguish AI from human writing.",
    `Analyze this text and assess the likelihood it was AI-generated.

Look for these AI indicators:
1. Overuse of hedging phrases ("It is worth noting", "It is important to", "Furthermore", "Moreover")
2. Perfect sentence length variation (suspiciously consistent)  
3. Generic transitions without specific citations
4. Lack of personal research insights or specific data
5. Overly formal and uniform tone
6. Phrases like "In conclusion", "In summary" used mechanically
7. Missing author's voice/perspective
8. Repetitive sentence structures

Text to analyze:
"${text.slice(0, 3000)}"

Return JSON:
{
  "aiScore": number 0-100 (0 = definitely human, 100 = definitely AI),
  "verdict": "Likely Human" | "Possibly AI" | "Likely AI" | "Almost Certainly AI",
  "confidence": "Low" | "Medium" | "High",
  "indicators": string[] (specific phrases or patterns found, max 5),
  "humanSignals": string[] (human-like elements found, max 3),
  "summary": string (2-3 sentences explaining the assessment)
}
Return ONLY JSON.`
  );

  try {
    const match = result.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : null;
    return NextResponse.json(data ?? { error: "Could not analyze" });
  } catch {
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
