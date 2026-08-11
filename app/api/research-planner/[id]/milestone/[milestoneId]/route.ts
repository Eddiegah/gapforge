import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

// Toggle a milestone done/undone
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, milestoneId } = await params;

  try {
    const [goal] = await sql`
      SELECT milestones, progress FROM research_goals WHERE id=${id} AND user_id=${session.user.id}
    `;
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const milestones = (goal.milestones as { id: string; text: string; done: boolean }[]) ?? [];
    const updated = milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m);
    const doneCount = updated.filter(m => m.done).length;
    const newProgress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : 0;

    await sql`
      UPDATE research_goals
      SET milestones=${JSON.stringify(updated)}::jsonb, progress=${newProgress}, updated_at=NOW()
      WHERE id=${id} AND user_id=${session.user.id}
    `;
    return NextResponse.json({ ok: true, progress: newProgress });
  } catch (err) {
    console.error("[research-planner/milestone PATCH]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
