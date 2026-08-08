"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion } from "framer-motion";
import {
  Clock, Plus, Trash2, Edit2, Check, X, Loader2,
  BookOpen, FileText, Zap, Award, Users, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: "paper" | "gap" | "milestone" | "collaboration" | "award" | "submission";
  linked_url?: string;
  created_at: string;
}

const TYPE_CONFIG = {
  paper: { label: "Paper", icon: BookOpen, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  gap: { label: "Gap Found", icon: Zap, color: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  milestone: { label: "Milestone", icon: Flag, color: "text-green-400 bg-green-400/10 border-green-400/30" },
  collaboration: { label: "Collaboration", icon: Users, color: "text-teal-400 bg-teal-400/10 border-teal-400/30" },
  award: { label: "Award", icon: Award, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  submission: { label: "Submission", icon: FileText, color: "text-pink-400 bg-pink-400/10 border-pink-400/30" },
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", type: "milestone" as TimelineEvent["type"], linked_url: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/timeline")
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `/api/timeline/${editId}` : "/api/timeline";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.event) {
        if (editId) setEvents(prev => prev.map(e => e.id === editId ? d.event : e));
        else setEvents(prev => [d.event, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setShowForm(false); setEditId(null);
        setForm({ title: "", description: "", date: "", type: "milestone", linked_url: "" });
        showToast(editId ? "Updated" : "Event added");
      }
    } catch { showToast("Failed to save"); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await fetch(`/api/timeline/${id}`, { method: "DELETE" });
    showToast("Deleted");
  };

  const openEdit = (event: TimelineEvent) => {
    setEditId(event.id);
    setForm({ title: event.title, description: event.description ?? "", date: event.date.slice(0, 10), type: event.type, linked_url: event.linked_url ?? "" });
    setShowForm(true);
  };

  // Group events by year
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach(e => {
    const year = new Date(e.date).getFullYear().toString();
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(e);
  });
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <Clock size={22} className="text-violet-400" /> Research Timeline
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">Your research journey, documented.</p>
            </div>
            <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ title: "", description: "", date: new Date().toISOString().slice(0, 10), type: "milestone", linked_url: "" }); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex-shrink-0">
              <Plus size={14} /> Add event
            </button>
          </div>

          {/* Add/Edit form */}
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-8 space-y-3 border-violet-500/20 bg-violet-500/5">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{editId ? "Edit event" : "New event"}</h3>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)" rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500" />
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TimelineEvent["type"] }))}
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] outline-none focus:border-violet-500">
                  {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <input value={form.linked_url} onChange={e => setForm(f => ({ ...f, linked_url: e.target.value }))}
                placeholder="Link (DOI, URL, optional)"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowForm(false); setEditId(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">Cancel</button>
                <button onClick={save} disabled={saving || !form.title.trim() || !form.date}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {saving && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin text-violet-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="card p-12 text-center">
              <Clock size={36} className="mx-auto text-[rgb(var(--muted))] mb-4 opacity-40" />
              <p className="text-sm font-medium text-[rgb(var(--fg))] mb-1">No events yet</p>
              <p className="text-xs text-[rgb(var(--muted))] mb-4">Start documenting your research journey — papers published, gaps found, collaborations started.</p>
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                <Plus size={14} /> Add first event
              </button>
            </div>
          ) : (
            <div className="space-y-10">
              {years.map(year => (
                <div key={year}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-lg font-black text-violet-400">{year}</span>
                    <div className="flex-1 h-px bg-[rgb(var(--border))]" />
                    <span className="text-xs text-[rgb(var(--muted))]">{grouped[year].length} event{grouped[year].length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="relative pl-6 space-y-5">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-[rgb(var(--border))]" />
                    {grouped[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, i) => {
                      const cfg = TYPE_CONFIG[event.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.div key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="relative">
                          {/* Dot */}
                          <div className={cn("absolute -left-6 top-3 w-5 h-5 rounded-full border-2 border-[rgb(var(--bg))] flex items-center justify-center", cfg.color.split(" ").slice(1).join(" "))}>
                            <Icon size={9} />
                          </div>
                          <div className="card p-4 hover:border-violet-500/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", cfg.color)}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-xs text-[rgb(var(--muted))]">
                                    {new Date(event.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{event.title}</p>
                                {event.description && <p className="text-xs text-[rgb(var(--muted))] mt-1 leading-relaxed">{event.description}</p>}
                                {event.linked_url && (
                                  <a href={event.linked_url} target="_blank" rel="noreferrer"
                                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 mt-1.5 transition-colors">
                                    View link →
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => openEdit(event)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => deleteEvent(event.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))] whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
