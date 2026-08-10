import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

const TASK_PROMPTS: Record<string, string> = {
  improve: "Improve this academic text for clarity, precision, and readability. Keep the meaning intact.",
  simplify: "Simplify this text so a non-specialist can understand it. Use plain language.",
  formalize: "Make this text more formal and academic. Use appropriate scholarly language.",
  shorten: "Shorten this text to 50% of its length while keeping all key points.",
  expand: "Expand this text with more detail, context, and supporting explanation.",
  transition: "Improve the transitions and flow between sentences and paragraphs.",
  "active-voice": "Rewrite in active voice. Replace all passive constructions.",
  thesis: "Write a strong, specific thesis statement based on this text.",
  conclusion: "Write a strong conclusion paragraph that synthesizes the main points.",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, task } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const taskPrompt = TASK_PROMPTS[task] ?? TASK_PROMPTS.improve;

  const { text: result } = await llmCall(
    "You are an expert academic writing assistant. Follow the instruction precisely. Return only the improved text, no preamble or explanation.",
    `${taskPrompt}\n\nText:\n${text}`,
    1200
  );

  return NextResponse.json({ result: result.trim() });
}
