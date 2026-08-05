import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ plan: "free" });
  try {
    const [user] = await sql`SELECT plan FROM users WHERE id = ${session.user.id}`;
    return NextResponse.json({ plan: user?.plan ?? "free" });
  } catch {
    return NextResponse.json({ plan: "free" });
  }
}
