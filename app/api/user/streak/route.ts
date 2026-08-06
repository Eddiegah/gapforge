import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ streak: 0, longestStreak: 0 });
  try {
    const [u] = await sql`SELECT current_streak, longest_streak, last_search_date FROM users WHERE id = ${session.user.id}`;
    return NextResponse.json({ streak: Number(u?.current_streak ?? 0), longestStreak: Number(u?.longest_streak ?? 0), lastSearchDate: u?.last_search_date ?? null });
  } catch { return NextResponse.json({ streak: 0, longestStreak: 0 }); }
}
