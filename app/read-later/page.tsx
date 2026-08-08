"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import {
  BookmarkCheck, Trash2, ExternalLink, Clock, Tag, Search,
  Download, Plus, Loader2, BookOpen, Filter, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaperItem {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  url: string;
  source: string;
  abstract?: string;
  tags: string[];
  read: boolean;
  added_at: string;
}

export default function ReadLaterPage() {
  const [items, setItems] = useState<PaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addAuthors, setAddAuthors] = useState("");
  const [addYear, setAddYear] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/read-later")
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addItem = async () => {
    if (!addTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/read-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addTitle,
          authors: addAuthors.split(",").map(a => a.trim()).filter(Boolean),
          year: addYear ? parseInt(addYear) : null,
          url: addUrl || null,
          tags: tagInput.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      if (d.item) {
        setItems(prev => [d.item, ...prev]);
        setAddTitle(""); setAddUrl(""); setAddAuthors(""); setAddYear(""); setTagInput("");
        setShowAdd(false);
        showToast("Added to reading list");
      }
    } catch { showToast("Failed to add"); }
    finally { setAdding(false); }
  };

  const toggleRead = async (id: string, read: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: !read } : i));
    await fetch(`/api/read-later/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !read }),
    });
  };

  const removeItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    await fetch(`/api/read-later/${id}`, { method: "DELETE" });
    showToast("Removed from reading list");
  };

  const exportList = () => {
    const data = items.map(i => ({
      title: i.title,
      authors: i.authors.join("; "),
      year: i.year,
      url: i.url,
      read: i.read,
      tags: i.tags.join(", "),
      added: i.added_at,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "read-later.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = items.filter(i => {
    const matchFilter = filter === "all" || (filter === "read" ? i.read : !i.read);
    const matchSearch = !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.authors.some(a => a.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const unreadCount = items.filter(i => !i.read).length;

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 px-4 md:px-8 py-8 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
                <BookmarkCheck size={22} className="text-violet-400" />
                Read Later
              </h1>
              <p className="text-sm text-[rgb(var(--muted))] mt-1">
                {unreadCount} unread · {items.length} total
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportList}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <Download size={13} /> Export
              </button>
              <button onClick={() => setShowAdd(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
                <Plus size={13} /> Add paper
              </button>
            </div>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="card p-5 mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Add to reading list</h3>
              <input
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                placeholder="Paper title (required)"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={addAuthors}
                  onChange={e => setAddAuthors(e.target.value)}
                  placeholder="Authors (comma-separated)"
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                />
                <input
                  value={addYear}
                  onChange={e => setAddYear(e.target.value)}
                  placeholder="Year"
                  type="number"
                  className="px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                />
              </div>
              <input
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                placeholder="URL / DOI (optional)"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="w-full px-3 py-2 rounded-lg bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                  Cancel
                </button>
                <button onClick={addItem} disabled={adding || !addTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 transition-colors">
                  {adding && <Loader2 size={14} className="animate-spin" />}
                  Add to list
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search papers..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-1">
              {(["all", "unread", "read"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                    filter === f ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="mx-auto text-[rgb(var(--muted))] mb-3 opacity-40" />
              <p className="text-[rgb(var(--muted))]">
                {items.length === 0 ? "No papers in your reading list yet." : "No papers match your filter."}
              </p>
              {items.length === 0 && (
                <button onClick={() => setShowAdd(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  Add your first paper
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => (
                <div key={item.id}
                  className={cn("card p-5 transition-all", item.read && "opacity-60")}>
                  <div className="flex items-start gap-4">
                    <button onClick={() => toggleRead(item.id, item.read)}
                      className={cn("mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center",
                        item.read ? "bg-violet-600 border-violet-600" : "border-[rgb(var(--border))] hover:border-violet-400")}>
                      {item.read && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-[rgb(var(--fg))] leading-snug">{item.title}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noreferrer"
                              className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 hover:bg-violet-400/10 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">
                        {item.authors.slice(0, 3).join(", ")}
                        {item.authors.length > 3 && " et al."}
                        {item.year && ` · ${item.year}`}
                        {item.source && ` · ${item.source}`}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Tag size={11} className="text-[rgb(var(--muted))]" />
                          {item.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <Clock size={11} className="text-[rgb(var(--muted))]" />
                        <span className="text-xs text-[rgb(var(--muted))]">
                          Added {new Date(item.added_at).toLocaleDateString()}
                        </span>
                        {item.read && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-xl text-sm text-[rgb(var(--fg))]">
          {toast}
        </div>
      )}
    </div>
  );
}
