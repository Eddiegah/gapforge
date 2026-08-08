"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  desc: string;
  href?: string;
  completed: boolean;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "completed">[] = [
  { id: "profile", label: "Complete your research profile", desc: "Tell us your field and interests", href: "/onboarding" },
  { id: "gap-search", label: "Run your first Gap AI search", desc: "Find a research gap in your area", href: "/gap-ai" },
  { id: "save-gap", label: "Save a gap to your library", desc: "Track a gap you want to explore" },
  { id: "simplify", label: "Simplify a paper", desc: "Upload a PDF or paste a URL", href: "/gap-simplify" },
  { id: "notebook", label: "Create a notebook entry", desc: "Start your research notes", href: "/notebook" },
  { id: "explore-drops", label: "Check your Gap Drops", desc: "Your weekly research digest", href: "/gap-drops" },
];

export function OnboardingChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("gf_onboarding");
    const completedIds: string[] = stored ? JSON.parse(stored) : [];
    const isDismissed = localStorage.getItem("gf_onboarding_dismissed") === "1";

    setDismissed(isDismissed);
    setItems(DEFAULT_ITEMS.map(item => ({ ...item, completed: completedIds.includes(item.id) })));
  }, []);

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const markComplete = (id: string) => {
    setItems(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, completed: true } : i);
      const completedIds = updated.filter(i => i.completed).map(i => i.id);
      localStorage.setItem("gf_onboarding", JSON.stringify(completedIds));
      return updated;
    });
  };

  const dismiss = () => {
    localStorage.setItem("gf_onboarding_dismissed", "1");
    setDismissed(true);
  };

  if (dismissed || completedCount === items.length) return null;

  return (
    <div className="card border border-violet-500/20 bg-violet-500/5 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-[rgb(var(--fg))]">Getting started</span>
          <span className="text-xs text-violet-400 font-medium">
            {completedCount}/{items.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(v => !v)}
            className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={dismiss}
            className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[rgb(var(--border))] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id}
              className={cn("flex items-start gap-2.5 p-2 rounded-lg transition-colors",
                item.completed ? "opacity-50" : "hover:bg-violet-500/5")}>
              <button onClick={() => markComplete(item.id)} className="mt-0.5 flex-shrink-0 transition-colors">
                {item.completed
                  ? <CheckCircle size={15} className="text-green-400" />
                  : <Circle size={15} className="text-[rgb(var(--muted))]" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-medium text-[rgb(var(--fg))]", item.completed && "line-through")}>
                  {item.href ? (
                    <Link href={item.href} onClick={() => markComplete(item.id)}
                      className="hover:text-violet-400 transition-colors">
                      {item.label}
                    </Link>
                  ) : item.label}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
