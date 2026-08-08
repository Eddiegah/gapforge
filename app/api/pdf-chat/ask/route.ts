import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, paper, history } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

  const ctx = paper?.context ?? `Title: ${paper?.title ?? "Unknown"}\nAbstract: ${paper?.abstract ?? "Not available"}`;

  const convHistory = (history ?? []).slice(-6).map((m: { role: string; content: string }) =>
    `${m.role === "user" ? "Researcher" : "Assistant"}: ${m.content}`
  ).join("\n");

  const prompt = `You are a research paper assistant. A researcher has loaded a paper and is asking questions about it.

PAPER CONTEXT:
${ctx}

${convHistory ? `CONVERSATION SO FAR:\n${convHistory}\n` : ""}

RESEARCHER QUESTION: ${question}

Answer clearly and specifically based on the paper. If asked about gaps, methodology, limitations, or findings, be precise. Use markdown for structure. If you don't know something that isn't in the abstract, say so honestly.`;

  const { text } = await llmCall(
    "You are an expert research paper assistant. Help researchers understand papers deeply. Be accurate, specific, and cite what you know from the paper.",
    prompt, 700
  );

  return NextResponse.json({ answer: text });
}
