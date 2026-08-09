import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { randomBytes } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Get or create referral code
    let [user] = await sql`
      SELECT id, referral_code, referral_bonus_credits FROM users WHERE id = ${session.user.id}
    `;

    if (!(user as { referral_code: string | null }).referral_code) {
      const code = randomBytes(4).toString("hex").toUpperCase();
      [user] = await sql`
        UPDATE users SET referral_code = ${code} WHERE id = ${session.user.id}
        RETURNING id, referral_code, referral_bonus_credits
      `;
    }

    const u = user as { referral_code: string; referral_bonus_credits: number };

    // Count referrals
    const referred = await sql`
      SELECT u.name, u.created_at as joined
      FROM users u
      WHERE u.referred_by = ${session.user.id}
      ORDER BY u.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      referralCode: u.referral_code,
      referralLink: `${BASE_URL}/login?ref=${u.referral_code}`,
      referralCount: referred.length,
      bonusCredits: Number(u.referral_bonus_credits ?? 0),
      referredUsers: (referred as { name: string | null; joined: string }[]).map((r) => ({
        name: r.name ?? "Researcher",
        joined: r.joined,
      })),
    });
  } catch (err) {
    console.error("[Referral]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
