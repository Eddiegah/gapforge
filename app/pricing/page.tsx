"use client";

import { useState } from "react";
import { Check, Zap, Loader, AlertCircle } from "lucide-react";
import { PublicNav } from "@/components/nav";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For curious researchers just getting started.",
    features: [
      "10 Gap AI searches/month",
      "Public weekly Gap Drops",
      "GapSimplify (DOI & arXiv)",
      "Save up to 20 gaps",
      "Basic library",
    ],
    cta: "Get started free",
    href: "/login",
    highlight: false,
    planId: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$10",
    period: "/month",
    description: "For individual researchers who want more.",
    features: [
      "50 Gap AI searches/month",
      "Personalized Gap Drops",
      "PDF upload in GapSimplify",
      "Unlimited saved gaps",
      "Citation export",
      "Research proposal drafts",
    ],
    cta: "Start Starter",
    href: null,
    highlight: false,
    planId: "starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "For active researchers who need intelligence every week.",
    features: [
      "500 Gap AI searches/month",
      "Personalized daily drops",
      "Literature review compiler",
      "Zotero & Mendeley export",
      "AI Research Assistant",
      "Research proposal drafts",
      "Priority processing",
    ],
    cta: "Start Pro",
    href: null,
    highlight: true,
    planId: "pro",
  },
  {
    id: "team",
    name: "Team",
    price: "$40",
    period: "/month",
    description: "For research groups collaborating on shared intelligence.",
    features: [
      "Unlimited searches",
      "Everything in Pro",
      "Team workspaces",
      "Collaborative commenting",
      "Up to 5 seats",
      "Institutional API access",
      "Priority support",
    ],
    cta: "Start Team",
    href: null,
    highlight: false,
    planId: "team",
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleUpgrade = async (planId: string, method: "paystack" | "flutterwave" = "paystack") => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent("/pricing")}`;
      return;
    }
    setLoadingPlan(planId);
    setError(null);
    try {
      const endpoint = method === "flutterwave" ? "/api/payments/flutterwave" : "/api/payments/paystack";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        throw new Error("No payment URL returned.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment initialization failed. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-6">
            <Zap size={12} /> Simple, honest pricing
          </div>
          <h1 className="text-4xl font-bold text-[rgb(var(--fg))] mb-3">Research intelligence for every stage</h1>
          <p className="text-[rgb(var(--muted))] max-w-lg mx-auto">Payments processed securely via Paystack — supports cards, mobile money, and bank transfer in Ghana and globally.</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center flex items-center gap-2 justify-center">
            <AlertCircle size={14} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {!session && (
          <p className="text-center text-xs text-[rgb(var(--muted))] mb-6">
            You need to <a href="/login" className="text-violet-400 hover:underline">sign in</a> before upgrading.
          </p>
        )}

        <div className="grid md:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.id} className={cn("card p-6 flex flex-col gap-5 relative", plan.highlight ? "border-violet-500 ring-1 ring-violet-500/20" : "")}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-[rgb(var(--fg))]">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-bold text-[rgb(var(--fg))]">{plan.price}</span>
                  <span className="text-[rgb(var(--muted))] text-sm pb-1">{plan.period}</span>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                    <Check size={13} className={cn("mt-0.5 flex-shrink-0", plan.highlight ? "text-violet-400" : "text-teal-400")} />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.href ? (
                <a href={plan.href} className={cn("text-center py-2.5 rounded-lg font-medium text-sm transition-colors", plan.highlight ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:border-violet-500/50")}>
                  {plan.cta}
                </a>
              ) : (
                <button
                  onClick={() => plan.planId && handleUpgrade(plan.planId, "paystack")}
                  disabled={loadingPlan === plan.planId}
                  className={cn("w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60",
                    plan.highlight ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:border-violet-500/50"
                  )}
                >
                  {loadingPlan === plan.planId ? <Loader size={14} className="animate-spin" /> : null}
                  {loadingPlan === plan.planId ? "Redirecting..." : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[rgb(var(--muted))] mt-8">
          Payments processed securely — Paystack (GHS/Africa) or Stripe (USD/International).
          <br />Prices shown in USD for reference. GHS equivalent charged at checkout.
        </p>
      </div>
    </div>
  );
}
