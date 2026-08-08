"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Zap, BookOpen, ArrowRight,
  Clock, Bookmark, TrendingUp, Tag, Flame, Users2, ExternalLink,
  Radar, Network, FileText, Bell,
} from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/nav";
import { useSession } from "next-auth/react";
import { formatRelativeDate } from "@/lib/utils";
import { OnboardingTour } from "@/components/onboarding-tour";
import { OnboardingChecklist } from "@/components/onboarding-checklist";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

interface CreditsData {
  creditsUsed: number;
  creditsLimit: number;
}

interface HistoryRow {
  id: string;
  query: string;
  gaps_found: number;
  created_at: string;
}

interface SavedGapRow {
  id: string;
}

interface ResearchProfile {
  research_areas: string[];
  keywords: string[];
  career_stage: string | null;
}

function CreditsRing({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(1, used / limit);
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;
  const remaining = limit - used;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg width="64" height="64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgb(var(--border))" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={used >= limit ? "#f87171" : "#7c3aed"}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${used >= limit ? "text-red-400" : "text-violet-400"}`}>
        {remaining}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<CreditsData>({ creditsUsed: 0, creditsLimit: 10 });
  const [recentSearches, setRecentSearches] = useState<HistoryRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [profile, setProfile] = useState<ResearchProfile | null>(null);
  const [streak, setStreak] = useState(0);
  const [paperRecs, setPaperRecs] = useState<{ id: string; title: string; authors: string[]; year: number | null; url: string; venue: string | null }[]>([]);
  const [researchers, setResearchers] = useState<{ id: string; name: string; image: string | null; research_areas: string[]; career_stage: string | null }[]>([]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "researcher";

  useEffect(() => {
    fetch("/api/credits")
      .then(r => r.json())
      .then(d => setCredits({ creditsUsed: d.creditsUsed ?? 0, creditsLimit: d.creditsLimit ?? 10 }))
      .catch(() => {});

    fetch("/api/gap-ai/history")
      .then(r => r.json())
      .then(d => setRecentSearches((d.history ?? []).slice(0, 3)))
      .catch(() => {});

    fetch("/api/gap-ai/save")
      .then(r => r.json())
      .then(d => setSavedCount((d.saved ?? []).length))
      .catch(() => {});

    fetch("/api/onboarding")
      .then(r => r.json())
      .then(d => setProfile(d.profile ?? null))
      .catch(() => {});

    fetch("/api/user/streak")
      .then(r => r.json())
      .then(d => setStreak(d.streak ?? 0))
      .catch(() => {});

    fetch("/api/papers/recommendations")
      .then(r => r.json())
      .then(d => setPaperRecs((d.papers ?? []).slice(0, 4)))
      .catch(() => {});

    fetch("/api/researchers")
      .then(r => r.json())
      .then(d => setResearchers((d.researchers ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const quickActions = [
    {
      icon: Search,
      title: "Run Gap AI Search",
      description: "Scan the literature for research gaps in any niche.",
      href: "/gap-ai",
      color: "from-violet-600/20 to-violet-800/20 border-violet-600/20",
      iconColor: "text-violet-400",
      hoverBorder: "hover:border-violet-500/40",
    },
    {
      icon: Zap,
      title: "View Latest Drop",
      description: "Your personalized weekly research intelligence digest.",
      href: "/gap-drops",
      color: "from-amber-500/20 to-amber-700/20 border-amber-500/20",
      iconColor: "text-amber-400",
      hoverBorder: "hover:border-amber-500/40",
    },
    {
      icon: BookOpen,
      title: "Simplify a Paper",
      description: "Paste a DOI or arXiv link for plain-language analysis.",
      href: "/gap-simplify",
      color: "from-teal-500/20 to-teal-700/20 border-teal-500/20",
      iconColor: "text-teal-400",
      hoverBorder: "hover:border-teal-500/40",
    },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <OnboardingTour />
      <main className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 space-y-6 md:space-y-8">

          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">
              Good {greeting()},{" "}
              <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                {firstName}.
              </span>
            </h1>
            <p className="text-[rgb(var(--muted))] mt-1">Your research intelligence platform</p>
          </motion.div>

          {/* Onboarding checklist */}
          <OnboardingChecklist />

          {/* ROW 1: Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            {/* Credits */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="card p-3 md:p-5 flex items-center gap-3">
              <CreditsRing used={credits.creditsUsed} limit={credits.creditsLimit} />
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {credits.creditsLimit - credits.creditsUsed}/{credits.creditsLimit}
                </p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Credits left</p>
              </div>
            </motion.div>

            {/* Searches this month */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-3 md:p-5 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Search size={18} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-[rgb(var(--fg))]">{credits.creditsUsed}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Searches</p>
              </div>
            </motion.div>

            {/* Saved gaps */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="card p-3 md:p-5 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Bookmark size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-[rgb(var(--fg))]">{savedCount}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Saved</p>
              </div>
            </motion.div>

            {/* Streak */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card p-3 md:p-5 flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                <Flame size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-[rgb(var(--fg))]">{streak}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Day streak</p>
              </div>
            </motion.div>
          </div>

          {/* ROW 2: Quick actions */}
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {quickActions.map(({ icon: Icon, title, description, href, color, iconColor, hoverBorder }, i) => (
                <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
                  <Link href={href} className={`block card p-5 bg-gradient-to-b ${color} ${hoverBorder} hover:-translate-y-0.5 transition-all`}>
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg))]/50 flex items-center justify-center mb-3">
                      <Icon size={18} className={iconColor} />
                    </div>
                    <h3 className="font-semibold text-[rgb(var(--fg))] text-sm mb-1">{title}</h3>
                    <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ROW 3: Recent searches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">Recent Searches</h2>
              <Link href="/gap-ai" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            {recentSearches.length === 0 ? (
              <div className="card p-8 text-center">
                <Search size={24} className="text-[rgb(var(--muted))] mx-auto mb-3" />
                <p className="text-sm text-[rgb(var(--muted))]">No searches yet.</p>
                <Link href="/gap-ai" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-400 font-medium hover:gap-2 transition-all">
                  Run your first search <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSearches.map((s) => (
                  <Link key={s.id} href="/gap-ai"
                    className="block card p-4 hover:border-violet-600/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{s.query}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {formatRelativeDate(s.created_at)}
                          {s.gaps_found > 0 && (
                            <span className="ml-1">&middot; {s.gaps_found} gap{s.gaps_found !== 1 ? "s" : ""} found</span>
                          )}
                        </p>
                      </div>
                      <ArrowRight size={13} className="text-[rgb(var(--muted))] mt-1 flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ROW 4: Research niche */}
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Research Niche</h2>
            {profile ? (
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-violet-400" />
                    <span className="text-sm font-semibold text-[rgb(var(--fg))]">Your research profile</span>
                  </div>
                  <Link href="/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    Edit profile
                  </Link>
                </div>
                {profile.research_areas?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[rgb(var(--muted))] mb-1.5 uppercase tracking-wide">Research areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.research_areas.slice(0, 6).map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-violet-600/10 border border-violet-600/20 text-violet-300">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs text-[rgb(var(--muted))] mb-1.5 uppercase tracking-wide flex items-center gap-1">
                      <Tag size={10} /> Keywords
                    </p>
                    <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">
                      {profile.keywords.slice(0, 8).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-8 text-center border-dashed">
                <TrendingUp size={28} className="text-violet-400/50 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">Set up your research profile</h3>
                <p className="text-xs text-[rgb(var(--muted))] mb-4 max-w-xs mx-auto">
                  Tell us your niche so we can personalize Gap Drops and surface the most relevant research gaps.
                </p>
                <Link href="/onboarding"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  Set up profile <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Paper Recommendations */}
          {paperRecs.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Papers for you this week</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {paperRecs.map((paper, i) => (
                  <motion.a key={paper.id} href={paper.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="card p-4 hover:border-violet-500/30 transition-colors block group">
                    <p className="text-sm font-medium text-[rgb(var(--fg))] line-clamp-2 group-hover:text-violet-300 transition-colors">{paper.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-1">
                      {(paper.authors ?? []).slice(0, 2).join(", ")}{(paper.authors ?? []).length > 2 ? " et al." : ""}
                      {paper.year ? ` · ${paper.year}` : ""}
                    </p>
                    {paper.venue && <p className="text-xs text-[rgb(var(--muted))]/60 mt-0.5 truncate">{paper.venue}</p>}
                    <div className="flex items-center gap-1 mt-2 text-xs text-violet-400">
                      <ExternalLink size={10} /> Read paper
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          )}

          {/* Researchers near your niche */}
          {researchers.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Researchers near your niche</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {researchers.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="card p-4 flex items-start gap-3">
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt={r.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{r.name?.[0] ?? "R"}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{r.name}</p>
                      {r.career_stage && <p className="text-xs text-[rgb(var(--muted))] capitalize">{r.career_stage.replace("-", " ")}</p>}
                      {(r.research_areas ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(r.research_areas ?? []).slice(0, 2).map(a => (
                            <span key={a} className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Discover new tools */}
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Discover</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: "/gap-radar", icon: Radar, label: "Gap Radar", desc: "Visual gap map", color: "text-violet-400 bg-violet-400/10" },
                { href: "/paper-writer", icon: FileText, label: "Paper Writer", desc: "Write full papers", color: "text-blue-400 bg-blue-400/10" },
                { href: "/citation-graph", icon: Network, label: "Citation Graph", desc: "Map paper networks", color: "text-teal-400 bg-teal-400/10" },
                { href: "/gap-alerts", icon: Bell, label: "Gap Alerts", desc: "Monitor your gaps", color: "text-amber-400 bg-amber-400/10" },
              ].map(({ href, icon: Icon, label, desc, color }) => (
                <Link key={href} href={href}
                  className="card p-4 flex flex-col items-center gap-2 text-center hover:border-violet-500/30 hover:-translate-y-0.5 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">{label}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{desc}</p>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
