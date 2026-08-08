import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ messages: [] });

  const rows = await sql`
    SELECT id, role, content, created_at as ts
    FROM ai_messages
    WHERE conversation_id = ${params.id}
      AND conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = ${session.user.id})
    ORDER BY created_at ASC
  `;
  return NextResponse.json({ messages: rows });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM ai_conversations WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
