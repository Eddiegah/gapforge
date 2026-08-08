import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ messages: [] });

  const rows = await sql`
    SELECT id, role, content, created_at as ts
    FROM ai_messages
    WHERE conversation_id = ${id}
      AND conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = ${session.user.id})
    ORDER BY created_at ASC
  `;
  return NextResponse.json({ messages: rows });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM ai_conversations WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
