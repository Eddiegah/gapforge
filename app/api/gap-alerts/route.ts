import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ alerts: [] });

  const rows = await sql`
    SELECT id, gap_title, gap_query, active, last_checked, created_at
    FROM gap_alerts
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ alerts: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { gapTitle, gapQuery, savedGapId } = await req.json();
  if (!gapTitle?.trim() || !gapQuery?.trim()) {
    return NextResponse.json({ error: "Gap title and query required" }, { status: 400 });
  }

  // Check limit — free plan max 3 alerts
  const countRow = await sql`SELECT COUNT(*) as c FROM gap_alerts WHERE user_id = ${session.user.id} AND active = true`;
  const count = Number((countRow[0] as { c: number }).c ?? 0);

  const planRow = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
  const plan = (planRow[0] as { plan: string })?.plan ?? "free";
  const maxAlerts = plan === "free" ? 3 : plan === "starter" ? 10 : 50;

  if (count >= maxAlerts) {
    return NextResponse.json({ error: `Alert limit reached (${maxAlerts} on ${plan} plan)` }, { status: 403 });
  }

  const rows = await sql`
    INSERT INTO gap_alerts (user_id, saved_gap_id, gap_title, gap_query, active)
    VALUES (${session.user.id}, ${savedGapId ?? null}, ${gapTitle.trim()}, ${gapQuery.trim()}, true)
    RETURNING id, gap_title, gap_query, active, last_checked, created_at
  `;
  return NextResponse.json({ alert: rows[0] });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, active } = await req.json();
  await sql`UPDATE gap_alerts SET active = ${active} WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await sql`DELETE FROM gap_alerts WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
