"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookText, Plus, Trash2, Save, Loader, X } from "lucide-react";
import { AppNav } from "@/components/nav";
import { formatRelativeDate } from "@/lib/utils";
import { useToast } from "@/components/toast";

interface Entry { id: string; title: string; content: string; tags: string[]; updated_at: string; created_at: string; }

export default function NotebookPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const res = await fetch("/api/notebook");
    const d = await res.json();
    setEntries(d.entries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createEntry = async () => {
    const res = await fetch("/api/notebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Untitled Note", content: "" }) });
    const d = await res.json();
    await load();
    const newEntry = { id: d.id, title: "Untitled Note", content: "", tags: [], updated_at: new Date().toISOString(), created_at: new Date().toISOString() };
    setSelected(newEntry);
  };

  const saveEntry = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/notebook", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, title: selected.title, content: selected.content, tags: selected.tags }) });
    setSaving(false);
    toast("Note saved!");
    load();
  };

  const deleteEntry = async (id: string) => {
    await fetch("/api/notebook", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (selected?.id === id) setSelected(null);
    load();
    toast("Note deleted");
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0 h-screen flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
              <BookText size={15} className="text-violet-400" /> Notebook
            </div>
            <button onClick={createEntry} className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors">
              <Plus size={13} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? <div className="flex justify-center py-8"><Loader size={18} className="text-violet-400 animate-spin" /></div>
              : entries.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-[rgb(var(--muted))] mb-3">No notes yet</p>
                  <button onClick={createEntry} className="text-xs text-violet-400 hover:underline">Create your first note</button>
                </div>
              ) : entries.map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  className={`w-full text-left px-4 py-3 border-b border-[rgb(var(--border))]/40 hover:bg-[rgb(var(--bg))]/60 transition-colors ${selected?.id === e.id ? "bg-violet-500/10" : ""}`}>
                  <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{e.title || "Untitled"}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{formatRelativeDate(e.updated_at)}</p>
                  {e.content && <p className="text-xs text-[rgb(var(--muted))]/60 mt-0.5 line-clamp-1">{e.content.slice(0, 60)}</p>}
                </button>
              ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between px-6 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex-shrink-0">
                <input value={selected.title} onChange={e => setSelected(p => p ? { ...p, title: e.target.value } : p)}
                  className="text-lg font-bold bg-transparent text-[rgb(var(--fg))] outline-none flex-1 mr-4" placeholder="Note title..." aria-label="Note title" />
                <div className="flex items-center gap-2">
                  <button onClick={saveEntry} disabled={saving} className="btn-primary text-xs flex items-center gap-1.5 py-1.5">
                    {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Save
                  </button>
                  <button onClick={() => deleteEntry(selected.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <textarea value={selected.content}
                onChange={e => setSelected(p => p ? { ...p, content: e.target.value } : p)}
                placeholder="Start writing your research notes here..."
                className="flex-1 bg-transparent text-[rgb(var(--fg))] outline-none resize-none px-6 py-5 text-sm leading-relaxed"
                aria-label="Note content"
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveEntry(); } }}
              />
              <div className="px-6 py-2 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))]">
                {selected.content.split(/\s+/).filter(Boolean).length} words · Ctrl+S to save
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <BookText size={40} className="text-violet-400/40 mx-auto" />
                <p className="font-semibold text-[rgb(var(--fg))]">Research Notebook</p>
                <p className="text-sm text-[rgb(var(--muted))] max-w-xs">Write notes, connect them to gaps and papers, build your research thinking.</p>
                <button onClick={createEntry} className="btn-primary flex items-center gap-2 mx-auto">
                  <Plus size={14} /> New note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
