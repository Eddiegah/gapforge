"use client";

import { useState, useEffect } from "react";
import { AppNav } from "@/components/nav";
import {
  Code2, Copy, Check, Key, Plus, Trash2, Eye, EyeOff,
  Loader2, Shield, Zap, BookOpen, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used: string | null;
  revoked_at: string | null;
}

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/v1/gaps",
    desc: "Search for research gaps",
    body: `{ "query": "gut microbiome and depression", "limit": 5 }`,
    response: `{ "gaps": [...], "papersAnalyzed": 142, "sourcesQueried": [...] }`,
  },
  {
    method: "POST",
    path: "/api/v1/simplify",
    desc: "Simplify a paper by DOI or URL",
    body: `{ "url": "https://arxiv.org/abs/2301.00001" }`,
    response: `{ "title": "...", "sections": [...], "glossary": [...], "gaps": [...] }`,
  },
  {
    method: "GET",
    path: "/api/v1/gaps",
    desc: "Get saved gaps for authenticated user",
    body: null,
    response: `{ "gaps": [...] }`,
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-400 bg-green-400/10 border-green-400/30",
  POST: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function ApiAccessPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    fetch("/api/keys").then(r => r.json()).then(d => setKeys(d.keys ?? [])).catch(() => {}).finally(() => setLoading(false));
    fetch("/api/user/plan").then(r => r.json()).then(d => setPlan(d.plan ?? "free")).catch(() => {});
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });
      const d = await res.json();
      if (d.key) {
        setNewKey(d.key);
        setShowNewKey(true);
        setKeys(prev => [d.keyRecord, ...prev]);
        setNewKeyName("");
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const revokeKey = async (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const isInstitutional = ["institutional", "team", "pro"].includes(plan);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 px-4 md:px-8 py-6 pb-24 md:pb-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Code2 size={22} className="text-violet-400" /> API Access
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Integrate GapForge into your tools, workflows, and institutional systems.
            </p>
          </div>

          {/* Plan gate */}
          {!isInstitutional && (
            <div className="card p-6 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-400 mb-1">API access requires Pro or higher</p>
                  <p className="text-xs text-[rgb(var(--muted))] mb-3">Upgrade to Pro ($20/mo) or Team ($40/mo) to generate API keys and make programmatic requests.</p>
                  <a href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold transition-colors">
                    <Zap size={13} /> Upgrade plan
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* API Keys */}
          <div className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))] flex items-center gap-2">
              <Key size={15} className="text-violet-400" /> API Keys
            </h2>

            {newKey && showNewKey && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-2">
                <p className="text-xs font-semibold text-green-400">Key created — copy it now, it won&apos;t be shown again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg px-3 py-2 font-mono text-green-300 truncate">
                    {showNewKey ? newKey : "••••••••••••••••••••••••••"}
                  </code>
                  <button onClick={() => setShowNewKey(v => !v)} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    {showNewKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copy(newKey, "newkey")} className="p-2 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                    {copied === "newkey" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Create form */}
            {isInstitutional && (
              <div className="flex gap-2">
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production, Research Lab)"
                  className="flex-1 px-3 py-2 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  onKeyDown={e => e.key === "Enter" && createKey()} />
                <button onClick={createKey} disabled={creating || !newKeyName.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex-shrink-0">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-violet-400" /></div>
            ) : keys.length === 0 ? (
              <p className="text-xs text-[rgb(var(--muted))] text-center py-6">No API keys yet.</p>
            ) : (
              <div className="space-y-2">
                {keys.map(key => (
                  <div key={key.id} className={cn("flex items-center gap-3 p-3 rounded-xl border", key.revoked_at ? "opacity-50 border-[rgb(var(--border))]" : "border-[rgb(var(--border))] hover:border-violet-500/20")}>
                    <Key size={14} className={key.revoked_at ? "text-[rgb(var(--muted))]" : "text-violet-400"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">{key.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {key.key_prefix}•••••••
                        {key.revoked_at ? " · Revoked" : key.last_used ? ` · Last used ${new Date(key.last_used).toLocaleDateString()}` : " · Never used"}
                      </p>
                    </div>
                    {!key.revoked_at && (
                      <button onClick={() => revokeKey(key.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Reference */}
          <div className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))] flex items-center gap-2">
              <BookOpen size={15} className="text-violet-400" /> API Reference
            </h2>
            <div className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] font-mono text-xs text-[rgb(var(--muted))]">
              Base URL: <span className="text-violet-400">https://gapforge-self.vercel.app/api/v1</span>
              <br />
              Auth: <span className="text-violet-400">Authorization: Bearer YOUR_API_KEY</span>
            </div>
            <div className="space-y-4">
              {ENDPOINTS.map((ep, i) => (
                <div key={i} className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[rgb(var(--bg))]/50">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", METHOD_COLORS[ep.method] ?? "text-violet-400 bg-violet-400/10")}>{ep.method}</span>
                    <code className="text-xs text-[rgb(var(--fg))] font-mono">{ep.path}</code>
                    <span className="text-xs text-[rgb(var(--muted))] flex-1">{ep.desc}</span>
                    <button onClick={() => copy(`curl -X ${ep.method} https://gapforge-self.vercel.app${ep.path} \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json"${ep.body ? ` \\\n  -d '${ep.body}'` : ""}`, `ep-${i}`)}
                      className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors">
                      {copied === `ep-${i}` ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                  {ep.body && (
                    <div className="border-t border-[rgb(var(--border))] px-4 py-3">
                      <p className="text-xs text-[rgb(var(--muted))] mb-1">Request body</p>
                      <code className="text-xs text-amber-300 font-mono">{ep.body}</code>
                    </div>
                  )}
                  <div className="border-t border-[rgb(var(--border))] px-4 py-3 bg-[rgb(var(--bg))]/30">
                    <p className="text-xs text-[rgb(var(--muted))] mb-1">Response</p>
                    <code className="text-xs text-green-300 font-mono">{ep.response}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))] mb-3">Rate limits</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { plan: "Free", limit: "0 req/min", color: "text-[rgb(var(--muted))]" },
                { plan: "Pro", limit: "60 req/min", color: "text-violet-400" },
                { plan: "Team/Institutional", limit: "300 req/min", color: "text-amber-400" },
              ].map(r => (
                <div key={r.plan} className="p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                  <p className={cn("text-sm font-bold", r.color)}>{r.limit}</p>
                  <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{r.plan}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
