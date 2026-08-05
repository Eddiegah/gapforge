import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db/client";
import { createHmac } from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

const PLANS: Record<string, { name: string; plan: string; monthlyUSD: number }> = {
  pro: { name: "GapForge Pro", plan: "pro", monthlyUSD: 19 },
  team: { name: "GapForge Team", plan: "team", monthlyUSD: 49 },
  institutional: { name: "GapForge Institutional", plan: "institutional", monthlyUSD: 199 },
};

/** Initialize a Paystack payment */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const [user] = await sql`SELECT email FROM users WHERE id = ${session.user.id}`;
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const amountKobo = plan.monthlyUSD * 100 * 100; // USD cents * 100 for Paystack (in kobo for GHS, or cents for USD)

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      currency: "USD",
      metadata: {
        userId: session.user.id,
        planId,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan.name },
        ],
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
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

/** Paystack webhook handler */
export async function PUT(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { userId, planId } = event.data.metadata;
    const customerCode = event.data.customer?.customer_code;

    if (userId && planId && PLANS[planId]) {
      await sql`
        UPDATE users
        SET plan = ${PLANS[planId].plan},
            paystack_customer_code = ${customerCode ?? null},
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    }
  }

  return NextResponse.json({ ok: true });
}
