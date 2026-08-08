import { PublicNav } from "@/components/nav";
import { BookOpen, Zap, ArrowRight, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

// Static sample digest data
const DIGEST_ISSUES = [
  {
    week: "2026-W32",
    label: "Week of Aug 3, 2026",
    featured: [
      {
        title: "Why mRNA vaccines haven't been tested in sub-Saharan metabolic contexts",
        field: "Vaccinology",
        confidence: 87,
        summary: "Despite widespread mRNA vaccine deployment, no large-scale efficacy studies account for the distinct metabolic profiles common in West African populations. This gap persists due to historical exclusion in clinical trial design.",
      },
      {
        title: "The missing link between social media use and cortisol dysregulation in adolescents",
        field: "Neuroscience",
        confidence: 82,
        summary: "Multiple correlational studies show a link between heavy social media use and elevated stress markers, yet no longitudinal study has directly measured cortisol dynamics during active platform use.",
      },
      {
        title: "Soil carbon sequestration models ignore mycorrhizal fungi density variation",
        field: "Environmental Science",
        confidence: 79,
        summary: "Current IPCC-referenced soil carbon models treat fungal biomass as a constant, despite evidence that mycorrhizal density varies 3-8x across comparable agricultural regions.",
      },
    ],
    trend: "AI-assisted drug discovery gaps dominated searches this week, with 34% of queries focused on LLM validation in clinical settings.",
    subscribers: 2847,
  },
  {
    week: "2026-W31",
    label: "Week of Jul 27, 2026",
    featured: [
      {
        title: "No validated protocol for detecting microplastics in human breast milk",
        field: "Environmental Health",
        confidence: 91,
        summary: "While microplastics have been detected in human tissues including blood and lungs, no standardized detection protocol exists for breast milk, limiting our understanding of infant exposure pathways.",
      },
      {
        title: "Quantum computing error correction benchmarks ignore thermal noise at scale",
        field: "Quantum Computing",
        confidence: 85,
        summary: "Published error correction benchmarks for fault-tolerant quantum systems are obtained under controlled cryogenic conditions that differ substantially from expected operational environments.",
      },
    ],
    trend: "Climate science gaps up 18% week-over-week following IPCC pre-publication summary leaks.",
    subscribers: 2791,
  },
];

export default function DigestPage() {
  const latest = DIGEST_ISSUES[0];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
            <Zap size={12} /> Weekly Research Digest
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-3">The GapForge Weekly</h1>
          <p className="text-[rgb(var(--muted))] max-w-xl mx-auto">
            Every week, we curate the most important research gaps discovered by the GapForge community. Free to read. No account required.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              Subscribe free <ArrowRight size={14} />
            </Link>
            <span className="text-xs text-[rgb(var(--muted))]">{latest.subscribers.toLocaleString()} subscribers</span>
          </div>
        </div>

        {/* Latest issue */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={14} className="text-violet-400" />
            <span className="text-sm font-semibold text-[rgb(var(--fg))]">{latest.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">Latest</span>
          </div>

          <div className="space-y-5">
            {latest.featured.map((gap, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--bg))] text-[rgb(var(--muted))] border border-[rgb(var(--border))]">
                    {gap.field}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <TrendingUp size={11} />
                    <span>{gap.confidence}% confidence</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-[rgb(var(--fg))] mb-2 leading-snug">
                  {gap.title}
                </h3>
                <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.summary}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Link href={`/gap-ai?q=${encodeURIComponent(gap.title)}`}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                    Search this gap <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Trend note */}
          <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2.5">
              <TrendingUp size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-1">Community Trend</p>
                <p className="text-sm text-[rgb(var(--muted))]">{latest.trend}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Past issues */}
        <div>
          <h2 className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Past Issues</h2>
          <div className="space-y-3">
            {DIGEST_ISSUES.slice(1).map(issue => (
              <div key={issue.week} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--fg))]">{issue.label}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{issue.featured.length} featured gaps</p>
                </div>
                <BookOpen size={15} className="text-[rgb(var(--muted))]" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-violet-600/10 to-violet-800/5 border border-violet-500/20">
          <h2 className="text-lg font-bold text-[rgb(var(--fg))] mb-2">Find your own gaps</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-5">
            GapForge searches 250M+ papers to surface research opportunities in your field. Free to start.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
            Start for free <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
