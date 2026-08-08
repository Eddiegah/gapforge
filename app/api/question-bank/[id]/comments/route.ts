import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`
    SELECT
      c.id,
      c.content,
      c.created_at,
      u.name as author_name,
      u.image as author_image
    FROM gap_comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.gap_id = ${id}
    ORDER BY c.created_at ASC
    LIMIT 100
  `;
  return NextResponse.json({ comments: rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const rows = await sql`
    INSERT INTO gap_comments (gap_id, user_id, content)
    VALUES (${id}, ${session.user.id}, ${content.trim()})
    RETURNING id, content, created_at
  `;

  return NextResponse.json({
    comment: {
      ...(rows[0] as object),
      author_name: session.user.name ?? "Anonymous",
      author_image: session.user.image ?? null,
    }
  });
}
