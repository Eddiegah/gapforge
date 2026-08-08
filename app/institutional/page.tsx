"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Building2, Users, Search, BookOpen, TrendingUp,
  Loader2, Download, BarChart3, Zap, Crown, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface InstStats {
  totalResearchers: number;
  totalSearches: number;
  totalGaps: number;
  totalPapers: number;
  topFields: { field: string; count: number }[];
  topResearchers: { id: string; name: string; image: string | null; searches: number; gaps: number }[];
  activityByDay: { date: string; count: number }[];
  plan: string;
}

export default function InstitutionalPage() {
  const [stats, setStats] = useState<InstStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    fetch("/api/user/plan").then(r => r.json()).then(d => setPlan(d.plan ?? "free")).catch(() => {});
    fetch("/api/institutional/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isInstitutional = ["institutional", "team"].includes(plan);

  if (!isInstitutional) {
    return (
      <div className="flex min-h-screen bg-[rgb(var(--bg))]">
        <AppNav />
        <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex items-center justify-center px-4">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Building2 size={36} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] mb-3">Institutional Dashboard</h1>
            <p className="text-[rgb(var(--muted))] mb-6 leading-relaxed">
              The Institutional Dashboard gives university departments and research labs a unified view of all researcher activity, gap discovery, and analytics across your team.
            </p>
            <div className="card p-5 text-left space-y-3 mb-6">
              {[
                "Department-wide gap discovery analytics",
                "Researcher activity and engagement reports",
                "Top research fields and trending gaps",
                "Export reports for grant applications",
                "Multi-seat team management",
                "Priority support",
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors">
              <Crown size={15} /> Upgrade to Team/Institutional <ArrowRight size={14} />
            </Link>
            <p className="text-xs text-[rgb(var(--muted))] mt-3">Team plan from $40/month · Institutional pricing available</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Building2 size={22} className="text-amber-400" /> Institutional Dashboard
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">Department-wide research intelligence overview.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              <Download size={14} /> Export report
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-violet-400" /></div>
          ) : !stats ? (
            <p className="text-center text-[rgb(var(--muted))]">No data available yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: "Researchers", value: stats.totalResearchers, color: "text-violet-400 bg-violet-400/10" },
                  { icon: Search, label: "Searches run", value: stats.totalSearches, color: "text-blue-400 bg-blue-400/10" },
                  { icon: Zap, label: "Gaps found", value: stats.totalGaps, color: "text-amber-400 bg-amber-400/10" },
                  { icon: BookOpen, label: "Papers analyzed", value: stats.totalPapers, color: "text-green-400 bg-green-400/10" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="card p-5 flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", color)}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[rgb(var(--fg))]">{value.toLocaleString()}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Activity chart */}
              {stats.activityByDay.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4 flex items-center gap-2">
                    <BarChart3 size={14} className="text-violet-400" /> Search activity (last 30 days)
                  </h3>
                  <div className="flex items-end gap-1 h-20">
                    {stats.activityByDay.map((d, i) => {
                      const max = Math.max(...stats.activityByDay.map(x => Number(x.count)), 1);
                      return (
                        <div key={i} className="flex-1 group relative">
                          <div className="bg-violet-500 hover:bg-violet-400 rounded-sm transition-colors"
                            style={{ height: `${(Number(d.count) / max) * 72}px`, minHeight: 2 }}
                            title={`${d.count} searches on ${d.date}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top researchers */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4 flex items-center gap-2">
                    <Crown size={14} className="text-amber-400" /> Most active researchers
                  </h3>
                  <div className="space-y-3">
                    {stats.topResearchers.slice(0, 5).map((r, i) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <span className="text-sm font-black text-[rgb(var(--border))] w-5">{i + 1}</span>
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image} alt={r.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">{r.name?.[0] ?? "R"}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{r.name}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">{r.searches} searches · {r.gaps} gaps</p>
                        </div>
                      </div>
                    ))}
                    {stats.topResearchers.length === 0 && (
                      <p className="text-xs text-[rgb(var(--muted))] text-center py-4">No researcher data yet.</p>
                    )}
                  </div>
                </div>

                {/* Top research fields */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-violet-400" /> Top research fields
                  </h3>
                  <div className="space-y-3">
                    {stats.topFields.slice(0, 6).map((f, i) => {
                      const max = stats.topFields[0]?.count ?? 1;
                      return (
                        <div key={f.field} className="flex items-center gap-3">
                          <span className="text-xs text-[rgb(var(--muted))] w-4">{i + 1}</span>
                          <span className="text-xs text-[rgb(var(--muted))] flex-1 capitalize truncate">{f.field.replace(/-/g, " ")}</span>
                          <div className="w-24 h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(Number(f.count) / Number(max)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono text-[rgb(var(--muted))] w-6 text-right">{f.count}</span>
                        </div>
                      );
                    })}
                    {stats.topFields.length === 0 && (
                      <p className="text-xs text-[rgb(var(--muted))] text-center py-4">No field data yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
