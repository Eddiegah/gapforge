import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { targetUserId, action } = await req.json();
  if (targetUserId === session.user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  if (action === "follow") {
    await sql`INSERT INTO user_follows (follower_id, following_id) VALUES (${session.user.id}, ${targetUserId}) ON CONFLICT DO NOTHING`;
  } else {
    await sql`DELETE FROM user_follows WHERE follower_id = ${session.user.id} AND following_id = ${targetUserId}`;
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ following: [], followers: [], feed: [] });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "following";

  if (type === "feed") {
    // Recent gaps from people you follow
    const feed = await sql`
      SELECT sg.id, sg.gap_json, sg.created_at, u.name as author_name, u.image as author_image, u.id as author_id
      FROM saved_gaps sg
      JOIN user_follows uf ON uf.following_id = sg.user_id
      JOIN users u ON u.id = sg.user_id
      WHERE uf.follower_id = ${session.user.id}
      ORDER BY sg.created_at DESC LIMIT 20
    `;
    return NextResponse.json({ feed });
  }

  if (type === "following") {
    const following = await sql`
      SELECT u.id, u.name, u.image, rp.research_areas, rp.keywords
      FROM user_follows uf JOIN users u ON u.id = uf.following_id
      LEFT JOIN research_profiles rp ON rp.user_id = u.id
      WHERE uf.follower_id = ${session.user.id}
    `;
    return NextResponse.json({ following });
  }

  const followers = await sql`
    SELECT u.id, u.name, u.image FROM user_follows uf JOIN users u ON u.id = uf.follower_id
    WHERE uf.following_id = ${session.user.id}
  `;
  return NextResponse.json({ followers });
}
