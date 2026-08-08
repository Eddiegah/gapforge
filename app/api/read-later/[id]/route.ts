import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { read, tags } = await req.json();

  if (typeof read === "boolean") {
    await sql`UPDATE read_later SET read = ${read}, updated_at = NOW() WHERE id = ${id} AND user_id = ${session.user.id}`;
  }
  if (Array.isArray(tags)) {
    await sql`UPDATE read_later SET tags = ${tags}::text[], updated_at = NOW() WHERE id = ${id} AND user_id = ${session.user.id}`;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM read_later WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
