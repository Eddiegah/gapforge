import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { read, tags } = await req.json();
  const updates: string[] = [];

  if (typeof read === "boolean") {
    await sql`UPDATE read_later SET read = ${read}, updated_at = NOW() WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  }
  if (Array.isArray(tags)) {
    await sql`UPDATE read_later SET tags = ${tags}::text[], updated_at = NOW() WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM read_later WHERE id = ${params.id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
