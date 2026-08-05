import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db/client";

async function checkMembership(workspaceId: string, userId: string) {
  const [member] = await sql`
    SELECT role FROM workspace_members WHERE workspace_id = ${workspaceId} AND user_id = ${userId}
  `;
  return member?.role as string | null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const role = await checkMembership(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not a member of this workspace." }, { status: 403 });

  const [workspace] = await sql`
    SELECT w.*, 
      (SELECT json_agg(json_build_object('userId', wm.user_id, 'role', wm.role, 'name', u.name, 'image', u.image))
       FROM workspace_members wm JOIN users u ON u.id = wm.user_id
       WHERE wm.workspace_id = w.id) AS members
    FROM workspaces w WHERE w.id = ${id}
  `;

  const items = await sql`
    SELECT wi.*, u.name AS added_by_name,
      (SELECT json_agg(json_build_object('id', wc.id, 'content', wc.content, 'userId', wc.user_id, 'createdAt', wc.created_at, 'userName', u2.name))
       FROM workspace_comments wc JOIN users u2 ON u2.id = wc.user_id
       WHERE wc.item_id = wi.id) AS comments
    FROM workspace_items wi
    LEFT JOIN users u ON u.id = wi.added_by
    WHERE wi.workspace_id = ${id}
    ORDER BY wi.created_at DESC
  `;

  return NextResponse.json({ workspace, items, role });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const role = await checkMembership(id, session.user.id);
  if (!role) return NextResponse.json({ error: "Not a member." }, { status: 403 });

  const { action, ...body } = await req.json();

  if (action === "add-item") {
    const [item] = await sql`
      INSERT INTO workspace_items (workspace_id, added_by, item_type, item_json, notes, tags)
      VALUES (${id}, ${session.user.id}, ${body.itemType}, ${JSON.stringify(body.item)}, ${body.notes ?? null}, ${body.tags ?? []})
      RETURNING id
    `;
    return NextResponse.json({ itemId: item.id });
  }

  if (action === "add-comment") {
    const [comment] = await sql`
      INSERT INTO workspace_comments (item_id, user_id, content)
      VALUES (${body.itemId}, ${session.user.id}, ${body.content})
      RETURNING id
    `;
    return NextResponse.json({ commentId: comment.id });
  }

  if (action === "invite") {
    if (!["owner", "admin"].includes(role)) {
      return NextResponse.json({ error: "Only owners and admins can invite." }, { status: 403 });
    }
    const [invitee] = await sql`SELECT id FROM users WHERE email = ${body.email}`;
    if (!invitee) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (${id}, ${invitee.id}, 'member')
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
