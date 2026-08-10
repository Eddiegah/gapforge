"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Target, Plus, Check, Trash2, Loader2, Calendar,
  Zap, ChevronRight, BarChart3, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ResearchGoal {
  id: string;
  title: string;
  description: string;
  category: "gap" | "paper" | "grant" | "collaboration" | "other";
  status: "active" | "completed" | "paused";
  progress: number; // 0-100
  deadline: string | null;
  created_at: string;
  milestones: { id: string; text: string; done: boolean }[];
}

const CATEGORY_CONFIG = {
  gap: { label: "Research Gap", color: "text-violet-400 bg-violet-400/10", icon: Zap },
  paper: { label: "Paper/Publication", color: "text-blue-400 bg-blue-400/10", icon: Target },
  grant: { label: "Grant Application", color: "text-green-400 bg-green-400/10", icon: Flag },
  collaboration: { label: "Collaboration", color: "text-amber-400 bg-amber-400/10", icon: Target },
  other: { label: "Other", color: "text-[rgb(var(--muted))] bg-[rgb(var(--border))]", icon: Target },
};

export default function ResearchPlannerPage() {
  const [goals, setGoals] = useState<ResearchGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "gap" as ResearchGoal["category"], deadline: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/research-planner")
      .then(r => r.json())
      .then(d => setGoals(d.goals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createGoal = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/research-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, milestones: [] }),
      });
      const d = await res.json();
      if (d.goal) { setGoals(prev => [d.goal, ...prev]); setShowForm(false); setForm({ title: "", description: "", category: "gap", deadline: "" }); showToast("Goal created"); }
    } catch { showToast("Failed"); }
    finally { setSaving(false); }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => g.id === goalId ? {
      ...g,
      milestones: g.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m),
      progress: Math.round((g.milestones.filter(m => m.id === milestoneId ? !m.done : m.done).length / g.milestones.length) * 100),
    } : g));
    await fetch(`/api/research-planner/${goalId}/milestone/${milestoneId}`, { method: "PATCH" });
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/research-planner/${id}`, { method: "DELETE" });
    showToast("Goal deleted");
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const overallProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Target size={22} className="text-violet-400" /> Research Planner
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">Track your research goals with milestones and deadlines.</p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              <Plus size={14} /> New goal
            </button>
          </div>

          {/* Overall progress */}
          {goals.length > 0 && (
            <div className="card p-5 mb-6 flex items-center gap-5">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg width="64" height="64" className="-rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgb(var(--border))" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#7c3aed" strokeWidth="6"
                    strokeDasharray={`${(overallProgress / 100) * 163} 163`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-violet-400">{overallProgress}%</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Overall research progress</p>
                <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{activeGoals.length} active · {completedGoals.length} completed</p>
              </div>
              <Link href="/analytics" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                <BarChart3 size={12} /> Full analytics
              </Link>
            </div>
          )}

          {/* Create form */}
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-6 space-y-3 border-violet-500/20 bg-violet-500/5">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">New research goal</h3>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Goal title e.g. Publish paper on microbiome-depression link"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                placeholder="Describe your goal..."
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ResearchGoal["category"] }))}
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none">
                  {Object.entries(CATEGORY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">Cancel</button>
                <button onClick={createGoal} disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />} Create goal
                </button>
              </div>
            </motion.div>
          )}

          {/* Goals list */}
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-violet-400" /></div>
          ) : goals.length === 0 ? (
            <div className="card p-12 text-center">
              <Target size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
              <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">No goals yet</p>
              <p className="text-xs text-[rgb(var(--muted))] mb-4">Create research goals and track them with milestones.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  <Plus size={14} /> Create first goal
                </button>
                <Link href="/gap-ai" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Find a gap first
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeGoals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3">Active ({activeGoals.length})</p>
                  {activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} onToggleMilestone={toggleMilestone} onDelete={deleteGoal} />)}
                </div>
              )}
              {completedGoals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-3 mt-6">Completed ({completedGoals.length})</p>
                  {completedGoals.map(goal => <GoalCard key={goal.id} goal={goal} onToggleMilestone={toggleMilestone} onDelete={deleteGoal} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">{toast}</div>
      )}
    </div>
  );
}

function GoalCard({ goal, onToggleMilestone, onDelete }: {
  goal: ResearchGoal;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[goal.category];
  const Icon = cfg.icon;
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", cfg.color)}>
          <Icon size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug">{goal.title}</p>
            <button onClick={() => onDelete(goal.id)} className="p-1 rounded text-[rgb(var(--muted))] hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>{cfg.label}</span>
            {daysLeft !== null && (
              <span className={cn("text-xs", daysLeft < 0 ? "text-red-400" : daysLeft < 7 ? "text-amber-400" : "text-[rgb(var(--muted))]")}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[rgb(var(--muted))]">Progress</span>
          <span className="text-xs font-bold text-violet-400">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-[rgb(var(--border))] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
      </div>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <div className="space-y-1.5">
          {goal.milestones.map(m => (
            <button key={m.id} onClick={() => onToggleMilestone(goal.id, m.id)}
              className="w-full flex items-center gap-2 text-left group">
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                m.done ? "bg-violet-600 border-violet-600" : "border-[rgb(var(--border))] group-hover:border-violet-400")}>
                {m.done && <Check size={10} className="text-white" />}
              </div>
              <span className={cn("text-xs transition-colors", m.done ? "text-[rgb(var(--muted))] line-through" : "text-[rgb(var(--fg))]")}>{m.text}</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
