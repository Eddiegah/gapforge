import { PublicNav } from "@/components/nav";
import { Check } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "For individual researchers exploring GapForge.",
    features: [
      "10 Gap AI searches/hour",
      "GapSimplify (20 papers/hour)",
      "Access to Gap Drops (view only)",
      "Basic library",
    ],
    cta: "Get started",
    href: "/login",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For active researchers who want personalized drops and premium features.",
    features: [
      "Everything in Free",
      "Personalized weekly Gap Drops",
      "Literature review compiler",
      "Zotero & Mendeley export",
      "BibTeX / RIS export",
      "Priority processing",
    ],
    cta: "Start Pro",
    href: "/api/payments/paystack?plan=pro",
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For research groups collaborating on gaps and reviews.",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "Collaborative commenting",
      "Up to 5 seats",
      "Shared library",
    ],
    cta: "Start Team",
    href: "/api/payments/paystack?plan=team",
    highlight: false,
  },
  {
    id: "institutional",
    name: "Institutional",
    price: "$199",
    period: "/month",
    description: "For universities and research institutions needing programmatic access.",
    features: [
      "Everything in Team",
      "Institutional API access",
      "Unlimited seats",
      "API rate limit: 100 req/hour",
      "Dedicated support",
    ],
    cta: "Contact us",
    href: "mailto:hello@gapforge.app",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-3">Simple, honest pricing</h1>
          <p className="text-[rgb(var(--muted))] max-w-lg mx-auto">
            Payments processed via Paystack in USD. No hidden fees, no automatic renewal surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 flex flex-col gap-5 ${plan.highlight ? "border-coral ring-1 ring-coral/20" : ""}`}
            >
              {plan.highlight && (
                <span className="badge bg-coral/10 text-coral w-fit">Most popular</span>
              )}
              <div>
                <h3 className="font-bold text-[rgb(var(--foreground))]">{plan.name}</h3>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-bold text-[rgb(var(--foreground))]">{plan.price}</span>
                  <span className="text-[rgb(var(--muted))] text-sm pb-1">{plan.period}</span>
                </div>
                <p className="text-xs text-[rgb(var(--muted))] mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                    <Check size={13} className="text-coral mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.highlight
                    ? "bg-coral text-white hover:bg-coral-600"
                    : "border border-[rgb(var(--border))] text-[rgb(var(--foreground))] hover:border-coral/50"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[rgb(var(--muted))] mt-8">
          GapForge is built in Ghana. Payments via Paystack support USD billing across West Africa and globally.
        </p>
      </div>
    </div>
  );
}
