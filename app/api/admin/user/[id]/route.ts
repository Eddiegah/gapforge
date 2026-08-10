import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

const ADMIN_EMAIL = "gahedmund146@gmail.com";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { plan, credits_limit, banned } = await req.json();

  if (plan) {
    await sql`UPDATE users SET plan = ${plan}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (typeof credits_limit === "number") {
    await sql`UPDATE user_credits SET credits_limit = ${credits_limit}, updated_at = NOW() WHERE user_id = ${id}`;
  }
  if (typeof banned === "boolean") {
    // Store banned status in notification_prefs for now
    await sql`UPDATE users SET notification_prefs = notification_prefs || '{"banned": ${banned}}'::jsonb WHERE id = ${id}`;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.user?.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft delete — clear sensitive data but keep record
  await sql`UPDATE users SET name = 'Deleted User', email = 'deleted_' || id || '@gapforge.app', image = NULL, updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
