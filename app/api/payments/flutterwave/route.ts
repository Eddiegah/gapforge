import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db/client";

// Flutterwave payment — common in Ghana alongside Paystack
const FLW_PRICES: Record<string, { amount: number; currency: string; name: string }> = {
  starter: { amount: 118, currency: "GHS", name: "GapForge Starter" },
  pro: { amount: 236, currency: "GHS", name: "GapForge Pro" },
  team: { amount: 472, currency: "GHS", name: "GapForge Team" },
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  if (!planId || !FLW_PRICES[planId]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const flwKey = process.env.FLW_SECRET_KEY;
  if (!flwKey) return NextResponse.json({ error: "Flutterwave not configured" }, { status: 503 });

  const price = FLW_PRICES[planId];
  const txRef = `gapforge-${planId}-${session.user.id}-${Date.now()}`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://gapforge-self.vercel.app";

  try {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: price.amount,
        currency: price.currency,
        redirect_url: `${baseUrl}/api/payments/flutterwave/callback`,
        customer: {
          email: session.user.email ?? "",
          name: session.user.name ?? "Researcher",
        },
        customizations: {
          title: "GapForge",
          description: price.name,
          logo: `${baseUrl}/icon-192.png`,
        },
        meta: {
          userId: session.user.id,
          planId,
        },
      }),
    });

    const data = await res.json();
    if (data.status === "success" && data.data?.link) {
      return NextResponse.json({ authorizationUrl: data.data.link });
    }
    throw new Error(data.message ?? "Flutterwave error");
  } catch (err) {
    console.error("[Flutterwave]", err);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
