import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

// Stripe payment initialization
// Note: Install stripe with: npm install stripe
// Then add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to Vercel env vars

const STRIPE_PRICES = {
  starter: { amount: 1000, currency: "usd", name: "GapForge Starter" },  // $10
  pro: { amount: 2000, currency: "usd", name: "GapForge Pro" },           // $20
  team: { amount: 4000, currency: "usd", name: "GapForge Team" },         // $40
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  if (!plan || !STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Stripe not configured — redirect to Paystack
    return NextResponse.json({ redirect: "/pricing?method=paystack" });
  }

  try {
    const price = STRIPE_PRICES[plan as keyof typeof STRIPE_PRICES];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge.app";

    // Create Stripe checkout session via API
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": price.currency,
        "line_items[0][price_data][product_data][name]": price.name,
        "line_items[0][price_data][unit_amount]": String(price.amount),
        "line_items[0][quantity]": "1",
        "mode": "payment",
        "success_url": `${baseUrl}/dashboard?upgraded=1`,
        "cancel_url": `${baseUrl}/pricing`,
        "customer_email": session.user.email ?? "",
        "metadata[userId]": session.user.id,
        "metadata[plan]": plan,
      }),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json();
      throw new Error(err.error?.message ?? "Stripe error");
    }

    const checkout = await stripeRes.json();
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[Stripe]", err);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
