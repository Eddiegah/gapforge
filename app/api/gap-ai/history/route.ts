import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ history: [] });
  try {
    const rows = await sql`
      SELECT id, query, gaps_found, papers_analyzed, created_at
      FROM gap_searches
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ history: rows });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
