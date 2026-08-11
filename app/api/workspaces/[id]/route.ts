import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const [ws] = await sql`
      SELECT w.id, w.name, w.description, w.owner_id, w.plan, w.created_at,
             wm.role
      FROM workspaces w
      JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ${session.user.id}
      WHERE w.id = ${id}
    `;
    if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const members = await sql`
      SELECT wm.user_id, wm.role, wm.joined_at, u.name, u.image
      FROM workspace_members wm JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = ${id}
    `;

    const items = await sql`
      SELECT wi.id, wi.item_type, wi.item_json, wi.notes, wi.tags, wi.created_at,
             u.name as added_by_name
      FROM workspace_items wi
      LEFT JOIN users u ON u.id = wi.added_by
      WHERE wi.workspace_id = ${id}
      ORDER BY wi.created_at DESC LIMIT 50
    `;

    // Get comments for each item
    const itemIds = (items as { id: string }[]).map(i => i.id);
    const comments = itemIds.length > 0 ? await sql`
      SELECT wc.id, wc.item_id, wc.content, wc.created_at,
             COALESCE(u.name, 'Anonymous') as user_name
      FROM workspace_comments wc
      LEFT JOIN users u ON u.id = wc.user_id
      WHERE wc.item_id = ANY(${itemIds}::text[])
      ORDER BY wc.created_at ASC
    ` : [];

    // Attach comments to items
    const itemsWithComments = (items as Record<string, unknown>[]).map(item => ({
      ...item,
      comments: (comments as { id: string; item_id: string; content: string; created_at: string; user_name: string }[])
        .filter(c => c.item_id === (item.id as string))
        .map(c => ({ id: c.id, content: c.content, createdAt: c.created_at, userName: c.user_name })),
    }));

    return NextResponse.json({ workspace: ws, members, items: itemsWithComments });
  } catch (err) {
    console.error("[workspaces/[id] GET]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, description } = await req.json();

  // Only owner can update
  const [ws] = await sql`SELECT owner_id FROM workspaces WHERE id=${id}`;
  if (!ws || ws.owner_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await sql`UPDATE workspaces SET name=COALESCE(${name??null},name), description=${description??null} WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  if (action === "invite") {
    const { email } = body;
    if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });
    // Find user by email
    const [user] = await sql`SELECT id FROM users WHERE email=${email.trim()}`;
    if (!user) return NextResponse.json({ error: "User not found. They need to sign up first." }, { status: 404 });
    // Check if already a member
    const [existing] = await sql`SELECT 1 FROM workspace_members WHERE workspace_id=${id} AND user_id=${user.id}`;
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 400 });
    await sql`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (${id}, ${user.id}, 'member') ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
  }

  if (action === "add-comment") {
    const { itemId, content } = body;
    if (!itemId || !content?.trim()) return NextResponse.json({ error: "itemId and content required" }, { status: 400 });
    await sql`
      INSERT INTO workspace_comments (item_id, user_id, content)
      VALUES (${itemId}, ${session.user.id}, ${content.trim()})
    `;
    return NextResponse.json({ ok: true });
  }

  if (action === "add-item") {
    const { itemType, itemJson, notes } = body;
    const [row] = await sql`
      INSERT INTO workspace_items (workspace_id, added_by, item_type, item_json, notes)
      VALUES (${id}, ${session.user.id}, ${itemType??'gap'}, ${JSON.stringify(itemJson)}, ${notes??null})
      RETURNING id
    `;
    return NextResponse.json({ itemId: row.id });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [ws] = await sql`SELECT owner_id FROM workspaces WHERE id=${id}`;
  if (!ws || ws.owner_id !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await sql`DELETE FROM workspaces WHERE id=${id}`;
  return NextResponse.json({ ok: true });
}
