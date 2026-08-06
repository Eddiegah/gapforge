import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [row] = await sql`SELECT gap_json FROM saved_gaps WHERE id = ${id}`;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ gap: row.gap_json });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
