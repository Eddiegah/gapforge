"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, BookOpen, Home, Layers, BarChart2, Trophy, DollarSign, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { id: "gap-ai",    label: "Gap AI",              desc: "Search for research gaps",    icon: Search,    href: "/gap-ai",            shortcut: "G" },
  { id: "drops",     label: "Gap Drops",            desc: "Your weekly digest",          icon: Zap,       href: "/gap-drops",         shortcut: "D" },
  { id: "simplify",  label: "GapSimplify",          desc: "Simplify a paper",            icon: BookOpen,  href: "/gap-simplify",      shortcut: "S" },
  { id: "dashboard", label: "Dashboard",            desc: "Home",                        icon: Home,      href: "/dashboard" },
  { id: "ai-writer", label: "AI Writer",            desc: "Draft research papers",       icon: Search,    href: "/ai-writer" },
  { id: "paraphraser", label: "Paraphraser",        desc: "Rewrite academic text",       icon: Zap,       href: "/paraphraser" },
  { id: "ai-detector", label: "AI Detector",        desc: "Check if text is AI-written", icon: Search,    href: "/ai-detector" },
  { id: "citation-booster", label: "Citation Booster", desc: "Find supporting citations", icon: BookOpen, href: "/citation-booster" },
  { id: "browse-papers", label: "Browse Papers",    desc: "Search 250M+ papers",         icon: BookOpen,  href: "/browse-papers" },
  { id: "agents",    label: "Agent Gallery",        desc: "Specialized research agents", icon: Zap,       href: "/agents" },
  { id: "templates", label: "Templates",            desc: "Pre-built gap searches",      icon: Search,    href: "/templates" },
  { id: "directories", label: "Directories",        desc: "Browse by topic/field",       icon: BookOpen,  href: "/directories" },
  { id: "issues",    label: "My Issues",            desc: "Research tracker",            icon: Layers,    href: "/issues" },
  { id: "systematic", label: "Systematic Review",   desc: "Generate a review",           icon: FileText,  href: "/systematic-review" },
  { id: "compare",   label: "Compare Gaps",         desc: "Side by side",                icon: BarChart2, href: "/compare" },
  { id: "leaderboard", label: "Leaderboard",        desc: "Community rankings",          icon: Trophy,    href: "/leaderboard" },
  { id: "pricing",   label: "Pricing",              desc: "Upgrade plan",                icon: DollarSign, href: "/pricing" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  const filtered = COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  const execute = useCallback((href: string) => {
    setOpen(false); setQuery(""); router.push(href);
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(p => !p); setSelected(0); }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) execute(filtered[selected].href);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, filtered, selected, execute]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-[501] flex items-start justify-center pt-[18vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
              className="pointer-events-auto w-full max-w-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgb(var(--border))]">
                <Search size={16} className="text-[rgb(var(--muted))] flex-shrink-0" />
                <input autoFocus value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none text-sm"
                  aria-label="Command search" />
                <kbd className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-md px-1.5 py-0.5 font-mono">Esc</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto py-1.5">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-[rgb(var(--muted))] py-8">No commands found</p>
                ) : filtered.map((cmd, i) => (
                  <button key={cmd.id} onClick={() => execute(cmd.href)} onMouseEnter={() => setSelected(i)}
                    className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      selected === i ? "bg-violet-500/10" : "hover:bg-[rgb(var(--bg))]")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      selected === i ? "bg-violet-500/20" : "bg-[rgb(var(--border))]")}>
                      <cmd.icon size={15} className={selected === i ? "text-violet-400" : "text-[rgb(var(--muted))]"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", selected === i ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))]")}>{cmd.label}</p>
                      <p className="text-xs text-[rgb(var(--muted))]/70 truncate">{cmd.desc}</p>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="text-xs text-[rgb(var(--muted))] border border-[rgb(var(--border))] rounded-md px-1.5 py-0.5 font-mono flex-shrink-0">{cmd.shortcut}</kbd>
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-[rgb(var(--border))] px-4 py-2 flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
                <span className="flex items-center gap-1"><kbd className="border border-[rgb(var(--border))] rounded px-1 font-mono">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="border border-[rgb(var(--border))] rounded px-1 font-mono">↵</kbd> open</span>
                <span className="flex items-center gap-1"><kbd className="border border-[rgb(var(--border))] rounded px-1 font-mono">⌘K</kbd> toggle</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
