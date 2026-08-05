import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ creditsUsed: 0, creditsLimit: 20 });

  try {
    // Reset if past reset_at
    await sql`
      UPDATE user_credits 
      SET credits_used = 0, reset_at = date_trunc('month', NOW()) + interval '1 month', updated_at = NOW()
      WHERE user_id = ${session.user.id} AND reset_at < NOW()
    `;

    const [row] = await sql`
      INSERT INTO user_credits (user_id) VALUES (${session.user.id})
      ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
      RETURNING credits_used, credits_limit
    `;

    return NextResponse.json({
      creditsUsed: row?.credits_used ?? 0,
      creditsLimit: row?.credits_limit ?? 20,
    });
  } catch {
    return NextResponse.json({ creditsUsed: 0, creditsLimit: 20 });
  }
}
