"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, Share2, ExternalLink, AlertCircle, Link2,
  Users, Database, ArrowRightLeft, Beaker,
  FileText, Sparkles, Download, ChevronDown,
  X, Loader, Copy, Check, Globe, Layers, MessageSquare, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";
import { exportCitations, type CitationFormat } from "@/lib/citations/export";

const CATEGORY_CONFIG: Record<GapCategory, { label: string; color: string; icon: React.ElementType }> = {
  contradiction: { label: "Contradiction", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: AlertCircle },
  "missing-mechanistic-link": { label: "Missing Link", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Link2 },
  "unexplored-method-transfer": { label: "Method Transfer", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: ArrowRightLeft },
  "population-blind-spot": { label: "Population Gap", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: Users },
  "untouched-dataset-opportunity": { label: "Dataset Opportunity", color: "text-green-400 bg-green-400/10 border-green-400/20", icon: Database },
  "translational-bottleneck": { label: "Translational Gap", color: "text-orange-400 bg-orange-400/10 border-orange-400/20", icon: Beaker },
};

const CITATION_FORMATS: { value: CitationFormat; label: string }[] = [
  { value: "apa", label: "APA 7th" },
  { value: "mla", label: "MLA 9th" },
  { value: "chicago", label: "Chicago" },
  { value: "harvard", label: "Harvard" },
  { value: "bibtex", label: "BibTeX" },
  { value: "ris", label: "RIS" },
];

const AUDIENCES = [
  { value: "general", label: "General public" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "policymaker", label: "Policymaker" },
  { value: "journalist", label: "Journalist" },
];

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 8 ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
    score >= 6 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
    "bg-[rgb(var(--border))] text-[rgb(var(--muted))] border-[rgb(var(--border))]";
  return (
    <div className={cn("w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm tabular-nums", color)}>
      {score * 10}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const barColor = value >= 80 ? "bg-teal-500" : value >= 60 ? "bg-violet-500" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[rgb(var(--muted))] w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-[rgb(var(--muted))] w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

interface GapCardProps {
  gap: DetectedGap;
  index?: number;
  onSave?: (gap: DetectedGap) => void;
  onShare?: (gap: DetectedGap) => void;
  saved?: boolean;
  savedId?: string;
}

function CopyToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] flex items-center gap-2">
          <Check size={14} className="text-green-400" /> Link copied
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GapCard({ gap, index, onSave, onShare, saved = false, savedId }: GapCardProps) {
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null);
  const [showCiteMenu, setShowCiteMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [proposal, setProposal] = useState<string | null>(null);
  const [simplified, setSimplified] = useState<string | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [loadingSimplify, setLoadingSimplify] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState("general");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tracked, setTracked] = useState(false);

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) setShowShareMenu(false);
    };
    if (showShareMenu) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showShareMenu]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const config = CATEGORY_CONFIG[gap.category];
  const Icon = config.icon;

  const generateProposal = async () => {
    setLoadingProposal(true); setProposal(null);
    try {
      const res = await fetch("/api/gap-ai/propose", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap }) });
      const data = await res.json();
      if (data.proposal) setProposal(data.proposal);
    } catch { /* non-critical */ } finally { setLoadingProposal(false); }
  };

  const generateSimplified = async (audience: string) => {
    setLoadingSimplify(true); setSimplified(null);
    try {
      const res = await fetch("/api/gap-ai/simplify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap, audience }) });
      const data = await res.json();
      if (data.simplified) setSimplified(data.simplified);
    } catch { /* non-critical */ } finally { setLoadingSimplify(false); }
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || loadingChat) return;
    const newMessages = [...chatMessages, { role: "user" as const, content: msg }];
    setChatMessages(newMessages); setChatInput(""); setLoadingChat(true);
    try {
      const res = await fetch("/api/gap-ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, gap, history: chatMessages }) });
      const data = await res.json();
      if (data.reply) setChatMessages([...newMessages, { role: "assistant" as const, content: data.reply }]);
    } catch { /* non-critical */ } finally { setLoadingChat(false); }
  };

  const copyLink = () => {
    const url = savedId ? `${window.location.origin}/gap/${savedId}` : window.location.href;
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true); setShowShareMenu(false);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyText = () => {
    navigator.clipboard.writeText(`Research gap: ${gap.title}\n\n${gap.description}\n\nFound via GapForge`).catch(() => {});
    setShowShareMenu(false);
  };

  const copyProposal = () => {
    if (proposal) { navigator.clipboard.writeText(proposal); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card hover:border-violet-500/30 transition-colors duration-200">
      <CopyToast visible={linkCopied} />
      <div className="p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
            {index !== undefined && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[rgb(var(--border))] text-xs font-bold text-[rgb(var(--muted))] flex-shrink-0">#{index}</span>
            )}
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.color)}>
              <Icon size={11} />{config.label}
            </span>
            {gap.citations.length > 0 && (
              <span className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-full px-2 py-0.5">{gap.citations.length} source{gap.citations.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onSave && (
              <button onClick={() => onSave(gap)} className={cn("p-1.5 rounded-lg transition-colors", saved ? "text-violet-400" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]")} aria-label={saved ? "Saved" : "Save gap"}>
                <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
              </button>
            )}
            <div className="relative" ref={shareMenuRef}>
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors" aria-label="Share">
                <Share2 size={15} />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1 z-30 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl shadow-xl overflow-hidden min-w-36">
                    <button onClick={copyLink} className="w-full text-left px-3 py-2.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors flex items-center gap-2"><Globe size={12} /> Copy link</button>
                    <button onClick={copyText} className="w-full text-left px-3 py-2.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors flex items-center gap-2"><Copy size={12} /> Copy text</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ScoreCircle score={gap.relevanceScore} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-[rgb(var(--fg))] leading-snug">{gap.title}</h3>

        <div className="space-y-2 py-1">
          <MetricBar label="Confidence" value={gap.confidence ?? 70} />
          <MetricBar label="Novelty" value={gap.novelty ?? 70} />
          <MetricBar label="Feasibility" value={gap.feasibility ?? 70} />
        </div>

        {gap.whatsMissing && <div><p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-amber-400">▲</span> WHAT&apos;S MISSING</p><p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whatsMissing}</p></div>}
        {gap.whyItMatters && <div><p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-teal-400">↗</span> WHY IT MATTERS</p><p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whyItMatters}</p></div>}
        {gap.whyUnresolved && <div><p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><span className="text-red-400">?</span> WHY IT&apos;S UNRESOLVED</p><p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{gap.whyUnresolved}</p></div>}
        {gap.suggestedDirection && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1.5">SUGGESTED DIRECTION</p>
            <p className="text-sm text-violet-300 font-semibold leading-relaxed">{gap.suggestedDirection}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[rgb(var(--border))]">
          <button onClick={() => { setShowProposal(true); if (!proposal) generateProposal(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-colors">
            <FileText size={12} /> Draft proposal
          </button>
          <button onClick={() => { setShowSimplify(true); if (!simplified) generateSimplified(selectedAudience); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-colors">
            <Sparkles size={12} /> Simplify
          </button>
          <button onClick={() => setShowChat(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
            <MessageSquare size={12} /> Ask AI
          </button>
          <button
            onClick={() => { if (tracked) return; fetch("/api/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: gap.title, description: gap.description, status: "investigating" }) }).then(() => setTracked(true)).catch(() => {}); }}
            disabled={tracked}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              tracked ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 opacity-70 cursor-default" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20")}>
            <Layers size={12} /> {tracked ? "Tracked" : "Track"}
          </button>
          {gap.citations.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowCiteMenu(!showCiteMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors">
                <Download size={12} /> Cite <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showCiteMenu && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 top-full mt-1 z-20 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl shadow-xl overflow-hidden min-w-32">
                    {CITATION_FORMATS.map(fmt => (
                      <button key={fmt.value} onClick={() => { exportCitations(gap.citations, fmt.value, gap.title); setShowCiteMenu(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors">
                        {fmt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Citations */}
        {gap.citations.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider">SUPPORTING LITERATURE</p>
              <div className="flex-1 h-px bg-[rgb(var(--border))]" />
              <span className="text-xs text-[rgb(var(--muted))]">{gap.citations.length} source{gap.citations.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {gap.citations.map((cite, i) => (
                <a key={cite.paperId} href={cite.url} target="_blank" rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredPaper(cite.paperId)} onMouseLeave={() => setHoveredPaper(null)}
                  className="group flex items-start gap-3 p-3 rounded-lg border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[rgb(var(--border))] text-xs font-bold text-[rgb(var(--muted))] flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded">{cite.source}</span>
                    <p className="text-xs font-semibold text-[rgb(var(--fg))] leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors mt-0.5">{cite.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{cite.authors.slice(0, 2).join(", ")}{cite.authors.length > 2 ? " et al." : ""}{cite.year ? ` · ${cite.year}` : ""}</p>
                  </div>
                  <ExternalLink size={13} className={cn("flex-shrink-0 mt-0.5 transition-opacity", hoveredPaper === cite.paperId ? "opacity-100 text-violet-400" : "opacity-0")} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proposal Modal */}
      <AnimatePresence>
        {showProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowProposal(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><FileText size={16} className="text-violet-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Research Proposal Draft</h2></div>
                <div className="flex items-center gap-2">
                  {proposal && <button onClick={copyProposal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">{copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}</button>}
                  <button onClick={() => setShowProposal(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingProposal ? <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-violet-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Drafting proposal...</p></div>
                  : proposal ? <pre className="whitespace-pre-wrap text-sm text-[rgb(var(--fg))] font-sans leading-relaxed">{proposal}</pre>
                  : <div className="text-center py-12 text-[rgb(var(--muted))] text-sm">Failed to generate. <button onClick={generateProposal} className="text-violet-400 underline">Try again</button></div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simplify Modal */}
      <AnimatePresence>
        {showSimplify && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSimplify(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-teal-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Simplified Explanation</h2></div>
                <button onClick={() => setShowSimplify(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
              </div>
              <div className="px-6 py-3 border-b border-[rgb(var(--border))] flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[rgb(var(--muted))]">Explain for:</span>
                {AUDIENCES.map(a => (
                  <button key={a.value} onClick={() => { setSelectedAudience(a.value); generateSimplified(a.value); }}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all", selectedAudience === a.value ? "bg-teal-500/20 text-teal-400 border-teal-500/30" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-teal-500/30")}>
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingSimplify ? <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-teal-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Simplifying...</p></div>
                  : simplified ? <p className="text-sm text-[rgb(var(--fg))] leading-relaxed whitespace-pre-line">{simplified}</p>
                  : <div className="text-center py-12 text-[rgb(var(--muted))] text-sm">Failed. <button onClick={() => generateSimplified(selectedAudience)} className="text-teal-400 underline">Try again</button></div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-2xl h-[75vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><MessageSquare size={16} className="text-blue-400" /><div><h2 className="font-semibold text-[rgb(var(--fg))]">Ask AI about this gap</h2><p className="text-xs text-[rgb(var(--muted))]">{gap.title.slice(0, 60)}{gap.title.length > 60 ? "..." : ""}</p></div></div>
                <button onClick={() => setShowChat(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-[rgb(var(--muted))] mb-4">Ask anything about this research gap</p>
                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                      {["What methods could address this?", "Who funds research in this area?", "What datasets are available?"].map(q => (
                        <button key={q} onClick={() => { setChatInput(q); }}
                          className="text-xs text-left text-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 hover:border-blue-500/40 hover:text-[rgb(var(--fg))] transition-colors">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] rounded-bl-sm")}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                      {[0,1,2].map(i => <motion.div key={i} className="w-2 h-2 rounded-full bg-[rgb(var(--muted))]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="px-6 py-4 border-t border-[rgb(var(--border))]">
                <div className="flex gap-2">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    placeholder="Ask about methods, funding, collaborators..."
                    className="input flex-1 text-sm" aria-label="Chat input" />
                  <button onClick={sendChat} disabled={!chatInput.trim() || loadingChat}
                    className="btn-primary flex items-center gap-1.5 px-4 disabled:opacity-50">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
