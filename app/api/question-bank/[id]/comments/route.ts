import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const comments = await sql`
      SELECT gc.id, gc.content, gc.created_at,
             COALESCE(u.name, 'Anonymous') as author_name,
             u.image as author_image
      FROM gap_comments gc
      LEFT JOIN users u ON u.id = gc.user_id
      WHERE gc.gap_id = ${id}
      ORDER BY gc.created_at ASC
      LIMIT 50
    `;
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: "Comment too long (max 500 chars)" }, { status: 400 });

  try {
    // Verify the gap exists
    const [gap] = await sql`SELECT id FROM saved_gaps WHERE id = ${id}`;
    if (!gap) return NextResponse.json({ error: "Gap not found" }, { status: 404 });

    const [comment] = await sql`
      INSERT INTO gap_comments (gap_id, user_id, content)
      VALUES (${id}, ${session.user.id}, ${content.trim()})
      RETURNING id, content, created_at
    `;

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        author_name: session.user.name ?? "Anonymous",
        author_image: session.user.image ?? null,
      },
    });
  } catch (err) {
    console.error("[question-bank/comments]", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
