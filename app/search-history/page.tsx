"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Search, Download, Trash2, Clock, Zap,
  ArrowRight, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SearchEntry {
  id: string;
  query: string;
  gaps_found: number;
  papers_analyzed: number;
  created_at: string;
}

export default function SearchHistoryPage() {
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/gap-ai/history?limit=100")
      .then(r => r.json())
      .then(d => setHistory(d.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h =>
    !search || h.query.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csv = "Query,Gaps Found,Papers Analyzed,Date\n" +
      filtered.map(h => `"${h.query}",${h.gaps_found},${h.papers_analyzed},${new Date(h.created_at).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "gapforge-searches.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = filtered.map(h => ({ query: h.query, gapsFound: h.gaps_found, papersAnalyzed: h.papers_analyzed, date: h.created_at }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "gapforge-searches.json"; a.click();
    URL.revokeObjectURL(url);
  };

  // Group by month
  const grouped: Record<string, SearchEntry[]> = {};
  filtered.forEach(h => {
    const month = new Date(h.created_at).toLocaleDateString("en", { month: "long", year: "numeric" });
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(h);
  });

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Clock size={22} className="text-violet-400" /> Search History
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">{history.length} searches total</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <Download size={13} /> CSV
              </button>
              <button onClick={exportJSON} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <Download size={13} /> JSON
              </button>
            </div>
          </div>

          <div className="relative mb-5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter searches..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <Search size={32} className="mx-auto text-[rgb(var(--muted))] mb-3 opacity-40" />
              <p className="text-[rgb(var(--muted))] text-sm mb-4">{history.length === 0 ? "No searches yet" : "No matches"}</p>
              <Link href="/gap-ai" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                <Zap size={14} /> Run a search
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([month, entries]) => (
                <div key={month}>
                  <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">{month} · {entries.length} searches</p>
                  <div className="space-y-2">
                    {entries.map((entry, i) => (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="card p-4 flex items-center gap-3 hover:border-violet-500/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{entry.query}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[rgb(var(--muted))]">
                            <span className="flex items-center gap-1"><Zap size={10} className="text-violet-400" /> {entry.gaps_found} gaps</span>
                            <span>{entry.papers_analyzed} papers</span>
                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(entry.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/gap-ai?q=${encodeURIComponent(entry.query)}`}
                            className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors" title="Re-run">
                            <RefreshCw size={13} />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
