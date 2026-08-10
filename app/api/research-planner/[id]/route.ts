import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await sql`DELETE FROM research_goals WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { status, progress } = body;
  await sql`
    UPDATE research_goals
    SET status = COALESCE(${status ?? null}, status),
        progress = COALESCE(${progress ?? null}, progress),
        updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}
