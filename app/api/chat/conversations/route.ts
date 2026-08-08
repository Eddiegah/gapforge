import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ conversations: [] });

  const rows = await sql`
    SELECT id, title, updated_at
    FROM ai_conversations
    WHERE user_id = ${session.user.id}
    ORDER BY updated_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ conversations: rows });
}
