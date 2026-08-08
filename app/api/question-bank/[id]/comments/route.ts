import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rows = await sql`
    SELECT
      c.id,
      c.content,
      c.created_at,
      u.name as author_name,
      u.image as author_image
    FROM gap_comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.gap_id = ${params.id}
    ORDER BY c.created_at ASC
    LIMIT 100
  `;
  return NextResponse.json({ comments: rows });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: "Comment too long" }, { status: 400 });

  const rows = await sql`
    INSERT INTO gap_comments (gap_id, user_id, content)
    VALUES (${params.id}, ${session.user.id}, ${content.trim()})
    RETURNING id, content, created_at
  `;

  return NextResponse.json({
    comment: {
      ...rows[0],
      author_name: session.user.name ?? "Anonymous",
      author_image: session.user.image ?? null,
    }
  });
}
