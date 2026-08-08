import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, date, type, linked_url } = await req.json();
  const rows = await sql`
    UPDATE research_timeline
    SET title = COALESCE(${title ?? null}, title),
        description = ${description ?? null},
        date = COALESCE(${date ?? null}, date),
        type = COALESCE(${type ?? null}, type),
        linked_url = ${linked_url ?? null},
        updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
    RETURNING id, title, description, date, type, linked_url, created_at
  `;
  return NextResponse.json({ event: rows[0] ?? null });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM research_timeline WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
