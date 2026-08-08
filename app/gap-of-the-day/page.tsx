"use client";

import { useEffect, useState } from "react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { Loader, Zap, CalendarDays, RefreshCw, Trophy, Share2 } from "lucide-react";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import Link from "next/link";

interface GapOfDay {
  id: string;
  gap: DetectedGap;
  date: string;
  submittedBy?: string;
  votes: number;
}

export default function GapOfTheDayPage() {
  const [data, setData] = useState<GapOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetch("/api/gap-of-the-day")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    const text = data ? `Check out today's research gap on GapForge: "${data.gap.title}"` : "Check out GapForge!";
    if (navigator.share) {
      navigator.share({ title: "Gap of the Day", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const today = new Date().toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-amber-400" />
                <h1 className="text-xl md:text-2xl font-bold text-[rgb(var(--fg))]">Gap of the Day</h1>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                <CalendarDays size={12} />
                <span>{today}</span>
              </div>
            </div>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors flex-shrink-0">
              <Share2 size={13} />
              {shared ? "Copied!" : "Share"}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader size={24} className="animate-spin text-violet-400" />
            </div>
          ) : !data ? (
            <div className="card p-10 text-center">
              <Zap size={36} className="mx-auto text-amber-400 mb-4 opacity-50" />
              <p className="text-[rgb(var(--muted))] text-sm mb-4">No gap selected for today yet.</p>
              <Link href="/gap-ai" className="btn-primary inline-flex items-center gap-2">
                <Zap size={14} /> Search for gaps
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats bar */}
              <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Trophy size={14} />
                  <span className="text-sm font-semibold">Today&apos;s Featured Gap</span>
                </div>
                <div className="ml-auto flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
                  <span>{data.votes ?? 0} votes</span>
                  {data.submittedBy && <span>by {data.submittedBy}</span>}
                </div>
              </div>

              <GapCard gap={data.gap} index={1} />

              <div className="card p-5">
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">What to do with this gap</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Search deeper", desc: "Find related gaps in this area", href: `/gap-ai?q=${encodeURIComponent(data.gap.title)}`, color: "text-violet-400" },
                    { label: "Track it", desc: "Add to My Issues tracker", href: "/issues", color: "text-teal-400" },
                    { label: "Write about it", desc: "Draft a research proposal", href: "/ai-writer", color: "text-amber-400" },
                  ].map(item => (
                    <Link key={item.label} href={item.href}
                      className="p-3 rounded-lg border border-[rgb(var(--border))] hover:border-violet-500/30 transition-colors">
                      <p className={`text-xs font-semibold mb-0.5 ${item.color}`}>{item.label}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{item.desc}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-[rgb(var(--muted))]">
                A new gap is featured every day. Come back tomorrow.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
