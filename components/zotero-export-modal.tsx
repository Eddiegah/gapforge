"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookMarked, Loader2, CheckCircle, ExternalLink, Key } from "lucide-react";

interface ZoteroExportModalProps {
  open: boolean;
  onClose: () => void;
  items: { title: string; authors: string[]; year: number | null; doi: string | null; url: string; abstract?: string | null }[];
  label?: string;
}

export function ZoteroExportModal({ open, onClose, items, label }: ZoteroExportModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ succeeded: number; failed: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doExport = async () => {
    if (!apiKey.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/gap-ai/export-zotero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), items }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Export failed");
      setResult(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally { setLoading(false); }
  };

  const close = () => { setApiKey(""); setResult(null); setError(null); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) close(); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookMarked size={18} className="text-violet-400" />
                <h2 className="font-semibold text-[rgb(var(--fg))]">Export to Zotero</h2>
              </div>
              <button onClick={close} className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                <X size={16} />
              </button>
            </div>

            {!result ? (
              <div className="space-y-4">
                <p className="text-sm text-[rgb(var(--muted))]">
                  Exporting <strong className="text-[rgb(var(--fg))]">{items.length} item{items.length !== 1 ? "s" : ""}</strong>
                  {label ? ` from ${label}` : ""} to your Zotero library.
                </p>

                <div>
                  <label className="text-xs text-[rgb(var(--muted))] mb-1.5 block flex items-center gap-1">
                    <Key size={11} /> Zotero API Key
                  </label>
                  <input
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Paste your Zotero API key here"
                    type="password"
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500"
                  />
                  <a href="https://www.zotero.org/settings/keys/new" target="_blank" rel="noreferrer"
                    className="mt-1.5 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <ExternalLink size={11} /> Get your free Zotero API key
                  </a>
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <button onClick={close}
                    className="flex-1 py-2.5 rounded-xl border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">
                    Cancel
                  </button>
                  <button onClick={doExport} disabled={loading || !apiKey.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                    {loading ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><BookMarked size={14} /> Export</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-semibold text-[rgb(var(--fg))] mb-1">{result.message}</p>
                {result.failed > 0 && (
                  <p className="text-xs text-amber-400 mt-1">{result.failed} item{result.failed !== 1 ? "s" : ""} failed</p>
                )}
                <button onClick={close}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
