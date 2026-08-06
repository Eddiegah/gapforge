import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  const { email, feature } = await req.json();
  if (!email?.includes("@")) return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  try {
    await sql`INSERT INTO waitlist (email, feature) VALUES (${email}, ${feature ?? "niche-map"}) ON CONFLICT DO NOTHING`;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
