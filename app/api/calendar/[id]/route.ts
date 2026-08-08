import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, date, type, priority, completed } = body;

  if (typeof completed === "boolean") {
    await sql`UPDATE research_calendar SET completed = ${completed}, updated_at = NOW() WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  } else {
    await sql`
      UPDATE research_calendar
      SET title = COALESCE(${title ?? null}, title),
          description = COALESCE(${description ?? null}, description),
          date = COALESCE(${date ?? null}, date),
          type = COALESCE(${type ?? null}, type),
          priority = COALESCE(${priority ?? null}, priority),
          updated_at = NOW()
      WHERE id = ${params.id} AND user_id = ${session.user.id}
    `;
  }

  const rows = await sql`SELECT * FROM research_calendar WHERE id = ${params.id}`;
  return NextResponse.json({ event: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM research_calendar WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
