import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");

  if (status !== "successful" || !transactionId) {
    return NextResponse.redirect(`${BASE_URL}/pricing?error=payment_failed`);
  }

  // Verify with Flutterwave
  const flwKey = process.env.FLW_SECRET_KEY;
  if (!flwKey) return NextResponse.redirect(`${BASE_URL}/pricing?error=config`);

  try {
    const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${flwKey}` },
    });
    const data = await res.json();

    if (data.status !== "success" || data.data?.status !== "successful") {
      return NextResponse.redirect(`${BASE_URL}/pricing?error=verification_failed`);
    }

    const meta = data.data?.meta ?? {};
    const userId = meta.userId;
    const planId = meta.planId ?? txRef?.split("-")[1];

    if (userId && planId) {
      const planMap: Record<string, string> = { starter: "starter", pro: "pro", team: "team" };
      const creditMap: Record<string, number> = { starter: 50, pro: 200, team: 500 };
      const plan = planMap[planId] ?? "starter";
      const credits = creditMap[planId] ?? 50;

      await sql`UPDATE users SET plan = ${plan}, updated_at = NOW() WHERE id = ${userId}`;
      await sql`
        INSERT INTO user_credits (user_id, credits_used, credits_limit)
        VALUES (${userId}, 0, ${credits})
        ON CONFLICT (user_id) DO UPDATE SET credits_limit = ${credits}, credits_used = 0, updated_at = NOW()
      `;
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard?upgraded=1`);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/pricing?error=server_error`);
  }
}
