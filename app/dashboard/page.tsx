"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Zap, BookOpen, ArrowRight,
  Clock, Bookmark, TrendingUp, Tag,
} from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/nav";
import { useSession } from "next-auth/react";
import { formatRelativeDate } from "@/lib/utils";

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
  const [credits, setCredits] = useState<CreditsData>({ creditsUsed: 0, creditsLimit: 20 });
  const [recentSearches, setRecentSearches] = useState<HistoryRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [profile, setProfile] = useState<ResearchProfile | null>(null);

  const firstName = session?.user?.name?.split(" ")[0] ?? "researcher";

  useEffect(() => {
    fetch("/api/credits")
      .then(r => r.json())
      .then(d => setCredits({ creditsUsed: d.creditsUsed ?? 0, creditsLimit: d.creditsLimit ?? 20 }))
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
      <main className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-10 pb-20 space-y-8">

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

          {/* ROW 1: Stats cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Credits */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="card p-5 flex items-center gap-4">
              <CreditsRing used={credits.creditsUsed} limit={credits.creditsLimit} />
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {credits.creditsLimit - credits.creditsUsed}/{credits.creditsLimit}
                </p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Credits remaining</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Resets monthly</p>
              </div>
            </motion.div>

            {/* Searches this month */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                <Search size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[rgb(var(--fg))]">{credits.creditsUsed}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Searches this month</p>
              </div>
            </motion.div>

            {/* Saved gaps */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <Bookmark size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[rgb(var(--fg))]">{savedCount}</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Gaps saved</p>
              </div>
            </motion.div>
          </div>

          {/* ROW 2: Quick actions */}
          <div>
            <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-4">
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

        </div>
      </main>
    </div>
  );
}
