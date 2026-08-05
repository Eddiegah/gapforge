"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Trash2, Plus, Loader, Moon, Sun, Monitor } from "lucide-react";
import { Nav } from "@/components/nav";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  last_used: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => setApiKeys(d.keys ?? []))
      .finally(() => setLoadingKeys(false));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/settings/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    if (data.key) {
      setNewKeyValue(data.key);
      setApiKeys((p) => [...p, data.meta]);
    }
    setNewKeyName("");
    setCreating(false);
  };

  const revokeKey = async (keyId: string) => {
    await fetch("/api/settings/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: keyId }),
    });
    setApiKeys((p) => p.filter((k) => k.id !== keyId));
  };

  const copy = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const THEMES = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20 space-y-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Settings</h1>

        {/* Appearance */}
        <div className="card p-6">
          <h2 className="font-semibold text-[rgb(var(--foreground))] mb-4">Appearance</h2>
          <div className="flex gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                  theme === value
                    ? "border-coral bg-coral/10 text-coral"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-coral/40"
                )}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* API Keys — institutional plan */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[rgb(var(--foreground))]">API Keys</h2>
            <span className="text-xs text-[rgb(var(--muted))]">Institutional plan</span>
          </div>

          {newKeyValue && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <p className="text-xs text-green-400 font-medium mb-2">
                Copy this key now — it will not be shown again.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 bg-[rgb(var(--background))] px-3 py-2 rounded text-xs font-mono text-[rgb(var(--foreground))] truncate">
                  {newKeyValue}
                </code>
                <button onClick={copy} className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0">
                  <Copy size={12} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              placeholder="Key name (e.g. My Institution)"
              className="input flex-1 text-sm"
              aria-label="API key name"
            />
            <button onClick={createKey} disabled={!newKeyName.trim() || creating} className="btn-primary text-sm flex items-center gap-1">
              {creating ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />}
              Create
            </button>
          </div>

          {loadingKeys ? (
            <Loader size={16} className="text-coral animate-spin" />
          ) : apiKeys.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">No API keys yet.</p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-[rgb(var(--background))] rounded-lg border border-[rgb(var(--border))]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Key size={12} className="text-[rgb(var(--muted))]" />
                      <span className="text-sm font-medium text-[rgb(var(--foreground))]">{k.name}</span>
                      <code className="text-xs text-[rgb(var(--muted))] font-mono">{k.key_prefix}...</code>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))] mt-0.5 ml-4">
                      {k.last_used ? `Last used ${new Date(k.last_used).toLocaleDateString()}` : "Never used"}
                    </p>
                  </div>
                  <button
                    onClick={() => revokeKey(k.id)}
                    className="p-1.5 rounded text-[rgb(var(--muted))] hover:text-red-400 transition-colors"
                    aria-label="Revoke key"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reference managers */}
        <div className="card p-6">
          <h2 className="font-semibold text-[rgb(var(--foreground))] mb-1">Reference Manager</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-4">
            Connect Zotero to export gaps and citations directly to your library.
          </p>
          <a
            href="https://www.zotero.org/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Get Zotero API key
          </a>
          <p className="text-xs text-[rgb(var(--muted))] mt-3">
            In Library, use the export button and paste your Zotero key + user ID to push references directly.
          </p>
        </div>
      </div>
    </div>
  );
}
