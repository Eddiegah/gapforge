import { PublicNav } from "@/components/nav";
import { ArrowRight, Search, Zap, BookOpen, Brain, Database, CheckCircle, Users, FileText, BarChart3, MessageSquare, BookmarkCheck, CalendarDays } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: Search,
    title: "Gap AI Search",
    desc: "Enter any research topic. GapForge queries 10+ live databases simultaneously and returns ranked research gaps backed by real citations — not hallucinated references.",
    demo: "/gap-ai",
    color: "from-violet-600/20 to-violet-800/20 border-violet-600/30 text-violet-400",
  },
  {
    icon: Zap,
    title: "Gap Drops",
    desc: "Weekly personalized intelligence digest. Every Friday: gaps, startup opportunities, emerging trends, funding prospects, and cross-disciplinary transfers scoped to your research niche.",
    demo: "/gap-drops",
    color: "from-amber-600/20 to-amber-800/20 border-amber-600/30 text-amber-400",
  },
  {
    icon: BookOpen,
    title: "GapSimplify",
    desc: "Paste any DOI or arXiv URL. Get section-by-section plain-language summaries, evidence-rated claims, an interactive glossary, and gaps surfaced from within the paper.",
    demo: "/gap-simplify",
    color: "from-teal-600/20 to-teal-800/20 border-teal-600/30 text-teal-400",
  },
  {
    icon: Brain,
    title: "AI Chat with Memory",
    desc: "A research-focused AI assistant that remembers your conversations. Ask about methodology, funding, collaborators, and proposals — answers grounded in your gap context.",
    demo: "/chat",
    color: "from-blue-600/20 to-blue-800/20 border-blue-600/30 text-blue-400",
  },
  {
    icon: FileText,
    title: "Research Proposal Drafts",
    desc: "One click from any gap card. Generates a full structured research proposal including background, objectives, methodology, budget outline, and expected outcomes.",
    demo: "/gap-ai",
    color: "from-indigo-600/20 to-indigo-800/20 border-indigo-600/30 text-indigo-400",
  },
  {
    icon: BarChart3,
    title: "Systematic Review",
    desc: "Enter a review question. GapForge generates a structured systematic review with PRISMA-aligned sections, synthesized from live literature.",
    demo: "/systematic-review",
    color: "from-pink-600/20 to-pink-800/20 border-pink-600/30 text-pink-400",
  },
  {
    icon: Database,
    title: "Grant & Funding Finder",
    desc: "Get matched funding opportunities and generate NIH R01, NSF, or EU Horizon grant proposal sections directly from any identified research gap.",
    demo: "/gap-ai",
    color: "from-green-600/20 to-green-800/20 border-green-600/30 text-green-400",
  },
  {
    icon: CalendarDays,
    title: "Research Calendar",
    desc: "Track submission deadlines, milestones, and review meetings. Link calendar events directly to gaps and issues in your research pipeline.",
    demo: "/calendar",
    color: "from-orange-600/20 to-orange-800/20 border-orange-600/30 text-orange-400",
  },
  {
    icon: MessageSquare,
    title: "Research Community",
    desc: "Follow researchers, comment on shared gaps in the Question Bank, earn badges on the leaderboard, and participate in weekly themed research challenges.",
    demo: "/leaderboard",
    color: "from-purple-600/20 to-purple-800/20 border-purple-600/30 text-purple-400",
  },
];

const STATS = [
  { value: "250M+", label: "Papers indexed" },
  { value: "10+", label: "Academic sources" },
  { value: "6", label: "Gap categories" },
  { value: "100%", label: "Real citations" },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-5">
            <Zap size={11} /> Live platform — try it free
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[rgb(var(--fg))] mb-4 leading-tight">
            GapForge: Research Intelligence{" "}
            <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              That Actually Works
            </span>
          </h1>
          <p className="text-[rgb(var(--muted))] max-w-2xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
            Every gap is backed by papers retrieved live from Semantic Scholar, arXiv, PubMed, and 7 other databases. No hallucinated references. No fake citations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
              <Search size={16} /> Try it free — 10 searches/month
            </Link>
            <Link href="/question-bank"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] font-medium transition-colors">
              Browse community gaps <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {STATS.map(stat => (
            <div key={stat.label} className="card p-5 text-center">
              <p className="text-2xl md:text-3xl font-bold text-violet-400">{stat.value}</p>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest text-center mb-8">
          Full feature breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {FEATURES.map(f => (
            <div key={f.title} className={`card p-5 bg-gradient-to-br ${f.color.split(" text-")[0]} flex flex-col gap-3`}>
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${f.color.split(" ").slice(-3).join(" ")}`}>
                <f.icon size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">{f.title}</h3>
                <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{f.desc}</p>
              </div>
              <Link href={f.demo}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                Try it <ArrowRight size={11} />
              </Link>
            </div>
          ))}
        </div>

        {/* How it works — 3 steps */}
        {/* How it works — visual flow */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-[rgb(var(--fg))] text-center mb-8">How a gap search works — in 3 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "01", title: "You enter a topic",
                desc: "Any field, niche, or research question. E.g. 'gut microbiome and depression mechanisms'.",
                detail: "With autocomplete suggestions and topic discovery to help you refine.",
                color: "from-violet-600/10 to-violet-800/5 border-violet-500/20",
                dotColor: "bg-violet-500",
              },
              {
                step: "02", title: "We query 10+ live databases",
                desc: "Semantic Scholar, PubMed, arXiv, OpenAlex, Crossref, CORE, bioRxiv, DOAJ, NASA ADS — simultaneously.",
                detail: "250M+ papers. Real-time retrieval. Every source shown.",
                color: "from-blue-600/10 to-blue-800/5 border-blue-500/20",
                dotColor: "bg-blue-500",
              },
              {
                step: "03", title: "AI surfaces research gaps",
                desc: "6 gap types detected: contradictions, missing links, population blind spots, method transfers, dataset opportunities, translational bottlenecks.",
                detail: "Every gap tied to the actual papers that support it.",
                color: "from-teal-600/10 to-teal-800/5 border-teal-500/20",
                dotColor: "bg-teal-500",
              },
            ].map((s, i) => (
              <div key={s.step} className={`relative p-6 rounded-2xl bg-gradient-to-br border ${s.color}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full ${s.dotColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-black text-white">{s.step}</span>
                  </div>
                  <p className="text-sm font-bold text-[rgb(var(--fg))]">{s.title}</p>
                </div>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed mb-2">{s.desc}</p>
                <p className="text-xs text-[rgb(var(--muted))]/60 italic">{s.detail}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={16} className="text-[rgb(var(--muted))]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live demo links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { href: "/gap-ai",       label: "Try Gap AI",          color: "bg-violet-600 hover:bg-violet-700 text-white" },
            { href: "/gap-radar",    label: "Open Gap Radar",       color: "bg-blue-600 hover:bg-blue-700 text-white" },
            { href: "/paper-writer", label: "Write a Paper",        color: "bg-teal-600 hover:bg-teal-700 text-white" },
            { href: "/peer-review",  label: "Simulate Peer Review", color: "bg-amber-600 hover:bg-amber-700 text-white" },
          ].map(({ href, label, color }) => (
            <Link key={href} href={href}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-colors ${color}`}>
              {label} <ArrowRight size={12} />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center p-10 rounded-2xl bg-gradient-to-br from-violet-600/10 to-violet-800/5 border border-violet-500/20">
          <CheckCircle size={32} className="mx-auto text-violet-400 mb-4" />
          <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Free to start. Real citations always.</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-md mx-auto">
            No credit card required. 10 Gap AI searches on the free plan. Upgrade when you need more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
              Create free account <ArrowRight size={15} />
            </Link>
            <Link href="/question-bank"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] font-medium transition-colors">
              Browse 1,000+ community gaps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
