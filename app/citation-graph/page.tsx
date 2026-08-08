"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Search, Loader2, X, ExternalLink, ZoomIn, ZoomOut,
  Info, BookOpen, TrendingUp, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationNode {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  url: string;
  source: string;
  citationCount: number;
  isCore: boolean; // part of the gap's direct citations
}

interface CitationEdge {
  source: string;
  target: string;
  weight: number;
}

interface GraphData {
  nodes: CitationNode[];
  edges: CitationEdge[];
  gapTitle: string;
}

interface LayoutNode extends CitationNode {
  x: number;
  y: number;
  r: number;
}

function layoutGraph(nodes: CitationNode[], edges: CitationEdge[], W: number, H: number): LayoutNode[] {
  const cx = W / 2, cy = H / 2;
  const coreNodes = nodes.filter(n => n.isCore);
  const peripheral = nodes.filter(n => !n.isCore);

  // Core nodes in inner ring
  const coreRing = coreNodes.map((n, i) => {
    const angle = (i / Math.max(coreNodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const r_ring = Math.min(W, H) * 0.22;
    return {
      ...n,
      x: cx + Math.cos(angle) * r_ring,
      y: cy + Math.sin(angle) * r_ring,
      r: Math.max(16, Math.min(36, 10 + (n.citationCount ?? 0) * 0.4)),
    };
  });

  // Peripheral nodes in outer ring
  const periLayout = peripheral.map((n, i) => {
    const angle = (i / Math.max(peripheral.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const r_ring = Math.min(W, H) * 0.42;
    return {
      ...n,
      x: cx + Math.cos(angle) * r_ring,
      y: cy + Math.sin(angle) * r_ring,
      r: Math.max(10, Math.min(24, 8 + (n.citationCount ?? 0) * 0.3)),
    };
  });

  return [...coreLayout(coreNodes, cx, cy, W, H), ...periLayout];
}

function coreLayout(nodes: CitationNode[], cx: number, cy: number, W: number, H: number): LayoutNode[] {
  return nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const r_ring = Math.min(W, H) * 0.22;
    return {
      ...n,
      x: cx + Math.cos(angle) * r_ring,
      y: cy + Math.sin(angle) * r_ring,
      r: Math.max(16, Math.min(36, 10 + (n.citationCount ?? 0) * 0.4)),
    };
  });
}

export default function CitationGraphPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [selected, setSelected] = useState<LayoutNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const W = 900, H = 580;

  const buildGraph = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    setGraphData(null);
    try {
      const res = await fetch("/api/citation-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to build graph");
      setGraphData(data);
      setLayoutNodes(layoutGraph(data.nodes, data.edges, W, H));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const getEdgesForNode = (id: string) =>
    graphData?.edges.filter(e => e.source === id || e.target === id) ?? [];

  const isHighlighted = (nodeId: string) => {
    if (!selected) return false;
    if (nodeId === selected.id) return true;
    return getEdgesForNode(selected.id).some(e => e.source === nodeId || e.target === nodeId);
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 md:px-8 py-4 border-b border-[rgb(var(--border))] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-violet-400" />
            <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Citation Graph</h1>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buildGraph(query)}
              placeholder="Enter topic to map its citation network..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={() => buildGraph(query)}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
            {loading ? "Mapping..." : "Map"}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><ZoomIn size={15} /></button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><ZoomOut size={15} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* SVG Graph */}
          <div className="flex-1 relative overflow-hidden bg-[rgb(var(--bg))]">
            {!graphData && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-500/30 flex items-center justify-center">
                  <Network size={32} className="text-violet-400/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Map how papers connect and where the trail goes cold</p>
                  <p className="text-xs text-[rgb(var(--muted))] max-w-sm">Nodes = papers. Size = citation count. Purple = core gap papers. Lines = citation relationships. Isolated clusters = research blind spots.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {["mRNA cancer vaccines", "long COVID mechanisms", "quantum error correction", "PFAS health effects"].map(s => (
                    <button key={s} onClick={() => { setQuery(s); buildGraph(s); }}
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
                  <div className="w-20 h-20 rounded-full border border-violet-500/20 animate-ping absolute inset-0" />
                  <div className="w-20 h-20 rounded-full border border-violet-500/30 flex items-center justify-center">
                    <Network size={24} className="text-violet-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-sm text-violet-400">Building citation network...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {graphData && layoutNodes.length > 0 && (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full cursor-default"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}
                onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
              >
                {/* Edges */}
                {graphData.edges.map((edge, i) => {
                  const s = layoutNodes.find(n => n.id === edge.source);
                  const t = layoutNodes.find(n => n.id === edge.target);
                  if (!s || !t) return null;
                  const highlighted = selected && (isHighlighted(s.id) && isHighlighted(t.id));
                  return (
                    <line key={i}
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={highlighted ? "#7c3aed" : "rgb(var(--border))"}
                      strokeWidth={highlighted ? 1.5 : 0.8}
                      opacity={selected ? (highlighted ? 0.8 : 0.1) : 0.3}
                      strokeDasharray={edge.weight < 2 ? "3 4" : "none"}
                    />
                  );
                })}

                {/* Nodes */}
                {layoutNodes.map((node, i) => {
                  const hi = isHighlighted(node.id);
                  const dimmed = selected && !hi;
                  return (
                    <motion.g key={node.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: dimmed ? 0.25 : 1 }}
                      transition={{ delay: i * 0.03, type: "spring", bounce: 0.3 }}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(selected?.id === node.id ? null : node)}
                    >
                      {/* Glow for core nodes */}
                      {node.isCore && (
                        <circle cx={node.x} cy={node.y} r={node.r + 6}
                          fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.25" />
                      )}
                      <circle cx={node.x} cy={node.y} r={node.r}
                        fill={node.isCore ? "#7c3aed" : "#1e1e46"}
                        stroke={selected?.id === node.id ? "#a78bfa" : node.isCore ? "#9f60f5" : "rgb(var(--border))"}
                        strokeWidth={selected?.id === node.id ? 2.5 : 1.5}
                        fillOpacity={node.isCore ? 0.85 : 0.6}
                      />
                      <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize={node.r >= 22 ? "10" : "8"} fill="white" opacity="0.9" fontWeight="600">
                        {node.year ?? "?"}
                      </text>
                    </motion.g>
                  );
                })}

                {/* Gap label */}
                <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fill="rgba(167,139,250,0.5)" fontStyle="italic">
                  {graphData.gapTitle.slice(0, 40)}{graphData.gapTitle.length > 40 ? "…" : ""}
                </text>
              </svg>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                className="w-72 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-y-auto flex flex-col flex-shrink-0"
              >
                <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest">Paper</span>
                  <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-[rgb(var(--bg))] text-[rgb(var(--muted))] transition-colors"><X size={14} /></button>
                </div>
                <div className="p-4 space-y-3">
                  {selected.isCore && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                      <Circle size={8} fill="currentColor" /> Core gap paper
                    </span>
                  )}
                  <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{selected.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {selected.authors.slice(0, 3).join(", ")}{selected.authors.length > 3 ? " et al." : ""}
                    {selected.year && ` · ${selected.year}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
                    <span className="flex items-center gap-1"><TrendingUp size={11} /> {selected.citationCount ?? 0} citations</span>
                    <span className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">{selected.source}</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[rgb(var(--muted))] mb-2">Connected papers ({getEdgesForNode(selected.id).length})</p>
                    {getEdgesForNode(selected.id).slice(0, 5).map((edge, i) => {
                      const connId = edge.source === selected.id ? edge.target : edge.source;
                      const conn = layoutNodes.find(n => n.id === connId);
                      if (!conn) return null;
                      return (
                        <div key={i} className="text-xs text-[rgb(var(--muted))] py-1 border-b border-[rgb(var(--border))]/50 last:border-0 line-clamp-1">
                          {conn.title}
                        </div>
                      );
                    })}
                  </div>
                  {selected.url && (
                    <a href={selected.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <ExternalLink size={11} /> Open paper
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        {graphData && (
          <div className="px-4 py-2.5 border-t border-[rgb(var(--border))] flex items-center gap-4 text-xs text-[rgb(var(--muted))] flex-wrap bg-[rgb(var(--card))]/50">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-violet-500" /><span>Core gap papers</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[rgb(var(--border))]" /><span>Related papers</span></div>
            <span>Node size = citation count</span>
            <span>Dashed lines = weak connections</span>
            <span className="ml-auto">{graphData.nodes.length} papers · {graphData.edges.length} connections</span>
          </div>
        )}
      </main>
    </div>
  );
}
