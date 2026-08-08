"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AppNav } from "@/components/nav";
import {
  Send, Loader2, Bot, User, Plus, Trash2,
  MessageSquare, Sparkles, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Simple markdown renderer — no extra dependency needed
function MarkdownContent({ content }: { content: string }) {
  // Convert basic markdown to JSX-safe HTML
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-[rgb(var(--fg))] mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-base font-semibold text-[rgb(var(--fg))] mt-3 mb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(<p key={i} className="font-semibold text-[rgb(var(--fg))]">{line.slice(2, -2)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} className="ml-4 mb-0.5 list-disc text-[rgb(var(--fg))]">{formatInline(line.slice(2))}</li>);
    } else if (/^\d+\. /.test(line)) {
      elements.push(<li key={i} className="ml-4 mb-0.5 list-decimal text-[rgb(var(--fg))]">{formatInline(line.replace(/^\d+\. /, ""))}</li>);
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="mb-2 leading-relaxed">{formatInline(line)}</p>);
    }
    i++;
  }

  return <div className="text-sm text-[rgb(var(--fg))] space-y-0.5">{elements}</div>;
}

function formatInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="bg-[rgb(var(--bg))] px-1.5 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
    return p;
  });
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  messages: Message[];
}

const STARTERS = [
  "What makes a research gap fundable?",
  "How do I turn a gap into a research proposal?",
  "Explain the difference between a research gap and a research problem",
  "What databases should I search to verify a gap exists?",
  "How do I write a strong 'gap statement' for my proposal?",
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const d = await res.json();
      setConversations(d.conversations ?? []);
    } catch { /* ignore */ }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    setActiveId(id);
    try {
      const res = await fetch(`/api/chat/conversations/${id}`);
      const d = await res.json();
      setMessages(d.messages ?? []);
    } catch { setMessages([]); }
  };

  const newConversation = () => {
    setActiveId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      ts: Date.now(),
    };

    setInput("");
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          message: text,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const d = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: d.reply ?? "Sorry, I couldn't generate a response.",
        ts: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Update or create conversation
      if (d.conversationId && d.conversationId !== activeId) {
        setActiveId(d.conversationId);
      }

      // Refresh sidebar
      fetchConversations();
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />

      <div className="flex-1 md:ml-60 flex overflow-hidden h-screen">
        {/* Conversation sidebar */}
        <div className={cn(
          "flex-shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--sidebar))] flex flex-col transition-all duration-200",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}>
          <div className="p-3 border-b border-[rgb(var(--border))]">
            <button onClick={newConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors">
              <Plus size={14} /> New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-violet-400" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-center text-[rgb(var(--muted))] py-6 px-3">
                No conversations yet. Start a new chat.
              </p>
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs transition-colors group",
                  activeId === conv.id
                    ? "bg-violet-600/15 text-violet-400"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
                )}>
                <MessageSquare size={13} className="flex-shrink-0" />
                <span className="flex-1 truncate">{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all"
                  title="Delete">
                  <X size={11} />
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
          {/* Header */}
          <div className="border-b border-[rgb(var(--border))] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] transition-colors">
              <ChevronRight size={16} className={cn("transition-transform", sidebarOpen && "rotate-180")} />
            </button>
            <Bot size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-[rgb(var(--fg))]">
              {activeConv ? activeConv.title : "GapForge AI"}
            </span>
            {messages.length > 0 && (
              <span className="text-xs text-[rgb(var(--muted))]">{messages.length} messages</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 pb-20">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles size={28} className="text-violet-400" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-[rgb(var(--fg))] mb-2">Research AI Assistant</h2>
                  <p className="text-sm text-[rgb(var(--muted))] max-w-sm">
                    Ask me anything about research gaps, methodology, proposals, literature, or academic writing.
                    Conversations are saved automatically.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {STARTERS.map((s, i) => (
                    <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="text-left px-4 py-3 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] hover:border-violet-500/30 transition-colors leading-relaxed">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user"
                      ? "bg-violet-600"
                      : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]"
                  )}>
                    {msg.role === "user"
                      ? <User size={14} className="text-white" />
                      : <Bot size={14} className="text-violet-400" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--fg))] rounded-tl-sm"
                  )}>
                    {msg.role === "assistant" ? (
                      <MarkdownContent content={msg.content} />
                    ) : msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-violet-400" />
                </div>
                <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[rgb(var(--border))] p-4 pb-20 md:pb-4">
            <div className="relative flex items-end gap-3 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-2xl px-4 py-3 focus-within:border-violet-500/50 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about research gaps, proposals, methodology..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] outline-none resize-none max-h-40 overflow-y-auto leading-relaxed"
                style={{ height: "auto" }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center flex-shrink-0 transition-all"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            <p className="text-xs text-center text-[rgb(var(--muted))]/50 mt-2">
              Shift+Enter for new line. Enter to send.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
