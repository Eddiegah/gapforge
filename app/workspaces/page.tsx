"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, MessageSquare, Loader, Lock } from "lucide-react";
import { AppNav } from "@/components/nav";
import { formatRelativeDate } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  role: string;
  member_count: number;
  item_count: number;
  created_at: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then((d) => setWorkspaces(d.workspaces ?? []))
      .finally(() => setLoading(false));
  }, []);

  const createWorkspace = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      window.location.href = `/workspaces/${data.workspaceId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Workspaces</h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Shared spaces for your research group to save, discuss, and track gaps together.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> New workspace
          </button>
        </div>

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-6"
          >
            <h3 className="font-semibold text-[rgb(var(--foreground))] mb-4">Create workspace</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Workspace name"
                className="input"
                aria-label="Workspace name"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="input resize-none"
                aria-label="Workspace description"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <button onClick={createWorkspace} disabled={!name.trim() || creating} className="btn-primary flex items-center gap-2 text-sm">
                  {creating ? <Loader size={13} className="animate-spin" /> : null}
                  {creating ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader size={24} className="text-coral animate-spin" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="card p-12 text-center">
            <Users size={32} className="text-coral mx-auto mb-4" />
            <h2 className="font-semibold text-[rgb(var(--foreground))] mb-2">No workspaces yet</h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-6 max-w-sm mx-auto">
              Create a workspace to collaborate with your research group on gaps and papers.
            </p>
            <div className="flex items-center gap-2 justify-center text-xs text-[rgb(var(--muted))]">
              <Lock size={12} />
              <span>Requires team or pro plan</span>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {workspaces.map((ws) => (
              <a
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="card p-5 hover:border-coral/30 transition-colors block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[rgb(var(--foreground))]">{ws.name}</h3>
                  <span className="badge bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] capitalize">{ws.role}</span>
                </div>
                {ws.description && (
                  <p className="text-sm text-[rgb(var(--muted))] mb-3 line-clamp-2">{ws.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted))]">
                  <span className="flex items-center gap-1"><Users size={11} /> {ws.member_count} member{ws.member_count !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {ws.item_count} item{ws.item_count !== 1 ? "s" : ""}</span>
                  <span>{formatRelativeDate(ws.created_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
