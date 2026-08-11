import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

// Delete a saved gap
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM saved_gaps WHERE id=${id} AND user_id=${session.user.id}`;
  return NextResponse.json({ ok: true });
}

// Update notes on a saved gap
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { notes, tags } = await req.json();
  await sql`
    UPDATE saved_gaps SET notes=${notes??null}, tags=${tags??[]}
    WHERE id=${id} AND user_id=${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}
