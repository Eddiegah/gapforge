import { PublicNav } from "@/components/nav";
import { ArrowRight, Search, Zap, BookOpen, Brain, Database, CheckCircle, Users, FileText, BarChart3, MessageSquare, BookmarkCheck, CalendarDays, Play } from "lucide-react";
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
            <Zap size={11} /> Live platform demo
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

        {/* Video Demo Section */}
        <div className="mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-violet-950/40 aspect-video flex items-center justify-center group cursor-pointer shadow-2xl shadow-violet-500/10">
            {/* Placeholder background - replace src with actual video */}
            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--card))] to-[rgb(var(--bg))]" />
            
            {/* Animated grid overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(rgb(124 58 237 / 0.3) 1px, transparent 1px), linear-gradient(90deg, rgb(124 58 237 / 0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }} />

            {/* Mock screen content */}
            <div className="absolute inset-4 md:inset-8 rounded-xl bg-[rgb(var(--card))]/80 backdrop-blur border border-[rgb(var(--border))] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--sidebar))]/80">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <div className="flex-1 mx-4 h-5 rounded-full bg-[rgb(var(--border))] flex items-center px-3">
                  <span className="text-[9px] text-[rgb(var(--muted))]">gapforge-self.vercel.app/gap-ai</span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="h-3 bg-violet-500/20 rounded-full w-3/4" />
                <div className="h-2 bg-[rgb(var(--border))] rounded-full w-1/2" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-[rgb(var(--border))]/40 border border-[rgb(var(--border))]" />
                  ))}
                </div>
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-14 rounded-xl bg-violet-500/5 border border-violet-500/10" />
                  ))}
                </div>
              </div>
            </div>

            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/40 group-hover:scale-110 transition-transform">
                <Play size={28} className="text-white ml-1.5" fill="white" />
              </div>
            </div>

            {/* Caption */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white font-medium">
                GapForge Platform Demo — 3 min walkthrough
              </div>
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-white font-medium">LIVE</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-[rgb(var(--muted))] mt-3">
            Click to watch · Or{" "}
            <Link href="/gap-ai" className="text-violet-400 hover:text-violet-300 transition-colors">
              try Gap AI live right now
            </Link>
          </p>
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
        <div className="card p-8 mb-10">
          <h2 className="text-lg font-bold text-[rgb(var(--fg))] text-center mb-8">How a gap search works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "You enter a topic", desc: "Any field, niche, or question. E.g. 'gut microbiome and depression mechanisms'." },
              { step: "02", title: "We query 10+ databases", desc: "Semantic Scholar, PubMed, arXiv, OpenAlex, Crossref, CORE, bioRxiv, DOAJ, NASA ADS, and more — live, in parallel." },
              { step: "03", title: "AI synthesizes gaps", desc: "Papers are analyzed for contradictions, missing links, population blind spots, method transfer opportunities, and translational bottlenecks. Every gap is tied to the actual retrieved papers." },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <span className="text-3xl font-black text-violet-400/20 leading-none flex-shrink-0">{s.step}</span>
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">{s.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-10 rounded-2xl bg-gradient-to-br from-violet-600/10 to-violet-800/5 border border-violet-500/20">
          <CheckCircle size={32} className="mx-auto text-violet-400 mb-4" />
          <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Free to start. Real citations always.</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-md mx-auto">
            No credit card required. 10 Gap AI searches on the free plan. Upgrade when you need more.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors">
            Create free account <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
