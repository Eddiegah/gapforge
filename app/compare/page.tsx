"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, Plus, X, Loader, Trash2 } from "lucide-react";
import { AppNav } from "@/components/nav";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";

const CATEGORY_COLORS: Record<GapCategory, string> = {
  contradiction: "text-red-400 bg-red-400/10",
  "missing-mechanistic-link": "text-amber-400 bg-amber-400/10",
  "unexplored-method-transfer": "text-blue-400 bg-blue-400/10",
  "population-blind-spot": "text-purple-400 bg-purple-400/10",
  "untouched-dataset-opportunity": "text-green-400 bg-green-400/10",
  "translational-bottleneck": "text-orange-400 bg-orange-400/10",
};

function MetricBar({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[rgb(var(--muted))] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", highlight ? "bg-violet-500" : "bg-[rgb(var(--muted))]/50")} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("text-xs font-mono w-8 text-right", highlight ? "text-violet-400 font-bold" : "text-[rgb(var(--muted))]")}>{value}%</span>
    </div>
  );
}

export default function ComparePage() {
  const [savedGaps, setSavedGaps] = useState<{ id: string; gap_json: DetectedGap }[]>([]);
  const [selected, setSelected] = useState<DetectedGap[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gap-ai/save").then(r => r.json()).then(d => setSavedGaps(d.saved ?? [])).finally(() => setLoading(false));
  }, []);

  const addGap = (gap: DetectedGap) => {
    if (selected.length >= 3) return;
    if (selected.find(g => g.id === gap.id)) return;
    setSelected(prev => [...prev, gap]);
    setShowPicker(false);
  };

  const removeGap = (id: string) => setSelected(prev => prev.filter(g => g.id !== id));

  const bestConfidence = Math.max(...selected.map(g => g.confidence ?? 70));
  const bestNovelty = Math.max(...selected.map(g => g.novelty ?? 70));
  const bestFeasibility = Math.max(...selected.map(g => g.feasibility ?? 70));
  const bestScore = Math.max(...selected.map(g => g.relevanceScore));

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart2 size={20} className="text-violet-400" />
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Compare Gaps</h1>
                <p className="text-sm text-[rgb(var(--muted))]">Compare up to 3 saved gaps side by side</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Trash2 size={13} /> Clear all
                </button>
              )}
              {selected.length < 3 && (
                <button onClick={() => setShowPicker(true)} className="btn-primary flex items-center gap-2 text-sm">
                  <Plus size={14} /> Add gap
                </button>
              )}
            </div>
          </div>

          {selected.length === 0 ? (
            <div className="card p-16 text-center">
              <BarChart2 size={36} className="text-[rgb(var(--muted))] mx-auto mb-4" />
              <h2 className="font-semibold text-[rgb(var(--fg))] mb-2">No gaps to compare yet</h2>
              <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-sm mx-auto">
                Add 2-3 saved gaps to compare their confidence, novelty, feasibility, and suggested directions.
              </p>
              <button onClick={() => setShowPicker(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus size={14} /> Add your first gap
              </button>
            </div>
          ) : (
            <div className={cn("grid gap-4", selected.length === 1 ? "grid-cols-1 max-w-md" : selected.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {selected.map(gap => {
                const catColor = CATEGORY_COLORS[gap.category] ?? "text-violet-400 bg-violet-400/10";
                const isBestScore = gap.relevanceScore === bestScore;
                return (
                  <motion.div key={gap.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("card p-5 space-y-4 relative", isBestScore && selected.length > 1 ? "border-violet-500/50 ring-1 ring-violet-500/20" : "")}>
                    {isBestScore && selected.length > 1 && (
                      <div className="absolute -top-2.5 left-4 bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Best match</div>
                    )}
                    <button onClick={() => removeGap(gap.id)} className="absolute top-3 right-3 p-1 rounded text-[rgb(var(--muted))] hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", catColor)}>
                      {gap.category.replace(/-/g, " ")}
                    </span>
                    <h3 className="font-bold text-[rgb(var(--fg))] leading-snug pr-6">{gap.title}</h3>
                    <div className="space-y-2">
                      <MetricBar label="Confidence" value={gap.confidence ?? 70} highlight={(gap.confidence ?? 70) === bestConfidence && selected.length > 1} />
                      <MetricBar label="Novelty" value={gap.novelty ?? 70} highlight={(gap.novelty ?? 70) === bestNovelty && selected.length > 1} />
                      <MetricBar label="Feasibility" value={gap.feasibility ?? 70} highlight={(gap.feasibility ?? 70) === bestFeasibility && selected.length > 1} />
                    </div>
                    <div className="text-center">
                      <div className={cn("text-2xl font-bold", isBestScore && selected.length > 1 ? "text-violet-400" : "text-[rgb(var(--muted))]")}>
                        {gap.relevanceScore * 10}
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">Relevance score</div>
                    </div>
                    {gap.suggestedDirection && (
                      <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-300 leading-relaxed">
                        {gap.suggestedDirection}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Gap picker modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowPicker(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border))]">
                <h2 className="font-semibold text-[rgb(var(--fg))]">Select a gap to compare</h2>
                <button onClick={() => setShowPicker(false)} className="p-1.5 rounded text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader size={20} className="text-violet-400 animate-spin" /></div>
                ) : savedGaps.length === 0 ? (
                  <p className="text-center text-sm text-[rgb(var(--muted))] py-8">No saved gaps yet. Save gaps from Gap AI first.</p>
                ) : (
                  savedGaps.filter(g => !selected.find(s => s.id === g.gap_json.id)).map(g => (
                    <button key={g.id} onClick={() => addGap(g.gap_json)}
                      className="w-full text-left p-3 rounded-xl border border-[rgb(var(--border))] hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                      <p className="text-sm font-medium text-[rgb(var(--fg))] leading-snug">{g.gap_json.title}</p>
                      <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{g.gap_json.category.replace(/-/g, " ")}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
