import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

const DEFAULT_PREFS = { weeklyDigest: true, gapAlerts: true, dropNotifications: true, upgradeNudges: true };

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ prefs: DEFAULT_PREFS });
  try {
    const [user] = await sql`SELECT notification_prefs FROM users WHERE id = ${session.user.id}`;
    return NextResponse.json({ prefs: user?.notification_prefs ?? DEFAULT_PREFS });
  } catch { return NextResponse.json({ prefs: DEFAULT_PREFS }); }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await req.json();
  try {
    await sql`UPDATE users SET notification_prefs = ${JSON.stringify(prefs)} WHERE id = ${session.user.id}`;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Failed to save" }, { status: 500 }); }
}
