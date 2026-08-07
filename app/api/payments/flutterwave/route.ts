import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { createHmac } from "crypto";

const FLW_SECRET = process.env.FLW_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

const PLANS: Record<string, { name: string; plan: string; amountUSD: number; creditsLimit: number }> = {
  starter: { name: "GapForge Starter", plan: "starter", amountUSD: 10, creditsLimit: 50 },
  pro:     { name: "GapForge Pro",     plan: "pro",     amountUSD: 20, creditsLimit: 500 },
  team:    { name: "GapForge Team",    plan: "team",    amountUSD: 40, creditsLimit: 9999 },
};

/** Initialize a Flutterwave payment */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const [user] = await sql`SELECT email, name FROM users WHERE id = ${session.user.id}`;
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const txRef = `GF-${session.user.id.slice(0, 8)}-${Date.now()}`;

  const payload = {
    tx_ref: txRef,
    amount: plan.amountUSD,
    currency: "USD",
    redirect_url: `${BASE_URL}/api/payments/flutterwave/callback`,
    customer: {
      email: user.email,
      name: user.name ?? "Researcher",
    },
    meta: {
      userId: session.user.id,
      planId,
    },
    customizations: {
      title: "GapForge",
      description: plan.name,
      logo: `${BASE_URL}/icon.svg`,
    },
  };

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLW_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.status !== "success") {
    return NextResponse.json({ error: data.message ?? "Payment initialization failed." }, { status: 500 });
  }

  return NextResponse.json({ paymentLink: data.data.link, txRef });
}

/** Flutterwave redirect callback */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");

  if (status !== "successful" || !txRef || !transactionId) {
    return NextResponse.redirect(`${BASE_URL}/pricing?error=payment_failed`);
  }

  // Verify with Flutterwave
  const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${FLW_SECRET}` },
  });
  const verifyData = await verifyRes.json();

  if (verifyData.status === "success" && verifyData.data.status === "successful") {
    const { userId, planId } = verifyData.data.meta ?? {};
    if (userId && planId && PLANS[planId]) {
      await sql`UPDATE users SET plan = ${PLANS[planId].plan}, updated_at = NOW() WHERE id = ${userId}`;
      // Update credits limit for paid plans — same limits as Paystack for consistency
      const newLimit = PLANS[planId].creditsLimit;
      await sql`
        INSERT INTO user_credits (user_id, credits_limit)
        VALUES (${userId}, ${newLimit})
        ON CONFLICT (user_id) DO UPDATE SET credits_limit = ${newLimit}, updated_at = NOW()
      `;
    }
    return NextResponse.redirect(`${BASE_URL}/dashboard?upgraded=true`);
  }

  return NextResponse.redirect(`${BASE_URL}/pricing?error=payment_failed`);
}

/** Flutterwave webhook */
export async function PUT(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("verif-hash");

  if (signature !== process.env.FLW_WEBHOOK_HASH) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.event === "charge.completed" && event.data?.status === "successful") {
    const { userId, planId } = event.data.meta ?? {};
    if (userId && planId && PLANS[planId]) {
      const p = PLANS[planId];
      await sql`UPDATE users SET plan = ${p.plan}, updated_at = NOW() WHERE id = ${userId}`;
      await sql`
        INSERT INTO user_credits (user_id, credits_limit)
        VALUES (${userId}, ${p.creditsLimit})
        ON CONFLICT (user_id) DO UPDATE SET credits_limit = ${p.creditsLimit}, updated_at = NOW()
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
