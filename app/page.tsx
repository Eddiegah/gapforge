import Link from "next/link";
import { Search, Zap, BookOpen, ArrowRight, CheckCircle } from "lucide-react";
import { Nav } from "@/components/nav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-coral/10 border border-coral/20 rounded-full px-4 py-1.5 text-xs text-coral font-medium mb-8">
            <Zap size={12} />
            <span>Research intelligence, grounded in real sources</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[rgb(var(--foreground))] leading-tight mb-6">
            Find the gaps{" "}
            <span className="text-coral">nobody is</span>
            <br />
            researching yet
          </h1>

          <p className="text-lg text-[rgb(var(--muted))] max-w-2xl mx-auto leading-relaxed mb-10">
            GapForge scans real academic sources and surfaces genuine candidate gaps for your judgment. No inflated claims. Every gap is backed by verified citations from papers that actually exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/gap-ai" className="btn-primary flex items-center gap-2 justify-center py-3 px-6 text-base">
              <Search size={16} />
              Search for gaps
            </Link>
            <Link href="/onboarding" className="btn-secondary flex items-center gap-2 justify-center py-3 px-6 text-base">
              Set up Gap Drops
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-[rgb(var(--border))]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-[rgb(var(--foreground))]">
            Three tools, one platform
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Gap AI",
                description:
                  "On-demand research gap detection. Enter a topic, get candidate gaps with real citations verified against actual source results.",
                href: "/gap-ai",
                cta: "Start searching",
              },
              {
                icon: Zap,
                title: "Gap Drops",
                description:
                  "A personalized weekly digest delivered every Friday — gaps, startup opportunities, funding prospects, and cross-field transfers, all scoped to your niche.",
                href: "/gap-drops",
                cta: "Set up your drop",
              },
              {
                icon: BookOpen,
                title: "GapSimplify",
                description:
                  "Paste a DOI or arXiv link. Get plain-language section translations, key claims with evidence ratings, a glossary, and gaps surfaced within that single paper.",
                href: "/gap-simplify",
                cta: "Simplify a paper",
              },
            ].map(({ icon: Icon, title, description, href, cta }) => (
              <div key={title} className="card p-6 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
                  <Icon size={18} className="text-coral" />
                </div>
                <div>
                  <h3 className="font-semibold text-[rgb(var(--foreground))] mb-2">{title}</h3>
                  <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{description}</p>
                </div>
                <Link href={href} className="mt-auto text-sm text-coral font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  {cta} <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 px-4 bg-[rgb(var(--card))]/40 border-y border-[rgb(var(--border))]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8 text-[rgb(var(--foreground))]">
            Built for credibility
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Every citation is verified against actual retrieved papers — no hallucinated references",
              "Gap detection is framed honestly as candidate gaps for your judgment, not algorithmic certainty",
              "Real-time source health checks — you see which sources actually responded to your query",
              "Relevance scores are explained with a transparent basis: citation counts, recency, and evidence breadth",
              "Broad source coverage across Semantic Scholar, arXiv, PubMed, OpenAlex, CORE, bioRxiv, and more",
              "Rate limits and respectful API usage — the platform is built to last, not banned",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-[rgb(var(--muted))]">
                <CheckCircle size={15} className="text-coral mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 text-center text-xs text-[rgb(var(--muted))]">
        <p>GapForge &mdash; Research Intelligence Platform</p>
        <p className="mt-1">
          <Link href="/api/v1" className="hover:text-[rgb(var(--foreground))] transition-colors">API docs</Link>
          {" "}&middot;{" "}
          <Link href="/settings" className="hover:text-[rgb(var(--foreground))] transition-colors">Settings</Link>
          {" "}&middot;{" "}
          <Link href="/pricing" className="hover:text-[rgb(var(--foreground))] transition-colors">Pricing</Link>
        </p>
      </footer>
    </div>
  );
}
