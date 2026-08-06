"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader, Edit2, Trash2, Layers } from "lucide-react";
import { AppNav } from "@/components/nav";
import { cn } from "@/lib/utils";

type Status = "investigating" | "in_progress" | "completed" | "published";

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
}

const COLUMNS: { status: Status; label: string; color: string; bg: string }[] = [
  { status: "investigating", label: "Investigating", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { status: "in_progress",   label: "In Progress",  color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  { status: "completed",     label: "Completed",    color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/20" },
  { status: "published",     label: "Published",    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("investigating");
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/issues").then(r => r.json()).then(d => setIssues(d.issues ?? [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    await fetch("/api/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle, description: newDesc, status: newStatus }) });
    setNewTitle(""); setNewDesc(""); setNewStatus("investigating"); setShowCreate(false); setSaving(false); load();
  };

  const updateStatus = async (id: string, status: Status) => {
    await fetch("/api/issues", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteIssue = async (id: string) => {
    await fetch("/api/issues", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  const saveEdit = async () => {
    if (!editIssue) return;
    setSaving(true);
    await fetch("/api/issues", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editIssue.id, title: editIssue.title, notes: editIssue.notes, status: editIssue.status }) });
    setSaving(false); setEditIssue(null); load();
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="px-4 py-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-violet-400" />
              <div>
                <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">My Issues</h1>
                <p className="text-sm text-[rgb(var(--muted))]">Track your research gaps from discovery to publication</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> New issue
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader size={24} className="text-violet-400 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {COLUMNS.map(col => {
                const colIssues = issues.filter(i => i.status === col.status);
                return (
                  <div key={col.status} className="space-y-3">
                    <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", col.bg)}>
                      <span className={cn("text-sm font-semibold", col.color)}>{col.label}</span>
                      <span className={cn("text-xs font-bold", col.color)}>{colIssues.length}</span>
                    </div>
                    {colIssues.map(issue => (
                      <motion.div key={issue.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="card p-4 hover:border-violet-500/30 transition-colors">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))] leading-snug mb-2">{issue.title}</p>
                        {issue.notes && <p className="text-xs text-[rgb(var(--muted))] line-clamp-2 mb-3">{issue.notes}</p>}
                        <div className="flex items-center gap-1 flex-wrap">
                          {COLUMNS.filter(c => c.status !== issue.status).map(c => (
                            <button key={c.status} onClick={() => updateStatus(issue.id, c.status)}
                              className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] border border-[rgb(var(--border))] rounded px-2 py-0.5 transition-colors">
                              → {c.label}
                            </button>
                          ))}
                          <button onClick={() => setEditIssue(issue)} className="ml-auto p-1 text-[rgb(var(--muted))] hover:text-violet-400 transition-colors"><Edit2 size={12} /></button>
                          <button onClick={() => deleteIssue(issue.id)} className="p-1 text-[rgb(var(--muted))] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    ))}
                    {colIssues.length === 0 && (
                      <div className="border-2 border-dashed border-[rgb(var(--border))] rounded-xl p-4 text-center text-xs text-[rgb(var(--muted))]">
                        No issues here
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[rgb(var(--fg))]">New Issue</h2>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Issue title..." className="input w-full" aria-label="Issue title" />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)..." rows={3} className="input w-full resize-none" aria-label="Description" />
                <select value={newStatus} onChange={e => setNewStatus(e.target.value as Status)} className="input w-full" aria-label="Status">
                  {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                </select>
                <div className="flex gap-2 pt-2">
                  <button onClick={create} disabled={!newTitle.trim() || saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? <Loader size={13} className="animate-spin" /> : null} Create
                  </button>
                  <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editIssue && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setEditIssue(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[rgb(var(--fg))]">Edit Issue</h2>
                <button onClick={() => setEditIssue(null)} className="p-1.5 rounded text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <input value={editIssue.title} onChange={e => setEditIssue(p => p ? { ...p, title: e.target.value } : p)} className="input w-full" aria-label="Title" />
                <textarea value={editIssue.notes ?? ""} onChange={e => setEditIssue(p => p ? { ...p, notes: e.target.value } : p)} placeholder="Notes..." rows={3} className="input w-full resize-none" aria-label="Notes" />
                <select value={editIssue.status} onChange={e => setEditIssue(p => p ? { ...p, status: e.target.value as Status } : p)} className="input w-full" aria-label="Status">
                  {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
                </select>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? <Loader size={13} className="animate-spin" /> : null} Save
                  </button>
                  <button onClick={() => setEditIssue(null)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
