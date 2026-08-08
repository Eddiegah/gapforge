import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT id, title, authors, year, url, source, abstract, tags, read, created_at as added_at
    FROM read_later
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, authors = [], year, url, source = "manual", abstract, tags = [] } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO read_later (user_id, title, authors, year, url, source, abstract, tags)
    VALUES (${session.user.id}, ${title.trim()}, ${authors}::text[], ${year ?? null}, ${url ?? null}, ${source}, ${abstract ?? null}, ${tags}::text[])
    RETURNING id, title, authors, year, url, source, abstract, tags, read, created_at as added_at
  `;
  return NextResponse.json({ item: rows[0] });
}
