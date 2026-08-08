"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, Search, Loader2, ZoomIn, ZoomOut, RefreshCw,
  Info, X, ExternalLink, Sparkles, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface RadarNode {
  gap: DetectedGap;
  x: number;
  y: number;
  r: number; // radius = importance
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "contradiction": "#f87171",
  "missing-mechanistic-link": "#fb923c",
  "unexplored-method-transfer": "#60a5fa",
  "population-blind-spot": "#c084fc",
  "untouched-dataset-opportunity": "#34d399",
  "translational-bottleneck": "#fbbf24",
};

const CATEGORY_LABELS: Record<string, string> = {
  "contradiction": "Contradiction",
  "missing-mechanistic-link": "Missing Link",
  "unexplored-method-transfer": "Method Transfer",
  "population-blind-spot": "Population Gap",
  "untouched-dataset-opportunity": "Dataset Opp.",
  "translational-bottleneck": "Translational",
};

function layoutNodes(gaps: DetectedGap[], w: number, h: number): RadarNode[] {
  const cx = w / 2;
  const cy = h / 2;
  const nodes: RadarNode[] = [];
  const placed: { x: number; y: number; r: number }[] = [];

  // Place center "anchor" — highest score gap
  const sorted = [...gaps].sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  sorted.forEach((gap, i) => {
    const score = gap.relevanceScore ?? 5;
    const r = Math.max(18, Math.min(48, score * 4.5));
    const maxAttempts = 80;
    let x = 0, y = 0;
    let placed_ok = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Spread across concentric rings based on score
      const ring = i === 0 ? 0 : Math.ceil(i / 6);
      const ringRadius = ring === 0 ? 0 : ring * (Math.min(w, h) * 0.16);
      const angle = (i / sorted.length) * Math.PI * 2 + (ring * 0.4) + (attempt * 0.3);
      const jitter = attempt * 8;

      x = cx + Math.cos(angle) * (ringRadius + jitter) + (Math.random() - 0.5) * 20;
      y = cy + Math.sin(angle) * (ringRadius + jitter) + (Math.random() - 0.5) * 20;

      // Keep within bounds
      x = Math.max(r + 8, Math.min(w - r - 8, x));
      y = Math.max(r + 8, Math.min(h - r - 8, y));

      // Check overlap
      const overlaps = placed.some(p => {
        const dx = p.x - x; const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < p.r + r + 12;
      });

      if (!overlaps) { placed_ok = true; break; }
    }

    if (!placed_ok) {
      // Fallback: grid position
      const cols = Math.ceil(Math.sqrt(sorted.length));
      x = (i % cols) * (w / cols) + w / cols / 2;
      y = Math.floor(i / cols) * (h / Math.ceil(sorted.length / cols)) + 50;
    }

    placed.push({ x, y, r });
    nodes.push({ gap, x, y, r, color: CATEGORY_COLORS[gap.category] ?? "#7c3aed" });
  });

  return nodes;
}

export default function GapRadarPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<RadarNode[]>([]);
  const [selected, setSelected] = useState<RadarNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 820, H = 560;

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setSearched(q);
    try {
      const res = await fetch("/api/gap-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      const gaps: DetectedGap[] = data.gaps ?? [];
      setNodes(layoutNodes(gaps, W, H));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const categoryList = Array.from(new Set(nodes.map(n => n.gap.category)));

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-8 py-5 border-b border-[rgb(var(--border))] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Radar size={20} className="text-violet-400" />
            <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Gap Radar</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">Visual</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search(query)}
                placeholder="Enter a research topic to visualize the gap landscape..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
            </div>
            <button
              onClick={() => search(query)}
              disabled={loading || !query.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors flex-shrink-0"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              <ZoomIn size={15} />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
              <ZoomOut size={15} />
            </button>
            {nodes.length > 0 && (
              <button onClick={() => search(searched)} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <RefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Canvas + Detail panel */}
        <div className="flex flex-1 overflow-hidden">
          {/* SVG Radar */}
          <div className="flex-1 relative overflow-hidden bg-[rgb(var(--bg))]">
            {!nodes.length && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-500/30 flex items-center justify-center">
                  <Radar size={32} className="text-violet-400/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Enter a topic to visualize the research gap landscape</p>
                  <p className="text-xs text-[rgb(var(--muted))] max-w-sm">Each bubble represents a gap. Size = importance. Color = gap type. Click any bubble to explore.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {["CRISPR gene therapy", "gut microbiome depression", "AI diagnostics bias", "climate tipping points"].map(s => (
                    <button key={s} onClick={() => { setQuery(s); search(s); }}
                      className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-violet-500/20 animate-ping absolute inset-0" />
                  <div className="w-24 h-24 rounded-full border-2 border-violet-500/10 animate-ping absolute inset-0" style={{ animationDelay: "0.4s" }} />
                  <div className="w-24 h-24 rounded-full border border-violet-500/30 flex items-center justify-center">
                    <Radar size={28} className="text-violet-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-sm text-violet-400 font-medium">Scanning research landscape...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button onClick={() => search(searched)} className="text-xs text-violet-400 underline">Retry</button>
                </div>
              </div>
            )}

            {nodes.length > 0 && (
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
              >
                {/* Background rings */}
                {[0.15, 0.28, 0.42].map((r, i) => (
                  <circle key={i} cx={W / 2} cy={H / 2} r={Math.min(W, H) * r}
                    fill="none" stroke="rgb(var(--border))" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
                ))}
                {/* Center cross */}
                <line x1={W / 2 - 8} y1={H / 2} x2={W / 2 + 8} y2={H / 2} stroke="rgb(var(--border))" strokeWidth="1" opacity="0.5" />
                <line x1={W / 2} y1={H / 2 - 8} x2={W / 2} y2={H / 2 + 8} stroke="rgb(var(--border))" strokeWidth="1" opacity="0.5" />

                {/* Connection lines for related gaps */}
                {nodes.map((n, i) => nodes.slice(i + 1).filter(m => m.gap.category === n.gap.category).map((m, j) => (
                  <line key={`${i}-${j}`}
                    x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                    stroke={n.color} strokeWidth="0.5" opacity="0.12" />
                )))}

                {/* Nodes */}
                {nodes.map((node, i) => (
                  <motion.g
                    key={node.gap.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring", bounce: 0.4 }}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(selected?.gap.id === node.gap.id ? null : node)}
                  >
                    {/* Glow */}
                    <circle cx={node.x} cy={node.y} r={node.r + 8}
                      fill={node.color} opacity={selected?.gap.id === node.gap.id ? 0.15 : 0.05} />
                    {/* Main bubble */}
                    <circle cx={node.x} cy={node.y} r={node.r}
                      fill={node.color}
                      fillOpacity={selected?.gap.id === node.gap.id ? 0.9 : 0.7}
                      stroke={node.color}
                      strokeWidth={selected?.gap.id === node.gap.id ? 2.5 : 1.5}
                      strokeOpacity="0.8"
                    />
                    {/* Score label */}
                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize="11" fontWeight="bold" fill="white" opacity="0.9">
                      {(node.gap.relevanceScore ?? 5) * 10}
                    </text>
                    {/* Title below (truncated) */}
                    {node.r >= 28 && (
                      <text x={node.x} y={node.y + node.r + 13} textAnchor="middle"
                        fontSize="9" fill="rgb(var(--muted))" opacity="0.8"
                        style={{ pointerEvents: "none" }}>
                        {node.gap.title.slice(0, 32)}{node.gap.title.length > 32 ? "…" : ""}
                      </text>
                    )}
                  </motion.g>
                ))}
              </svg>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                className="w-80 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-y-auto flex flex-col flex-shrink-0"
              >
                <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">Gap Detail</span>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Category badge */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                    style={{ borderColor: selected.color + "40", color: selected.color, background: selected.color + "15" }}>
                    {CATEGORY_LABELS[selected.gap.category] ?? selected.gap.category}
                  </span>

                  <h3 className="text-sm font-bold text-[rgb(var(--fg))] leading-snug">{selected.gap.title}</h3>

                  {/* Score bars */}
                  <div className="space-y-2">
                    {[
                      { label: "Relevance", value: (selected.gap.relevanceScore ?? 5) * 10 },
                      { label: "Confidence", value: selected.gap.confidence ?? 70 },
                      { label: "Novelty", value: selected.gap.novelty ?? 70 },
                      { label: "Feasibility", value: selected.gap.feasibility ?? 70 },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-xs text-[rgb(var(--muted))] w-20 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: selected.color }} />
                        </div>
                        <span className="text-xs font-mono text-[rgb(var(--muted))] w-8 text-right">{value}%</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">{selected.gap.description}</p>

                  {selected.gap.whatsMissing && (
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">What&apos;s missing</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{selected.gap.whatsMissing}</p>
                    </div>
                  )}

                  {selected.gap.suggestedDirection && (
                    <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                      <p className="text-xs font-semibold text-violet-400 mb-1">Suggested direction</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{selected.gap.suggestedDirection}</p>
                    </div>
                  )}

                  {selected.gap.citations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] mb-2">{selected.gap.citations.length} supporting papers</p>
                      <div className="space-y-1.5">
                        {selected.gap.citations.slice(0, 4).map((c, i) => (
                          <a key={i} href={c.url} target="_blank" rel="noreferrer"
                            className="flex items-start gap-2 p-2 rounded-lg border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                            <span className="text-xs font-bold text-[rgb(var(--muted))] flex-shrink-0">{i + 1}</span>
                            <p className="text-xs text-[rgb(var(--fg))] line-clamp-2 group-hover:text-violet-300 transition-colors flex-1">{c.title}</p>
                            <ExternalLink size={10} className="flex-shrink-0 text-[rgb(var(--muted))] mt-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-[rgb(var(--border))] space-y-2">
                    <Link href={`/gap-ai?q=${encodeURIComponent(selected.gap.title)}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                      <Sparkles size={13} /> Deep dive in Gap AI
                    </Link>
                    <Link href="/paper-writer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] text-xs font-medium transition-colors">
                      <ArrowRight size={13} /> Write paper from this gap
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        {nodes.length > 0 && (
          <div className="px-4 py-3 border-t border-[rgb(var(--border))] flex items-center gap-4 flex-wrap bg-[rgb(var(--card))]/50">
            <span className="text-xs text-[rgb(var(--muted))]">Bubble size = importance score</span>
            <div className="flex items-center gap-3 flex-wrap">
              {categoryList.map(cat => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] }} />
                  <span className="text-xs text-[rgb(var(--muted))]">{CATEGORY_LABELS[cat] ?? cat}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-[rgb(var(--muted))] ml-auto">{nodes.length} gaps for &quot;{searched}&quot;</span>
          </div>
        )}
      </main>
    </div>
  );
}
