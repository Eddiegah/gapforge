import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { llmCall } from "@/lib/llm/client";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, message, history } = await req.json() as {
    conversationId?: string | null;
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  // Build the LLM prompt
  const contextHistory = history.slice(-8).map(m =>
    `${m.role === "user" ? "Researcher" : "Assistant"}: ${m.content}`
  ).join("\n");

  const prompt = `${contextHistory ? `Previous conversation:\n${contextHistory}\n\n` : ""}Researcher: ${message}

Answer concisely and helpfully. You are a research intelligence assistant for GapForge. Help with research gaps, methodology, academic writing, proposals, funding, and literature. Use markdown for structured responses.`;

  const { text } = await llmCall(
    "You are a helpful research intelligence assistant for GapForge. You help researchers find, validate, and act on research gaps. Be concise, practical, and specific. Use markdown formatting for clarity.",
    prompt,
    900
  );

  // Generate title for new conversations (first message)
  let convId = conversationId;
  let title = "New conversation";

  if (!convId) {
    // Generate a short title from the first message
    const titlePrompt = `Generate a very short title (max 6 words, no punctuation) for a conversation that starts with: "${message}"`;
    try {
      const { text: titleText } = await llmCall("Generate a short conversation title.", titlePrompt, 30);
      title = titleText.trim().replace(/['"]/g, "").slice(0, 60) || message.slice(0, 50);
    } catch {
      title = message.slice(0, 50);
    }

    const convRows = await sql`
      INSERT INTO ai_conversations (user_id, title)
      VALUES (${session.user.id}, ${title})
      RETURNING id
    `;
    convId = (convRows[0] as { id: string }).id;

    // Save user message
    await sql`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message})
    `;
  } else {
    // Save user message to existing conversation
    await sql`
      INSERT INTO ai_messages (conversation_id, role, content)
      VALUES (${convId}, 'user', ${message})
    `;
    // Update conversation updated_at
    await sql`UPDATE ai_conversations SET updated_at = NOW() WHERE id = ${convId}`;
  }

  // Save assistant reply
  await sql`
    INSERT INTO ai_messages (conversation_id, role, content)
    VALUES (${convId}, 'assistant', ${text})
  `;

  return NextResponse.json({ reply: text, conversationId: convId });
}
