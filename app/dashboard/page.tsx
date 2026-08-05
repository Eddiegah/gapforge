"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Zap, BookOpen, Calendar, ArrowRight,
  Bookmark, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/nav";
import { useSession } from "next-auth/react";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

/* ── Sources for scrolling strip ── */
const SOURCES = [
  "Semantic Scholar", "arXiv", "PubMed", "OpenAlex", "Crossref",
  "CORE", "bioRxiv", "DOAJ", "NASA ADS", "Crossref",
];

/* ── Countdown to next Friday 12pm EST ── */
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextFriday = new Date(now);
      const dayOfWeek = now.getDay(); // 0=Sun ... 5=Fri
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
      nextFriday.setDate(now.getDate() + daysUntilFriday);
      nextFriday.setHours(17, 0, 0, 0); // 12pm EST = 17:00 UTC

      const diff = nextFriday.getTime() - now.getTime();
      if (diff <= 0) return;

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { label: "days", value: timeLeft.days },
    { label: "hrs", value: timeLeft.hours },
    { label: "min", value: timeLeft.minutes },
    { label: "sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3">
      {units.map(({ label, value }) => (
        <div key={label} className="text-center">
          <motion.div
            key={value}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold font-mono tabular-nums text-[rgb(var(--fg))] bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg px-3 py-1"
          >
            {String(value).padStart(2, "0")}
          </motion.div>
          <div className="text-xs text-[rgb(var(--muted))] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentGaps, setRecentGaps] = useState<
    { id: string; gap_json: DetectedGap; created_at: string }[]
  >([]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "researcher";

  useEffect(() => {
    fetch("/api/gap-ai/save")
      .then((r) => r.json())
      .then((d) => {
        const saved = d.saved ?? [];
        setRecentGaps(saved.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const quickActions = [
    {
      icon: Search,
      title: "Run Gap AI Search",
      description: "Enter a topic and scan the literature for research gaps.",
      href: "/gap-ai",
      color: "from-violet-600/20 to-violet-800/20 border-violet-600/20",
      iconColor: "text-violet-400",
    },
    {
      icon: Zap,
      title: "Read Latest Drop",
      description: "View your most recent personalized research intelligence digest.",
      href: "/gap-drops",
      color: "from-amber-500/20 to-amber-700/20 border-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      icon: BookOpen,
      title: "Simplify a Paper",
      description: "Paste a DOI or arXiv link to get plain-language analysis.",
      href: "/gap-simplify",
      color: "from-emerald-500/20 to-emerald-700/20 border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />

      {/* Main content — offset for sidebar */}
      <main className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-10 pb-20 space-y-8">

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">
              Good {greeting()},{" "}
              <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                {firstName}.
              </span>
            </h1>
            <p className="text-[rgb(var(--muted))] mt-1">
              Your personalized opportunity intelligence, every Friday.
            </p>
          </motion.div>

          {/* Top cards row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Research niche card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-violet-400" />
                  <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">
                    Research Niche
                  </span>
                </div>
                <Link href="/onboarding" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Change
                </Link>
              </div>
              <p className="text-sm text-[rgb(var(--fg))] leading-relaxed">
                Set up your research profile to personalize Gap Drops and search results.
              </p>
              <Link href="/onboarding" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-400 font-medium hover:gap-2 transition-all">
                Set up profile <ArrowRight size={11} />
              </Link>
            </motion.div>

            {/* Gap Drop countdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={15} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                  Next Gap Drop · Every Friday 12pm EST
                </span>
              </div>
              <CountdownTimer />
            </motion.div>
          </div>

          {/* Source scanner strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card py-3 overflow-hidden"
          >
            <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-2 px-4">
              Live Sources
            </p>
            <div className="overflow-hidden">
              <div className="marquee-track">
                {[...SOURCES, ...SOURCES].map((src, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center mx-3 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-600/20 text-violet-300 text-xs font-medium whitespace-nowrap"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick action cards */}
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide mb-4">
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {quickActions.map(({ icon: Icon, title, description, href, color, iconColor }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                >
                  <Link
                    href={href}
                    className={`block card p-5 bg-gradient-to-b ${color} hover:border-violet-600/40 transition-all hover:-translate-y-0.5`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg))]/50 flex items-center justify-center mb-4">
                      <Icon size={18} className={iconColor} />
                    </div>
                    <h3 className="font-semibold text-[rgb(var(--fg))] text-sm mb-1">{title}</h3>
                    <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--muted))] uppercase tracking-wide">
                Recent Saved Gaps
              </h2>
              <Link href="/library" className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {recentGaps.length === 0 ? (
              <div className="card p-8 text-center">
                <Bookmark size={24} className="text-[rgb(var(--muted))] mx-auto mb-3" />
                <p className="text-sm text-[rgb(var(--muted))]">
                  No saved gaps yet. Run a Gap AI search and save the ones that interest you.
                </p>
                <Link href="/gap-ai" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-400 font-medium hover:gap-2 transition-all">
                  Search for gaps <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGaps.map((g) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card p-4 hover:border-violet-600/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[rgb(var(--fg))] leading-snug mb-1 truncate">
                          {g.gap_json?.title ?? "Untitled gap"}
                        </h3>
                        <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 leading-relaxed">
                          {g.gap_json?.description}
                        </p>
                      </div>
                      <span className="text-xs text-[rgb(var(--muted))] whitespace-nowrap flex-shrink-0">
                        {formatRelativeDate(g.created_at)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
