import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { randomBytes, createHash } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const keys = await sql`
    SELECT id, key_prefix, name, last_used, created_at
    FROM api_keys
    WHERE user_id = ${session.user.id} AND revoked_at IS NULL
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [user] = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
  if (!["institutional", "team"].includes(user?.plan as string)) {
    return NextResponse.json({ error: "API keys require an institutional or team plan." }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Key name is required." }, { status: 400 });

  const rawKey = `gf_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 10);

  const [row] = await sql`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, name)
    VALUES (${session.user.id}, ${keyHash}, ${keyPrefix}, ${name.trim()})
    RETURNING id, key_prefix, name, last_used, created_at
  `;

  return NextResponse.json({ key: rawKey, meta: row });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await req.json();
  await sql`
    UPDATE api_keys SET revoked_at = NOW()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
