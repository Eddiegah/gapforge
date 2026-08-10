import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const { id, mid } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Toggle the milestone done state in the JSONB array
  const rows = await sql`SELECT milestones FROM research_goals WHERE id = ${id} AND user_id = ${session.user.id}`;
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const milestones = (rows[0].milestones as { id: string; text: string; done: boolean }[]) ?? [];
  const updated = milestones.map(m => m.id === mid ? { ...m, done: !m.done } : m);
  const progress = milestones.length > 0 ? Math.round((updated.filter(m => m.done).length / updated.length) * 100) : 0;

  await sql`
    UPDATE research_goals
    SET milestones = ${JSON.stringify(updated)}::jsonb, progress = ${progress}, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true, progress });
}
