import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save gaps." }, { status: 401 });
  }

  const body = await req.json();
  const { searchId, gap, notes, tags } = body;

  if (!gap) {
    return NextResponse.json({ error: "No gap provided." }, { status: 400 });
  }

  const [row] = await sql`
    INSERT INTO saved_gaps (user_id, search_id, gap_json, notes, tags)
    VALUES (${session.user.id}, ${searchId ?? null}, ${JSON.stringify(gap)}, ${notes ?? null}, ${tags ?? []})
    RETURNING id
  `;

  const savedId = row?.id as string | undefined;

  // Create alert for this saved gap (non-blocking)
  if (savedId) {
    try {
      const query: string = gap.title ?? "research gap";
      await sql`
        INSERT INTO gap_alerts (user_id, saved_gap_id, gap_title, gap_query)
        VALUES (${session.user.id}, ${savedId}, ${gap.title ?? "Untitled gap"}, ${query})
        ON CONFLICT DO NOTHING
      `;
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ savedId });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to view saved gaps." }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, gap_json, notes, tags, created_at
    FROM saved_gaps
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ saved: rows });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await req.json();
  await sql`DELETE FROM saved_gaps WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
