"use client";

import { useState, useCallback } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Search, Loader2, ZoomIn, ZoomOut, X,
  ExternalLink, TrendingUp, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LitNode {
  id: string;
  title: string;
  authors: string[];
  year: number;
  url: string;
  citations: number;
  cluster: string; // thematic cluster name
  clusterColor: string;
  x: number;
  y: number;
  r: number;
  isGap: boolean; // is this a gap area (sparse)?
}

interface MapData {
  nodes: LitNode[];
  clusters: { name: string; color: string; count: number; gapScore: number }[];
  field: string;
  yearRange: [number, number];
  gapAreas: string[];
}

const CLUSTER_COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#7c3aed", "#c026d3",
];

export default function LiteratureMapPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [selected, setSelected] = useState<LitNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const W = 900, H = 540;

  const buildMap = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setSelected(null); setMapData(null);
    try {
      const res = await fetch("/api/literature-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setMapData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }, []);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col">
        {/* Toolbar */}
        <div className="px-4 md:px-8 py-4 border-b border-[rgb(var(--border))] flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-violet-400" />
            <h1 className="text-lg font-bold text-[rgb(var(--fg))]">Literature Map</h1>
          </div>
          <div className="relative flex-1 max-w-xl">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buildMap(query)}
              placeholder="Map the research landscape for any topic..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
          </div>
          <button onClick={() => buildMap(query)} disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium transition-colors flex-shrink-0">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Map size={14} />}
            {loading ? "Mapping..." : "Map field"}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><ZoomIn size={15} /></button>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 rounded-lg hover:bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><ZoomOut size={15} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* SVG Map */}
          <div className="flex-1 relative overflow-hidden">
            {!mapData && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <Map size={40} className="text-violet-400/40" />
                <div className="text-center">
                  <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">Visualize the research landscape of any field</p>
                  <p className="text-xs text-[rgb(var(--muted))] max-w-sm">Clusters show research themes. Sparse areas show gaps. Node size = citation count.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["machine learning in genomics", "climate adaptation", "mRNA therapeutics", "quantum computing"].map(s => (
                    <button key={s} onClick={() => { setQuery(s); buildMap(s); }}
                      className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all">{s}</button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border border-violet-500/30 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
                  <Map size={20} className="text-violet-400" />
                </div>
                <p className="text-sm text-violet-400">Building literature map...</p>
              </div>
            )}

            {error && <div className="absolute inset-0 flex items-center justify-center"><p className="text-red-400 text-sm">{error}</p></div>}

            {mapData && (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}
                onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(var(--border))" strokeWidth="0.3" opacity="0.4" />
                  </pattern>
                </defs>
                <rect width={W} height={H} fill="url(#grid)" />

                {/* Year axis */}
                {mapData.yearRange && [mapData.yearRange[0], Math.round((mapData.yearRange[0] + mapData.yearRange[1]) / 2), mapData.yearRange[1]].map((yr, i) => (
                  <g key={yr}>
                    <line x1={W * (i * 0.5)} y1={0} x2={W * (i * 0.5)} y2={H} stroke="rgb(var(--border))" strokeWidth="0.5" opacity="0.3" />
                    <text x={W * (i * 0.5) + 4} y={14} fontSize="9" fill="rgb(var(--muted))" opacity="0.7">{yr}</text>
                  </g>
                ))}

                {/* Gap area indicators */}
                {mapData.nodes.filter(n => n.isGap).map(node => (
                  <circle key={`gap-${node.id}`} cx={node.x} cy={node.y} r={node.r + 15}
                    fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
                ))}

                {/* Nodes */}
                {mapData.nodes.map((node, i) => (
                  <motion.g key={node.id} initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: selected && selected.id !== node.id ? 0.4 : 1 }}
                    transition={{ delay: i * 0.02, type: "spring", bounce: 0.3 }}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(selected?.id === node.id ? null : node)}>
                    <circle cx={node.x} cy={node.y} r={node.r}
                      fill={node.clusterColor} fillOpacity={0.7}
                      stroke={selected?.id === node.id ? "white" : node.clusterColor}
                      strokeWidth={selected?.id === node.id ? 2.5 : 1} strokeOpacity={0.9} />
                    {node.r >= 16 && (
                      <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize="8" fill="white" opacity="0.9" fontWeight="600">{node.year}</text>
                    )}
                  </motion.g>
                ))}

                {/* Field label */}
                <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="rgba(139,139,179,0.5)" fontStyle="italic">
                  {mapData.field}
                </text>
              </svg>
            )}
          </div>

          {/* Side panels */}
          <div className="w-64 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex flex-col overflow-hidden flex-shrink-0">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-full">
                  <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Paper</span>
                    <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-[rgb(var(--bg))] text-[rgb(var(--muted))] transition-colors"><X size={13} /></button>
                  </div>
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {selected.isGap && (
                      <div className="px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
                        Sparse area — potential gap
                      </div>
                    )}
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.clusterColor }} />
                    <p className="text-xs font-semibold text-[rgb(var(--muted))]">{selected.cluster}</p>
                    <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{selected.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {selected.authors.slice(0, 2).join(", ")}{selected.authors.length > 2 ? " et al." : ""} · {selected.year}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted))]">
                      <TrendingUp size={11} /> {selected.citations} citations
                    </div>
                    {selected.url && (
                      <a href={selected.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                        <ExternalLink size={11} /> Open paper
                      </a>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="clusters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col h-full">
                  <div className="p-4 border-b border-[rgb(var(--border))]">
                    <span className="text-xs font-semibold text-[rgb(var(--muted))] uppercase">Clusters</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {mapData?.clusters.map(c => (
                      <div key={c.name} className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                          <p className="text-xs font-medium text-[rgb(var(--fg))] flex-1 truncate">{c.name}</p>
                          <span className="text-xs text-[rgb(var(--muted))]">{c.count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[rgb(var(--muted))]">Gap score:</span>
                          <div className="flex-1 h-1 bg-[rgb(var(--border))] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${c.gapScore}%` }} />
                          </div>
                          <span className="text-[10px] text-amber-400 font-bold">{c.gapScore}%</span>
                        </div>
                      </div>
                    ))}
                    {mapData?.gapAreas && mapData.gapAreas.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mt-3">
                        <p className="text-xs font-semibold text-amber-400 mb-2">Identified gap areas</p>
                        {mapData.gapAreas.map((g, i) => (
                          <p key={i} className="text-xs text-[rgb(var(--muted))] mb-1">{i + 1}. {g}</p>
                        ))}
                      </div>
                    )}
                    {!mapData && <p className="text-xs text-[rgb(var(--muted))] text-center py-8">Search a topic to see clusters.</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
