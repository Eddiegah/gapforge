import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { randomBytes } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let [user] = await sql`SELECT referral_code FROM users WHERE id = ${session.user.id}`;
    if (!user?.referral_code) {
      const code = randomBytes(4).toString("hex").toUpperCase();
      [user] = await sql`UPDATE users SET referral_code = ${code} WHERE id = ${session.user.id} RETURNING referral_code`;
    }

    const [countRow] = await sql`SELECT COUNT(*) as count FROM users WHERE referred_by = ${session.user.id}`;

    return NextResponse.json({
      code: user?.referral_code,
      referralUrl: `${BASE_URL}/login?ref=${user?.referral_code}`,
      referralCount: Number((countRow as { count: string })?.count ?? 0),
      bonusCredits: 5,
    });
  } catch {
    return NextResponse.json({ code: null, referralUrl: null, referralCount: 0, bonusCredits: 5 });
  }
}

export async function POST(req: NextRequest) {
  const { code, userId } = await req.json();
  if (!code || !userId) return NextResponse.json({ ok: false });

  try {
    const [referrer] = await sql`SELECT id FROM users WHERE referral_code = ${code}`;
    if (!referrer || referrer.id === userId) return NextResponse.json({ ok: false });

    await sql`UPDATE users SET referred_by = ${referrer.id} WHERE id = ${userId} AND referred_by IS NULL`;
    await sql`
      INSERT INTO user_credits (user_id, credits_limit)
      VALUES (${referrer.id as string}, 25)
      ON CONFLICT (user_id) DO UPDATE
      SET credits_limit = user_credits.credits_limit + 5, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
