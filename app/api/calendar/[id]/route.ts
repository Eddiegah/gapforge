import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, date, type, priority, completed } = body;

  if (typeof completed === "boolean") {
    await sql`UPDATE research_calendar SET completed = ${completed}, updated_at = NOW() WHERE id = ${id} AND user_id = ${session.user.id}`;
  } else {
    await sql`
      UPDATE research_calendar
      SET title = COALESCE(${title ?? null}, title),
          description = COALESCE(${description ?? null}, description),
          date = COALESCE(${date ?? null}, date),
          type = COALESCE(${type ?? null}, type),
          priority = COALESCE(${priority ?? null}, priority),
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;
  }

  const rows = await sql`SELECT * FROM research_calendar WHERE id = ${id}`;
  return NextResponse.json({ event: rows[0] ?? null });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM research_calendar WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
