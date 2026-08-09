"use client";

import { useState, useCallback } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Search, Loader2, X, ExternalLink,
  BookOpen, Users, ZoomIn, ZoomOut, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkNode {
  id: string;
  name: string;
  institution: string;
  hIndex: number;
  paperCount: number;
  citationCount: number;
  x: number;
  y: number;
  r: number;
  color: string;
  type: "academic" | "industry" | "government";
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

interface GraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  centerAuthor: string;
}

const TYPE_COLORS = {
  academic: "#7c3aed",
  industry: "#2563eb",
  government: "#059669",
};

export default function ResearchNetworkPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [selected, setSelected] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const W = 900, H = 540;

  const build = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSelected(null); setGraph(null);
    try {
      const res = await fetch("/api/research-network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setGraph(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }, []);

  const isHighlighted = (nodeId: string) => {
    if (!selected) return true;
    if (nodeId === selected.id) return true;
    return graph?.edges.some(e => (e.source === selected.id && e.target === nodeId) || (e.target === selected.id && e.source === nodeId)) ?? false;
  };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 md:px-8 py-4 border-b border-[rgb(var(--border))] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-violet-400" />
            <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Research Network</h1>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && build(query)}
              placeholder="Search a researcher name or topic to map the network..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
          </div>
          <button onClick={() => build(query)} disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors flex-shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Network size={14} />}
            {loading ? "Mapping..." : "Map"}
          </button>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] transition-colors"><ZoomIn size={15} /></button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] transition-colors"><ZoomOut size={15} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* SVG */}
          <div className="flex-1 relative overflow-hidden">
            {!graph && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <Network size={40} className="text-violet-400/40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Map how researchers connect in any field</p>
                  <p className="text-xs text-[rgb(var(--muted))] max-w-sm">Node size = citation count. Purple = academia. Blue = industry. Green = government.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["CRISPR research", "deep learning", "climate modeling", "mRNA vaccines"].map(s => (
                    <button key={s} onClick={() => { setQuery(s); build(s); }}
                      className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all">{s}</button>
                  ))}
                </div>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border border-violet-500/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
                  <Network size={20} className="text-violet-400" />
                </div>
                <p className="text-sm text-violet-400">Building network...</p>
              </div>
            )}
            {error && <div className="absolute inset-0 flex items-center justify-center"><p className="text-red-400 text-sm">{error}</p></div>}

            {graph && (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}
                onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
                {/* Edges */}
                {graph.edges.map((edge, i) => {
                  const s = graph.nodes.find(n => n.id === edge.source);
                  const t = graph.nodes.find(n => n.id === edge.target);
                  if (!s || !t) return null;
                  const hi = !selected || (isHighlighted(s.id) && isHighlighted(t.id));
                  return (
                    <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke="rgb(var(--border))" strokeWidth={edge.weight >= 3 ? 1.5 : 0.8}
                      opacity={hi ? 0.4 : 0.05} />
                  );
                })}
                {/* Nodes */}
                {graph.nodes.map((node, i) => {
                  const hi = isHighlighted(node.id);
                  return (
                    <motion.g key={node.id} initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: hi ? 1 : 0.2 }}
                      transition={{ delay: i * 0.03, type: "spring", bounce: 0.3 }}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(selected?.id === node.id ? null : node)}>
                      <circle cx={node.x} cy={node.y} r={node.r + 6} fill={node.color} opacity={0.08} />
                      <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} fillOpacity={0.8}
                        stroke={selected?.id === node.id ? "white" : node.color} strokeWidth={selected?.id === node.id ? 2.5 : 1} />
                      {node.r >= 18 && (
                        <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="8" fill="white" opacity="0.9" fontWeight="600">
                          {node.name.split(" ").pop()?.slice(0, 8)}
                        </text>
                      )}
                    </motion.g>
                  );
                })}
                <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(139,139,179,0.4)" fontStyle="italic">
                  {graph.centerAuthor}
                </text>
              </svg>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ x: 280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 280, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.3 }}
                className="w-64 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex flex-col flex-shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Researcher</span>
                  <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-[rgb(var(--bg))] text-[rgb(var(--muted))] transition-colors"><X size={14} /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                    <span className="text-xs text-[rgb(var(--muted))] capitalize">{selected.type}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[rgb(var(--fg))]">{selected.name}</h3>
                  {selected.institution && <p className="text-xs text-[rgb(var(--muted))]">{selected.institution}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-[rgb(var(--bg))] text-center">
                      <p className="text-sm font-bold text-violet-400">{selected.hIndex}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">h-index</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[rgb(var(--bg))] text-center">
                      <p className="text-sm font-bold text-teal-400">{selected.paperCount}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">Papers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                    <TrendingUp size={11} /> {selected.citationCount.toLocaleString()} citations
                  </div>
                  <div>
                    <p className="text-xs text-[rgb(var(--muted))] mb-1.5">Connections</p>
                    <p className="text-sm text-[rgb(var(--fg))]">
                      {graph?.edges.filter(e => e.source === selected.id || e.target === selected.id).length ?? 0} collaborators
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend */}
        {graph && (
          <div className="px-4 py-2 border-t border-[rgb(var(--border))] flex items-center gap-4 text-xs text-[rgb(var(--muted))] flex-wrap bg-[rgb(var(--card))]/50">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="capitalize">{type}</span>
              </div>
            ))}
            <span>Node size = citation count</span>
            <span className="ml-auto">{graph.nodes.length} researchers mapped</span>
          </div>
        )}
      </main>
    </div>
  );
}
