"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Map, Loader2, Zap, ArrowRight, Search,
  BookOpen, TrendingUp, Star,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NicheNode {
  id: string;
  name: string;
  papers: number;
  gaps: number;
  hot: boolean;
  x: number;
  y: number;
  r: number;
  color: string;
  related: string[];
}

const NICHES: NicheNode[] = [
  { id: "ai-health", name: "AI in Healthcare", papers: 48200, gaps: 312, hot: true, x: 420, y: 180, r: 52, color: "#7c3aed", related: ["genomics", "drug-discovery", "mental-health"] },
  { id: "genomics", name: "Genomics & CRISPR", papers: 62100, gaps: 198, hot: false, x: 580, y: 120, r: 44, color: "#2563eb", related: ["ai-health", "drug-discovery"] },
  { id: "drug-discovery", name: "Drug Discovery", papers: 71400, gaps: 445, hot: true, x: 680, y: 260, r: 58, color: "#059669", related: ["genomics", "ai-health", "microbiome"] },
  { id: "mental-health", name: "Mental Health AI", papers: 18900, gaps: 267, hot: true, x: 250, y: 280, r: 40, color: "#d97706", related: ["ai-health", "microbiome", "neuroscience"] },
  { id: "microbiome", name: "Gut Microbiome", papers: 29300, gaps: 189, hot: false, x: 460, y: 340, r: 38, color: "#dc2626", related: ["mental-health", "drug-discovery", "climate"] },
  { id: "climate", name: "Climate Adaptation", papers: 41200, gaps: 521, hot: true, x: 180, y: 160, r: 45, color: "#0891b2", related: ["microbiome", "food-systems"] },
  { id: "food-systems", name: "Food Systems", papers: 22600, gaps: 178, hot: false, x: 120, y: 320, r: 34, color: "#7c3aed", related: ["climate", "microbiome"] },
  { id: "neuroscience", name: "Neuroscience", papers: 88100, gaps: 634, hot: false, x: 350, y: 420, r: 62, color: "#c026d3", related: ["mental-health", "ai-health"] },
  { id: "quantum", name: "Quantum Computing", papers: 15200, gaps: 89, hot: true, x: 700, y: 380, r: 30, color: "#0891b2", related: ["drug-discovery"] },
  { id: "longevity", name: "Longevity Research", papers: 12800, gaps: 156, hot: true, x: 560, y: 430, r: 33, color: "#dc2626", related: ["genomics", "microbiome"] },
];

export default function NicheMapPage() {
  const [selected, setSelected] = useState<NicheNode | null>(null);
  const [filter, setFilter] = useState<"all" | "hot" | "gaps">("all");
  const W = 840, H = 520;

  const filtered = filter === "hot" ? NICHES.filter(n => n.hot) :
    filter === "gaps" ? [...NICHES].sort((a, b) => b.gaps - a.gaps).slice(0, 7) : NICHES;

  const isHighlighted = (node: NicheNode) => {
    if (!selected) return true;
    if (node.id === selected.id) return true;
    return selected.related.includes(node.id) || node.related.includes(selected.id);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-8 py-4 border-b border-[rgb(var(--border))] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-violet-400" />
            <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Research Niche Map</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Interactive</span>
          </div>
          <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-1">
            {(["all", "hot", "gaps"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                {f === "hot" ? "🔥 Trending" : f === "gaps" ? "Most gaps" : "All niches"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* SVG Map */}
          <div className="flex-1 relative overflow-hidden bg-[rgb(var(--bg))]">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
              onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
              {/* Background grid */}
              <defs>
                <pattern id="niche-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgb(var(--border))" strokeWidth="0.3" opacity="0.3" />
                </pattern>
              </defs>
              <rect width={W} height={H} fill="url(#niche-grid)" />

              {/* Connection lines */}
              {filtered.map(node =>
                node.related.map(relId => {
                  const rel = filtered.find(n => n.id === relId);
                  if (!rel || node.id > relId) return null;
                  const hi = !selected || (isHighlighted(node) && isHighlighted(rel));
                  return (
                    <line key={`${node.id}-${relId}`}
                      x1={node.x} y1={node.y} x2={rel.x} y2={rel.y}
                      stroke="rgb(var(--border))" strokeWidth="1.5"
                      opacity={hi ? 0.4 : 0.05} strokeDasharray="4 6" />
                  );
                })
              )}

              {/* Nodes */}
              {filtered.map((node, i) => {
                const hi = isHighlighted(node);
                return (
                  <motion.g key={node.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: hi ? 1 : 0.2 }}
                    transition={{ delay: i * 0.06, type: "spring", bounce: 0.3 }}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(selected?.id === node.id ? null : node)}>
                    {/* Glow */}
                    {node.hot && (
                      <circle cx={node.x} cy={node.y} r={node.r + 8} fill={node.color} opacity={0.1} />
                    )}
                    <circle cx={node.x} cy={node.y} r={node.r}
                      fill={node.color} fillOpacity={selected?.id === node.id ? 0.95 : 0.75}
                      stroke={selected?.id === node.id ? "white" : node.color}
                      strokeWidth={selected?.id === node.id ? 2.5 : 1} />
                    {/* Name */}
                    <text x={node.x} y={node.r >= 40 ? node.y - 4 : node.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={node.r >= 40 ? "9" : "8"} fill="white" opacity="0.95" fontWeight="600"
                      style={{ pointerEvents: "none" }}>
                      {node.name.split(" ").slice(0, 2).join(" ")}
                    </text>
                    {node.r >= 40 && (
                      <text x={node.x} y={node.y + 10} textAnchor="middle"
                        fontSize="8" fill="white" opacity="0.7" style={{ pointerEvents: "none" }}>
                        {node.gaps} gaps
                      </text>
                    )}
                    {/* Hot indicator */}
                    {node.hot && (
                      <text x={node.x + node.r - 6} y={node.y - node.r + 6}
                        fontSize="10" style={{ pointerEvents: "none" }}>🔥</text>
                    )}
                  </motion.g>
                );
              })}
            </svg>
          </div>

          {/* Detail panel */}
          {selected && (
            <motion.div initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }} transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
              className="w-72 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex flex-col overflow-y-auto flex-shrink-0">
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: selected.color + "20" }}>
                    <div className="w-4 h-4 rounded-full" style={{ background: selected.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[rgb(var(--fg))]">{selected.name}</h3>
                    {selected.hot && <span className="text-xs text-amber-400">🔥 Trending field</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[rgb(var(--bg))] text-center">
                    <p className="text-lg font-black" style={{ color: selected.color }}>{selected.gaps}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">open gaps</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[rgb(var(--bg))] text-center">
                    <p className="text-lg font-black text-[rgb(var(--fg))]">{(selected.papers / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-[rgb(var(--muted))]">papers</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[rgb(var(--muted))] mb-2">Connected to</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.related.map(relId => {
                      const rel = NICHES.find(n => n.id === relId);
                      if (!rel) return null;
                      return (
                        <button key={relId} onClick={() => setSelected(rel)}
                          className="text-xs px-2 py-0.5 rounded-full border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                          {rel.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[rgb(var(--border))] space-y-2">
                  <Link href={`/gap-ai?q=${encodeURIComponent(selected.name)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                    <Zap size={12} /> Find gaps in {selected.name.split(" ")[0]}
                  </Link>
                  <Link href={`/research-ideas?interests=${encodeURIComponent(selected.name)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] text-xs font-medium transition-colors">
                    <Star size={12} /> Generate research ideas
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom legend */}
        <div className="px-4 py-2.5 border-t border-[rgb(var(--border))] flex items-center gap-4 text-xs text-[rgb(var(--muted))] flex-wrap bg-[rgb(var(--card))]/50">
          <span>Circle size = research volume</span>
          <span>Lines = related fields</span>
          <span>🔥 = trending this month</span>
          <span className="ml-auto">Click any circle to explore · Click empty area to reset</span>
        </div>
      </main>
    </div>
  );
}
