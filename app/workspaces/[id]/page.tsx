"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Plus, MessageSquare, Loader, ArrowLeft, Send } from "lucide-react";
import { Nav } from "@/components/nav";
import { GapCard } from "@/components/gap-card";
import { formatRelativeDate } from "@/lib/utils";
import type { DetectedGap } from "@/lib/gapAI/detectGaps";

interface WorkspaceItem {
  id: string;
  item_type: string;
  item_json: DetectedGap | Record<string, unknown>;
  notes: string | null;
  added_by_name: string | null;
  created_at: string;
  comments: { id: string; content: string; userName: string; createdAt: string }[] | null;
}

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<{ name: string; description?: string | null } | null>(null);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [inviting, setInviting] = useState(false);

  const load = () =>
    fetch(`/api/workspaces/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setWorkspace(d.workspace);
        setItems(d.items ?? []);
        setRole(d.role ?? "");
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await fetch(`/api/workspaces/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", email: inviteEmail.trim() }),
    });
    setInviteEmail("");
    setInviting(false);
    load();
  };

  const addComment = async (itemId: string) => {
    const content = commentInputs[itemId]?.trim();
    if (!content) return;
    await fetch(`/api/workspaces/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add-comment", itemId, content }),
    });
    setCommentInputs((p) => ({ ...p, [itemId]: "" }));
    load();
  };

  if (loading) return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="flex justify-center pt-32"><Loader size={24} className="text-coral animate-spin" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        <a href="/workspaces" className="flex items-center gap-1 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] mb-6 transition-colors">
          <ArrowLeft size={14} /> All workspaces
        </a>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">
              {workspace?.name ?? ""}
            </h1>
            {workspace?.description && (
              <p className="text-sm text-[rgb(var(--muted))] mt-1">{workspace.description}</p>
            )}
          </div>
          {(role === "owner" || role === "admin") && (
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && invite()}
                placeholder="Invite by email..."
                className="input text-sm py-2"
                aria-label="Invite member email"
              />
              <button onClick={invite} disabled={inviting} className="btn-primary text-sm flex items-center gap-1">
                <Plus size={13} /> {inviting ? "..." : "Invite"}
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="card p-10 text-center">
            <Users size={28} className="text-[rgb(var(--muted))] mx-auto mb-3" />
            <p className="text-sm text-[rgb(var(--muted))]">
              No items yet. Save gaps or papers to this workspace from Gap AI or GapSimplify.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {item.item_type === "gap" ? (
                  <GapCard gap={item.item_json as DetectedGap} />
                ) : (
                  <div className="card p-5">
                    <p className="font-medium text-[rgb(var(--foreground))]">
                      {(item.item_json as Record<string, unknown>).title as string}
                    </p>
                  </div>
                )}

                {/* Comments */}
                <div className="pl-4 border-l-2 border-[rgb(var(--border))] space-y-2">
                  {(item.comments ?? []).map((c) => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium text-[rgb(var(--foreground))]">{c.userName}</span>
                      <span className="text-[rgb(var(--muted))]/60 text-xs ml-2">{formatRelativeDate(c.createdAt)}</span>
                      <p className="text-[rgb(var(--muted))] mt-0.5">{c.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={commentInputs[item.id] ?? ""}
                      onChange={(e) => setCommentInputs((p) => ({ ...p, [item.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addComment(item.id)}
                      placeholder="Add a comment..."
                      className="input text-xs py-1.5 flex-1"
                      aria-label="Comment"
                    />
                    <button onClick={() => addComment(item.id)} className="btn-secondary text-xs px-3">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
