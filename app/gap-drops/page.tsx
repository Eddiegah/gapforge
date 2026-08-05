"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Calendar, TrendingUp, DollarSign, ArrowRightLeft,
  Rocket, ChevronDown, ChevronUp, Loader, RefreshCw
} from "lucide-react";
import { AppNav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { SourceStatus } from "@/components/source-status";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";
import type { GapDrop } from "@/lib/gapDrops/generateDrop";

function CountdownTimer({ targetDay = 5 }: { targetDay?: number }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nextFriday = new Date(now);
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (targetDay - dayOfWeek + 7) % 7 || 7;
      nextFriday.setDate(now.getDate() + daysUntilFriday);
      nextFriday.setHours(9, 0, 0, 0);

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
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDay]);

  const units = [
    { label: "days", value: timeLeft.days },
    { label: "hours", value: timeLeft.hours },
    { label: "min", value: timeLeft.minutes },
    { label: "sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3">
      {units.map(({ label, value }) => (
        <div key={label} className="text-center">
          <motion.div
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold font-mono tabular-nums text-[rgb(var(--foreground))]"
          >
            {String(value).padStart(2, "0")}
          </motion.div>
          <div className="text-xs text-[rgb(var(--muted))]">{label}</div>
        </div>
      ))}
    </div>
  );
}

function DropSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-[rgb(var(--card))]/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-coral" />
          <span className="font-medium text-[rgb(var(--foreground))]">{title}</span>
          <span className="badge bg-coral/10 text-coral">{count}</span>
        </div>
        {open ? <ChevronUp size={15} className="text-[rgb(var(--muted))]" /> : <ChevronDown size={15} className="text-[rgb(var(--muted))]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GapDropsPage() {
  const [drops, setDrops] = useState<GapDrop[]>([]);
  const [selectedDrop, setSelectedDrop] = useState<GapDrop | null>(null);
  const [loadingDrops, setLoadingDrops] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gap-drops")
      .then((r) => r.json())
      .then((data) => {
        setDrops(data.drops ?? []);
        if (data.drops?.length > 0) setSelectedDrop(data.drops[0]);
      })
      .finally(() => setLoadingDrops(false));
  }, []);

  const generateDrop = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/gap-drops", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDrops((prev) => [data.drop, ...prev]);
      setSelectedDrop(data.drop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Gap Drops</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Your personalized weekly research intelligence digest, generated from your niche.
            </p>
          </div>
          <button
            onClick={generateDrop}
            disabled={generating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {generating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Loader size={14} />
              </motion.div>
            ) : (
              <RefreshCw size={14} />
            )}
            {generating ? "Generating..." : "Generate now"}
          </button>
        </div>

        {/* Countdown */}
        {drops.length > 0 && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-coral" />
              <span className="text-sm text-[rgb(var(--muted))]">Next drop in</span>
            </div>
            <CountdownTimer />
            <p className="text-xs text-[rgb(var(--muted))] mt-3">
              Drops are generated every Friday at 09:00 UTC from your research profile.
            </p>
          </div>
        )}

        {error && (
          <div className="card p-4 mb-6 border-red-400/20 bg-red-400/5 text-sm text-red-400">
            {error}
          </div>
        )}

        {loadingDrops ? (
          <div className="flex justify-center py-16">
            <Loader size={24} className="text-coral animate-spin" />
          </div>
        ) : drops.length === 0 ? (
          <div className="card p-12 text-center">
            <Zap size={32} className="text-coral mx-auto mb-4" />
            <h2 className="font-semibold text-[rgb(var(--foreground))] mb-2">No drops yet</h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-sm mx-auto">
              Complete your research profile to receive weekly drops, or generate one now to see how it works.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/onboarding" className="btn-primary text-sm">Set up profile</a>
              <button onClick={generateDrop} disabled={generating} className="btn-secondary text-sm">
                Generate a drop now
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Archive sidebar */}
            <div className="w-40 flex-shrink-0 hidden md:block">
              <p className="text-xs font-medium text-[rgb(var(--muted))] mb-2 uppercase tracking-wide">Archive</p>
              <div className="space-y-1">
                {drops.map((drop) => (
                  <button
                    key={drop.id}
                    onClick={() => setSelectedDrop(drop as GapDrop)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedDrop?.id === drop.id
                        ? "bg-coral/10 text-coral"
                        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card))]"
                    }`}
                  >
                    <div className="font-medium">{(drop as GapDrop).weekLabel}</div>
                    <div className="opacity-60 mt-0.5">{formatRelativeDate((drop as GapDrop).generatedAt)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Drop content */}
            <div className="flex-1 min-w-0">
              {selectedDrop && (
                <motion.div
                  key={selectedDrop.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-[rgb(var(--foreground))]">
                      Week {selectedDrop.weekLabel}
                    </h2>
                    <SourceStatus
                      sourcesQueried={selectedDrop.sourcesQueried}
                      sourcesSkipped={[]}
                      className="text-right"
                    />
                  </div>

                  {/* Research Gaps */}
                  <DropSection title="Research Gaps" icon={Zap} count={selectedDrop.gaps.length}>
                    <div className="space-y-3">
                      {selectedDrop.gaps.map((gap: DetectedGap) => (
                        <GapCard key={gap.id} gap={gap} />
                      ))}
                    </div>
                  </DropSection>

                  {/* Startup Opportunities */}
                  <DropSection title="Startup Opportunities" icon={Rocket} count={selectedDrop.startupOpps.length}>
                    <div className="space-y-3">
                      {selectedDrop.startupOpps.map((opp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-[rgb(var(--foreground))]">{opp.title}</p>
                          <p className="text-[rgb(var(--muted))] mt-1 leading-relaxed">{opp.description}</p>
                        </div>
                      ))}
                    </div>
                  </DropSection>

                  {/* Emerging Trends */}
                  <DropSection title="Emerging Trends" icon={TrendingUp} count={selectedDrop.trends.length}>
                    <div className="space-y-3">
                      {selectedDrop.trends.map((trend, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-[rgb(var(--foreground))]">{trend.title}</p>
                          <p className="text-[rgb(var(--muted))] mt-1 leading-relaxed">{trend.description}</p>
                          <p className="text-xs text-[rgb(var(--muted))]/70 mt-1 italic">Evidence: {trend.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </DropSection>

                  {/* Funding Opportunities */}
                  <DropSection title="Funding Opportunities" icon={DollarSign} count={selectedDrop.fundingOpps.length}>
                    <div className="space-y-3">
                      {selectedDrop.fundingOpps.map((opp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-[rgb(var(--foreground))]">{opp.title}</p>
                          <p className="text-[rgb(var(--muted))] mt-1 leading-relaxed">{opp.description}</p>
                          {opp.potentialFunders && opp.potentialFunders.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {opp.potentialFunders.map((f) => (
                                <span key={f} className="badge bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </DropSection>

                  {/* Cross-Disciplinary */}
                  <DropSection title="Cross-Disciplinary Transfers" icon={ArrowRightLeft} count={selectedDrop.crossDiscipline.length}>
                    <div className="space-y-3">
                      {selectedDrop.crossDiscipline.map((item, i) => (
                        <div key={i} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge bg-blue-400/10 text-blue-400">{item.fromField}</span>
                            <ArrowRightLeft size={11} className="text-[rgb(var(--muted))]" />
                            <span className="badge bg-purple-400/10 text-purple-400">{item.toField}</span>
                          </div>
                          <p className="text-[rgb(var(--muted))] leading-relaxed">{item.opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </DropSection>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
