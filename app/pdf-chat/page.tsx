"use client";

import { useState, useRef, useEffect } from "react";
import { AppNav } from "@/components/nav";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Send, Loader2, Bot, User,
  X, Sparkles, BookOpen, Zap, AlertCircle, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/markdown-content";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface PaperMeta {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  url?: string;
}

const STARTERS = [
  "What is the main research gap this paper addresses?",
  "Summarize the methodology in simple terms",
  "What are the key limitations of this study?",
  "What future research does this paper suggest?",
  "Explain the main findings to a non-expert",
  "What datasets were used in this study?",
];

export default function PdfChatPage() {
  const [mode, setMode] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [paper, setPaper] = useState<PaperMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadPaper = async () => {
    setLoading(true); setError(null); setPaper(null); setMessages([]);
    try {
      const form = new FormData();
      if (mode === "file" && file) form.append("file", file);
      else form.append("url", url);

      const res = await fetch("/api/pdf-chat/load", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to load paper");
      setPaper(d.paper);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `I've read **${d.paper.title}**${d.paper.authors?.length ? ` by ${d.paper.authors.slice(0, 2).join(", ")}${d.paper.authors.length > 2 ? " et al." : ""}` : ""}. Ask me anything about this paper — methodology, findings, limitations, gaps, or explanations.`,
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load paper");
    } finally { setLoading(false); }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !paper) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setSending(true);
    try {
      const res = await fetch("/api/pdf-chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          paper,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const d = await res.json();
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: d.answer ?? "Sorry, I couldn't answer that." }]);
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong. Try again." }]);
    } finally { setSending(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setMode("file"); }
  };

  const reset = () => { setPaper(null); setMessages([]); setUrl(""); setFile(null); setError(null); };

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 flex flex-col h-screen overflow-hidden">
        {!paper ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
            <div className="w-full max-w-lg space-y-5">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <FileText size={28} className="text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">PDF Chat</h1>
                <p className="text-sm text-[rgb(var(--muted))] mt-1">Ask questions about any research paper</p>
              </div>

              <div className="flex items-center gap-1 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-1 w-fit mx-auto">
                {(["url", "file"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      mode === m ? "bg-violet-600 text-white" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")}>
                    {m === "url" ? "URL / DOI" : "Upload PDF"}
                  </button>
                ))}
              </div>

              {mode === "url" ? (
                <input value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && loadPaper()}
                  placeholder="https://arxiv.org/abs/... or DOI or PubMed URL"
                  className="w-full px-4 py-3 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none focus:border-violet-500" />
              ) : (
                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={cn("rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    dragOver ? "border-violet-500 bg-violet-500/5" : "border-[rgb(var(--border))] hover:border-violet-500/40")}>
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                  <Upload size={24} className="mx-auto text-violet-400 mb-2" />
                  {file ? <p className="text-sm font-medium text-[rgb(var(--fg))]">{file.name}</p>
                    : <p className="text-sm text-[rgb(var(--muted))]">Drop PDF or click to browse</p>}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-400/5 border border-red-400/20 text-sm text-red-400">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button onClick={loadPaper} disabled={loading || (mode === "url" ? !url.trim() : !file)}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Loading paper...</> : <><BookOpen size={16} /> Load & start chatting</>}
              </button>

              <div className="text-center">
                <p className="text-xs text-[rgb(var(--muted))] mb-3">Try these prompts after loading:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {STARTERS.slice(0, 3).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Paper header */}
            <div className="px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 flex items-center gap-3 flex-shrink-0">
              <FileText size={15} className="text-violet-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[rgb(var(--fg))] truncate">{paper.title}</p>
                {paper.authors?.length > 0 && (
                  <p className="text-xs text-[rgb(var(--muted))] truncate">
                    {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                    {paper.year ? ` · ${paper.year}` : ""}
                  </p>
                )}
              </div>
              {paper.url && (
                <a href={paper.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors flex-shrink-0">
                  <ExternalLink size={14} />
                </a>
              )}
              <button onClick={reset} className="flex items-center gap-1 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] border border-[rgb(var(--border))] rounded-lg px-2.5 py-1.5 transition-colors flex-shrink-0">
                <X size={12} /> New
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-2">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user" ? "bg-violet-600" : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]")}>
                    {msg.role === "user" ? <User size={14} className="text-white" /> : <Bot size={14} className="text-violet-400" />}
                  </div>
                  <div className={cn("max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] rounded-tl-sm")}>
                    {msg.role === "assistant" ? <MarkdownContent content={msg.content} /> : msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-violet-400" />
                  </div>
                  <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Starters */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
                {STARTERS.map(s => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    className="flex-shrink-0 text-xs px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-[rgb(var(--border))] p-3 pb-20 md:pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 focus-within:border-violet-500/50 transition-colors">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Ask anything about this paper..."
                  className="flex-1 bg-transparent text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none" />
                <button onClick={send} disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
