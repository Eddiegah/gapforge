import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const workspaces = await sql`
    SELECT w.id, w.name, w.description, w.owner_id, w.plan, w.created_at,
           wm.role,
           (SELECT COUNT(*) FROM workspace_members wm2 WHERE wm2.workspace_id = w.id) AS member_count,
           (SELECT COUNT(*) FROM workspace_items wi WHERE wi.workspace_id = w.id) AS item_count
    FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = ${session.user.id}
    ORDER BY w.created_at DESC
  `;

  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Check user plan
  const [user] = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
  if (!user || !["team", "institutional", "pro"].includes(user.plan as string)) {
    return NextResponse.json({ error: "Workspaces require a team or pro plan." }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Workspace name is required." }, { status: 400 });

  const [workspace] = await sql`
    INSERT INTO workspaces (name, description, owner_id)
    VALUES (${name.trim()}, ${description ?? null}, ${session.user.id})
    RETURNING id
  `;

  // Add owner as member
  await sql`
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (${workspace.id}, ${session.user.id}, 'owner')
  `;

  return NextResponse.json({ workspaceId: workspace.id });
}
