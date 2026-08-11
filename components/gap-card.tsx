"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, Share2, ExternalLink, AlertCircle, Link2,
  Users, Database, ArrowRightLeft, Beaker,
  FileText, Sparkles, Download, ChevronDown,
  X, Loader, Copy, Check, Globe, Layers, MessageSquare, Send,
  FlaskConical, ShieldCheck, ScrollText, Clock,
  FileOutput, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DetectedGap, GapCategory } from "@/lib/gapAI/detectGaps";
import { exportCitations, type CitationFormat } from "@/lib/citations/export";
import { exportToObsidian } from "@/lib/citations/obsidian-export";
import { MarkdownContent } from "@/components/markdown-content";
import { useToast } from "@/components/toast";
import { exportToPdf } from "@/lib/export/pdf";

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

export function GapCard({ gap, index, onSave, onShare, saved = false, savedId }: GapCardProps) {
  const { toast } = useToast();
  const [hoveredPaper, setHoveredPaper] = useState<string | null>(null);
  const [showCiteMenu, setShowCiteMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFunding, setShowFunding] = useState(false);
  const [funding, setFunding] = useState<{ funder: string; program: string; amount: string; deadline: string; url: string; fit: string; notes: string }[] | null>(null);
  const [loadingFunding, setLoadingFunding] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHypotheses, setShowHypotheses] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [showGrant, setShowGrant] = useState(false);
  const [grantFormat, setGrantFormat] = useState("general");
  const [grant, setGrant] = useState<string | null>(null);
  const [loadingGrant, setLoadingGrant] = useState(false);
  const [showWhyNow, setShowWhyNow] = useState(false);
  const [whyNow, setWhyNow] = useState<{ whyNowScore: number; whyNowLabel: string; reasons: string[]; risks: string } | null>(null);
  const [loadingWhyNow, setLoadingWhyNow] = useState(false);
  const [hypotheses, setHypotheses] = useState<Record<string, unknown>[] | null>(null);
  const [loadingHypotheses, setLoadingHypotheses] = useState(false);
  const [validation, setValidation] = useState<{ assessment: Record<string, unknown> | null; recentPapers: { title: string; year: number | null; url: string }[] } | null>(null);
  const [loadingValidate, setLoadingValidate] = useState(false);

  const generateHypotheses = async () => {
    setLoadingHypotheses(true);
    try {
      const res = await fetch("/api/gap-ai/hypotheses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap }) });
      const data = await res.json();
      setHypotheses(data.hypotheses ?? []);
    } catch { /* non-critical */ } finally { setLoadingHypotheses(false); }
  };

  const runValidation = async () => {
    setLoadingValidate(true);
    try {
      const res = await fetch("/api/gap-ai/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap }) });
      const data = await res.json();
      setValidation(data);
    } catch { /* non-critical */ } finally { setLoadingValidate(false); }
  };

  const generateGrant = async (fmt: string) => {
    setLoadingGrant(true); setGrant(null);
    try {
      const res = await fetch("/api/gap-ai/grant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap, format: fmt }) });
      const data = await res.json();
      if (data.grant) setGrant(data.grant);
    } catch { /* non-critical */ } finally { setLoadingGrant(false); }
  };

  const fetchWhyNow = async () => {
    setLoadingWhyNow(true);
    try {
      const res = await fetch("/api/gap-ai/why-now", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap }) });
      const data = await res.json();
      if (data.whyNow) setWhyNow(data.whyNow);
    } catch { /* non-critical */ } finally { setLoadingWhyNow(false); }
  };

  const fetchFunding = async () => {
    setLoadingFunding(true);
    try {
      const res = await fetch("/api/gap-ai/funding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gap }) });
      const data = await res.json();
      setFunding(data.opportunities ?? []);
    } catch { /* non-critical */ } finally { setLoadingFunding(false); }
  };

  const shareMenuRef = useRef<HTMLDivElement>(null);  const chatEndRef = useRef<HTMLDivElement>(null);

  const [proposal, setProposal] = useState<string | null>(null);
  const [simplified, setSimplified] = useState<string | null>(null);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [loadingSimplify, setLoadingSimplify] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState("general");
  const [copied, setCopied] = useState(false);
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

  const { toast: showToast } = useToast();
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
    showToast("Link copied!");
    setShowShareMenu(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(`Research gap: ${gap.title}\n\n${gap.description}\n\nFound via GapForge`).catch(() => {});
    showToast("Copied to clipboard!");
    setShowShareMenu(false);
  };

  const copyProposal = () => {
    if (proposal) { navigator.clipboard.writeText(proposal); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="card hover:border-violet-500/30 transition-colors duration-200">
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
              <button onClick={() => { onSave(gap); if (!saved) showToast("Gap saved!"); }} className={cn("p-1.5 rounded-lg transition-colors", saved ? "text-violet-400" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]")} aria-label={saved ? "Saved" : "Save gap"}>
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
                    <button onClick={() => {
                      const text = encodeURIComponent(`Research gap: ${gap.title}\n\n${gap.description.slice(0, 200)}...\n\nFound via GapForge: ${typeof window !== "undefined" ? window.location.origin : "https://gapforge.app"}/gap-ai`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                      setShowShareMenu(false);
                    }} className="w-full text-left px-3 py-2.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-green-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ScoreCircle score={gap.relevanceScore} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-[rgb(var(--fg))] leading-snug">{gap.title}</h3>

        {/* Gap age — how long this gap has been open */}
        {gap.citations.length > 0 && (() => {
          const years = gap.citations.map(c => c.year).filter((y): y is number => y !== null);
          if (years.length === 0) return null;
          const oldest = Math.min(...years);
          const newest = Math.max(...years);
          const currentYear = new Date().getFullYear();
          const ageYears = currentYear - oldest;
          const ageColor = ageYears >= 10 ? "text-red-400" : ageYears >= 5 ? "text-amber-400" : "text-teal-400";
          return (
            <p className={`text-xs font-medium ${ageColor}`}>
              Gap open ~{ageYears} year{ageYears !== 1 ? "s" : ""} (citations span {oldest}–{newest})
            </p>
          );
        })()}

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

        {/* Research Timeline */}
        {gap.citations.length > 1 && (() => {
          const years = gap.citations.map(c => c.year).filter((y): y is number => y !== null).sort((a,b) => a-b);
          if (years.length < 2) return null;
          const minYear = years[0];
          const maxYear = years[years.length - 1];
          const span = maxYear - minYear || 1;
          const currentYear = new Date().getFullYear();
          const ageYears = currentYear - minYear;
          return (
            <div>
              <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">Research Timeline</p>
              <div className="relative h-2 bg-[rgb(var(--border))] rounded-full mb-1">
                {gap.citations.filter(c => c.year).map((cite) => (
                  <div key={cite.paperId} title={`${cite.title} (${cite.year})`}
                    className="absolute w-3 h-3 rounded-full bg-violet-500 border-2 border-[rgb(var(--card))] -top-0.5 hover:scale-150 transition-transform cursor-pointer"
                    style={{ left: `${((cite.year! - minYear) / span) * 100}%`, transform: 'translateX(-50%)' }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-[rgb(var(--muted))]">
                <span>{minYear}</span>
                <span className={ageYears >= 10 ? "text-red-400" : ageYears >= 5 ? "text-amber-400" : "text-teal-400"}>
                  {ageYears} year gap
                </span>
                <span>{maxYear}</span>
              </div>
            </div>
          );
        })()}

        {/* Action buttons */}
        <div className="action-row pt-1 border-t border-[rgb(var(--border))]">          <button onClick={() => { setShowProposal(true); if (!proposal) generateProposal(); }}
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

          {/* Hypotheses */}
          <button onClick={() => setShowHypotheses(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors">
            <FlaskConical size={12} /> Hypotheses
          </button>

          {/* Validate */}
          <button onClick={() => setShowValidate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors">
            <ShieldCheck size={12} /> Validate
          </button>

          {/* Grant */}
          <button onClick={() => { setShowGrant(true); if (!grant) generateGrant(grantFormat); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors">
            <ScrollText size={12} /> Grant
          </button>

          {/* Why Now */}
          <button onClick={() => { setShowWhyNow(true); if (!whyNow) fetchWhyNow(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors">
            <Clock size={12} /> Why now?
          </button>
          <button
            onClick={() => { if (tracked) return; fetch("/api/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: gap.title, description: gap.description, status: "investigating" }) }).then(() => { setTracked(true); showToast("Added to My Issues!"); }).catch(() => {}); }}
            disabled={tracked}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              tracked ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 opacity-70 cursor-default" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20")}>
            <Layers size={12} /> {tracked ? "Tracked" : "Track"}
          </button>
          {/* Export */}
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20 transition-colors">
              <FileOutput size={12} /> Export <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 top-full mt-1 z-20 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl shadow-xl overflow-hidden min-w-36">
                  <button onClick={() => { exportToObsidian(gap, savedId, "obsidian"); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors">
                    Obsidian (.md)
                  </button>
                  <button onClick={() => { exportToObsidian(gap, savedId, "notion"); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors">
                    Notion (.md)
                  </button>
                  <button onClick={() => {
                    // Export gap citations to BibTeX and trigger download
                    if (gap.citations.length === 0) { showToast("No citations to export"); return; }
                    const items = gap.citations.map(c => ({ title: c.title, authors: c.authors, year: c.year, doi: c.doi, url: c.url }));
                    const bibtex = items.map((item, i) => {
                      const key = `ref${i+1}_${(item.authors[0] ?? "anon").split(" ").pop() ?? "anon"}_${item.year ?? "nd"}`;
                      return `@article{${key},\n  title = {${item.title}},\n  author = {${item.authors.join(" and ")}},\n  year = {${item.year ?? ""}},\n  doi = {${item.doi ?? ""}},\n  url = {${item.url}}\n}`;
                    }).join("\n\n");
                    const blob = new Blob([bibtex], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "citations.bib"; a.click();
                    URL.revokeObjectURL(url);
                    showToast("BibTeX downloaded — import into Zotero/Mendeley");
                    setShowExportMenu(false);
                  }}
                    className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors">
                    Zotero / Mendeley (.bib)
                  </button>
                  {gap.citations.length > 0 && CITATION_FORMATS.map(fmt => (
                    <button key={fmt.value} onClick={() => { exportCitations(gap.citations, fmt.value, gap.title); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] transition-colors">
                      {fmt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Funding */}
          <button onClick={() => { setShowFunding(true); if (!funding) fetchFunding(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors">
            <DollarSign size={12} /> Funding
          </button>
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
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-3xl max-h-[85vh] sm:max-h-[85vh] flex flex-col shadow-2xl modal-mobile-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><FileText size={16} className="text-violet-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Research Proposal Draft</h2></div>
                <div className="flex items-center gap-2">
                  {proposal && <button onClick={copyProposal} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">{copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}</button>}
                  <button onClick={() => {
                    if (proposal) {
                      exportToPdf({ title: `Research Proposal: ${gap.title}`, content: proposal, filename: "research-proposal" });
                    }
                  }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-400/30 text-red-400 hover:text-red-300 transition-colors">
                    <FileText size={12} /> PDF
                  </button>
                  <button onClick={() => setShowProposal(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingProposal ? <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-violet-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Drafting proposal...</p></div>
                  : proposal ? <MarkdownContent content={proposal} className="px-1" />
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
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl modal-mobile-full">
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
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-2xl h-[75vh] flex flex-col shadow-2xl modal-mobile-full">
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
                      msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-bl-sm")}>
                      {msg.role === "user" ? msg.content : <MarkdownContent content={msg.content} />}
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

      {/* Hypotheses Modal */}
      <AnimatePresence>
        {showHypotheses && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowHypotheses(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl modal-mobile-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><FlaskConical size={16} className="text-indigo-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Testable Hypotheses</h2></div>
                <div className="flex items-center gap-2">
                  {!hypotheses && <button onClick={generateHypotheses} className="btn-primary text-xs px-4 py-1.5">Generate</button>}
                  <button onClick={() => setShowHypotheses(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingHypotheses ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-indigo-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Generating hypotheses...</p></div>
                ) : !hypotheses ? (
                  <div className="text-center py-12">
                    <FlaskConical size={32} className="text-indigo-400/50 mx-auto mb-4" />
                    <p className="text-sm text-[rgb(var(--muted))] mb-4">Generate 4 testable hypotheses grounded in the supporting literature.</p>
                    <button onClick={generateHypotheses} className="btn-primary">Generate hypotheses</button>
                  </div>
                ) : hypotheses.length === 0 ? (
                  <div className="text-center py-12 text-[rgb(var(--muted))] text-sm">Could not generate hypotheses. <button onClick={generateHypotheses} className="text-indigo-400 underline">Try again</button></div>
                ) : (
                  <div className="space-y-4">
                    {hypotheses.map((h, i) => {
                      const hyp = h as { hypothesis: string; independentVariable: string; dependentVariable: string; testMethod: string; testability: string; rationale: string };
                      const testColor = hyp.testability === "Easy" ? "text-green-400" : hyp.testability === "Moderate" ? "text-amber-400" : "text-red-400";
                      return (
                        <div key={i} className="p-4 rounded-xl border border-[rgb(var(--border))] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-indigo-400">H{i+1}</span>
                            <span className={cn("text-xs font-medium", testColor)}>{hyp.testability}</span>
                          </div>
                          <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{hyp.hypothesis}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-[rgb(var(--muted))]">Independent: </span><span className="text-[rgb(var(--fg))]">{hyp.independentVariable}</span></div>
                            <div><span className="text-[rgb(var(--muted))]">Dependent: </span><span className="text-[rgb(var(--fg))]">{hyp.dependentVariable}</span></div>
                          </div>
                          <p className="text-xs text-[rgb(var(--muted))]"><span className="font-medium text-[rgb(var(--fg))]">Method: </span>{hyp.testMethod}</p>
                          <p className="text-xs text-[rgb(var(--muted))]/70 italic">{hyp.rationale}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validate Modal */}
      <AnimatePresence>
        {showValidate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowValidate(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl modal-mobile-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-rose-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Gap Validation Check</h2></div>
                <div className="flex items-center gap-2">
                  {!validation && <button onClick={runValidation} className="btn-primary text-xs px-4 py-1.5">Run check</button>}
                  <button onClick={() => setShowValidate(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingValidate ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-rose-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Scanning recent literature...</p></div>
                ) : !validation ? (
                  <div className="text-center py-12">
                    <ShieldCheck size={32} className="text-rose-400/50 mx-auto mb-4" />
                    <p className="text-sm text-[rgb(var(--muted))] mb-4">Check if this gap has been filled by papers published in the last 1-2 years.</p>
                    <button onClick={runValidation} className="btn-primary">Run validation check</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {validation.assessment && (() => {
                      const a = validation.assessment as { status: string; confidence: string; explanation: string; recommendation: string; recentPapersRelevant: number };
                      const statusColor = a.status === "still_open" ? "text-green-400 bg-green-400/10 border-green-400/20" : a.status === "partially_addressed" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" : "text-red-400 bg-red-400/10 border-red-400/20";
                      const statusLabel = a.status === "still_open" ? "Gap still open" : a.status === "partially_addressed" ? "Partially addressed" : "Likely filled";
                      return (
                        <div className="space-y-3">
                          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold", statusColor)}><ShieldCheck size={14} />{statusLabel} — {a.confidence} confidence</div>
                          <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{a.explanation}</p>
                          <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                            <p className="text-xs font-semibold text-violet-400 mb-1">Recommendation</p>
                            <p className="text-sm text-[rgb(var(--fg))]">{a.recommendation}</p>
                          </div>
                        </div>
                      );
                    })()}
                    {validation.recentPapers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-2">Recent papers scanned</p>
                        <div className="space-y-1.5">
                          {validation.recentPapers.slice(0, 5).map((p, i) => (
                            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-xs group">
                              <span className="text-[rgb(var(--muted))] flex-shrink-0">{i+1}.</span>
                              <span className="text-[rgb(var(--fg))] line-clamp-1 flex-1 group-hover:text-violet-300 transition-colors">{p.title}</span>
                              <span className="text-[rgb(var(--muted))]/60 flex-shrink-0">{p.year}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grant Modal */}
      <AnimatePresence>
        {showGrant && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowGrant(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-3xl max-h-[85vh] sm:max-h-[85vh] flex flex-col shadow-2xl modal-mobile-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><ScrollText size={16} className="text-yellow-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Grant Proposal</h2></div>
                <div className="flex items-center gap-2">
                  <select value={grantFormat} onChange={e => { setGrantFormat(e.target.value); generateGrant(e.target.value); }}
                    className="input text-xs py-1 pr-6" aria-label="Grant format">
                    <option value="general">General</option>
                    <option value="nih">NIH R01</option>
                    <option value="nsf">NSF</option>
                    <option value="eu">EU Horizon</option>
                  </select>
                  {grant && <button onClick={() => { if (grant) navigator.clipboard.writeText(grant); }} className="flex items-center gap-1 text-xs border border-[rgb(var(--border))] rounded-lg px-3 py-1.5 text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><Copy size={12} /> Copy</button>}
                  <button onClick={() => setShowGrant(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingGrant ? <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-yellow-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Writing grant proposal...</p></div>
                  : grant ? <MarkdownContent content={grant} className="px-1" />
                  : <div className="text-center py-12"><ScrollText size={32} className="text-yellow-400/50 mx-auto mb-4" /><p className="text-sm text-[rgb(var(--muted))] mb-4">Generate a grant proposal for this research gap.</p><button onClick={() => generateGrant(grantFormat)} className="btn-primary">Generate grant</button></div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Why Now Modal */}
      <AnimatePresence>
        {showWhyNow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowWhyNow(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl modal-mobile-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border))]">
                <div className="flex items-center gap-2"><Clock size={16} className="text-cyan-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Why Now?</h2></div>
                <div className="flex items-center gap-2">
                  {!whyNow && <button onClick={fetchWhyNow} className="btn-primary text-xs px-4 py-1.5">Analyze</button>}
                  <button onClick={() => setShowWhyNow(false)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingWhyNow ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4"><Loader size={24} className="text-cyan-400 animate-spin" /><p className="text-sm text-[rgb(var(--muted))]">Analyzing timing...</p></div>
                ) : !whyNow ? (
                  <div className="text-center py-12">
                    <Clock size={32} className="text-cyan-400/50 mx-auto mb-4" />
                    <p className="text-sm text-[rgb(var(--muted))] mb-4">Assess why this is the right time to address this gap.</p>
                    <button onClick={fetchWhyNow} className="btn-primary">Analyze timing</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                      <div className="text-center flex-shrink-0">
                        <p className="text-3xl font-bold text-cyan-400">{whyNow.whyNowScore}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">/10</p>
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-300">{whyNow.whyNowLabel}</p>
                        <p className="text-xs text-[rgb(var(--muted))] mt-0.5">Timing score for this research gap</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-2">Why now</p>
                      <div className="space-y-2">
                        {(whyNow.reasons ?? []).map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--muted))]">
                            <span className="text-cyan-400 font-bold flex-shrink-0">{i+1}.</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {whyNow.risks && (
                      <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <p className="text-xs font-semibold text-red-400 mb-1">Risk of inaction</p>
                        <p className="text-sm text-[rgb(var(--muted))]">{whyNow.risks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
