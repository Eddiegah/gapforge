import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

// Cache for 1 hour — these don't need to be real-time
export const revalidate = 3600;

export async function GET() {
  try {
    const [users] = await sql`SELECT COUNT(*) as c FROM users`;
    const [searches] = await sql`SELECT COUNT(*) as c FROM gap_searches`;
    const [gaps] = await sql`SELECT COUNT(*) as c FROM saved_gaps`;

    return NextResponse.json({
      users: Number((users as { c: number }).c ?? 0),
      searches: Number((searches as { c: number }).c ?? 0),
      gaps: Number((gaps as { c: number }).c ?? 0),
      papers: 250000000, // static — 250M papers indexed
      sources: 10,
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json({ users: 0, searches: 0, gaps: 0, papers: 250000000, sources: 10 });
  }
}
