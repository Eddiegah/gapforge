import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { createHash, randomBytes } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ keys: [] });

  const rows = await sql`
    SELECT id, name, key_prefix, created_at, last_used, revoked_at
    FROM api_keys
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ keys: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Check plan
  const planRow = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
  const plan = (planRow[0] as { plan: string })?.plan ?? "free";
  if (!["pro", "team", "institutional"].includes(plan)) {
    return NextResponse.json({ error: "API access requires Pro plan or higher" }, { status: 403 });
  }

  // Generate key: gf_live_<32 random hex chars>
  const rawKey = `gf_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 12);

  const rows = await sql`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
    VALUES (${session.user.id}, ${keyHash}, ${keyPrefix}, ${name.trim()})
    RETURNING id, name, key_prefix, created_at, last_used, revoked_at
  `;

  return NextResponse.json({ key: rawKey, keyRecord: rows[0] });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await sql`
    UPDATE api_keys SET revoked_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}
