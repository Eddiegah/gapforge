import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { createHmac } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

const PLANS: Record<string, { name: string; plan: string; amountUSD: number; creditsLimit: number; amountGHS: number }> = {
  starter: { name: "GapForge Starter", plan: "starter", amountUSD: 10, amountGHS: 11800, creditsLimit: 50 },
  pro:     { name: "GapForge Pro",     plan: "pro",     amountUSD: 20, amountGHS: 23600, creditsLimit: 500 },
  team:    { name: "GapForge Team",    plan: "team",    amountUSD: 40, amountGHS: 47200, creditsLimit: 9999 },
};

/** Initialize a Paystack payment */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const [user] = await sql`SELECT email, name FROM users WHERE id = ${session.user.id}`;
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Use GHS — Paystack Ghana supports GHS natively
  // Amount in pesewas (GHS * 100). Paystack Ghana uses GHS.
  const amount = plan.amountGHS;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amount,
      currency: "GHS",
      callback_url: `${BASE_URL}/api/payments/paystack/callback`,
      metadata: {
        userId: session.user.id,
        planId,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
          { display_name: "User", variable_name: "user_name", value: user.name ?? "" },
        ],
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Payment initialization failed." }, { status: 500 });
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}

/** Paystack redirect callback — user lands here after payment */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${BASE_URL}/pricing?error=no_reference`);
  }

  // Verify transaction
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const verifyData = await verifyRes.json();

  if (verifyData.status && verifyData.data?.status === "success") {
    const { userId, planId } = verifyData.data.metadata ?? {};
    if (userId && planId && PLANS[planId]) {
      const p = PLANS[planId];
      await sql`UPDATE users SET plan = ${p.plan}, updated_at = NOW() WHERE id = ${userId}`;
      await sql`
        INSERT INTO user_credits (user_id, credits_limit)
        VALUES (${userId}, ${p.creditsLimit})
        ON CONFLICT (user_id) DO UPDATE
        SET credits_limit = ${p.creditsLimit}, updated_at = NOW()
      `;
    }
    return NextResponse.redirect(`${BASE_URL}/dashboard?upgraded=true`);
  }

  return NextResponse.redirect(`${BASE_URL}/pricing?error=payment_failed`);
}

/** Paystack webhook — server-to-server confirmation */
export async function PUT(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(body);
  if (event.event === "charge.success") {
    const { userId, planId } = event.data?.metadata ?? {};
    if (userId && planId && PLANS[planId]) {
      const p = PLANS[planId];
      await sql`UPDATE users SET plan = ${p.plan}, updated_at = NOW() WHERE id = ${userId}`;
      await sql`
        INSERT INTO user_credits (user_id, credits_limit)
        VALUES (${userId}, ${p.creditsLimit})
        ON CONFLICT (user_id) DO UPDATE
        SET credits_limit = ${p.creditsLimit}, updated_at = NOW()
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
