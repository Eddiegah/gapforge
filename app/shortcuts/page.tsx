"use client";

import { AppNav } from "@/components/nav";
import { Keyboard } from "lucide-react";

const SHORTCUT_GROUPS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], desc: "Open command palette / quick navigate" },
      { keys: ["G"], desc: "Go to Gap AI (in command palette)" },
      { keys: ["D"], desc: "Go to Gap Drops (in command palette)" },
      { keys: ["S"], desc: "Go to GapSimplify (in command palette)" },
    ],
  },
  {
    title: "Gap AI",
    shortcuts: [
      { keys: ["Enter"], desc: "Submit gap search" },
      { keys: ["⌘", "Enter"], desc: "Re-run search with same query" },
      { keys: ["Esc"], desc: "Close active panel or modal" },
      { keys: ["↑", "↓"], desc: "Navigate search autocomplete" },
    ],
  },
  {
    title: "Gap Cards",
    shortcuts: [
      { keys: ["T"], desc: "Track / save gap to library" },
      { keys: ["E"], desc: "Export gap (Obsidian / Notion / BibTeX)" },
      { keys: ["C"], desc: "Copy citation" },
      { keys: ["A"], desc: "Ask AI about this gap" },
      { keys: ["H"], desc: "Generate hypotheses" },
      { keys: ["P"], desc: "Draft proposal" },
    ],
  },
  {
    title: "Command Palette",
    shortcuts: [
      { keys: ["↑", "↓"], desc: "Navigate commands" },
      { keys: ["Enter"], desc: "Open selected command" },
      { keys: ["Esc"], desc: "Close palette" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "Z"], desc: "Undo last action (where supported)" },
      { keys: ["⌘", "S"], desc: "Save current note (Notebook)" },
      { keys: ["⌘", "/"], desc: "Toggle sidebar" },
      { keys: ["?"], desc: "Show this shortcuts reference" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-xs font-mono text-[rgb(var(--fg))] shadow-sm">
      {children}
    </kbd>
  );
}

export default function ShortcutsPage() {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <main className="flex-1 md:ml-60 px-4 md:px-8 py-8 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))] flex items-center gap-2">
              <Keyboard size={22} className="text-violet-400" />
              Keyboard Shortcuts
            </h1>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              Move faster through GapForge without touching your mouse.
            </p>
          </div>

          <div className="space-y-6">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.title} className="card p-5">
                <h2 className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-widest mb-4">
                  {group.title}
                </h2>
                <div className="space-y-1">
                  {group.shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border))] last:border-0">
                      <span className="text-sm text-[rgb(var(--fg))]">{s.desc}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k, ki) => (
                          <span key={ki} className="flex items-center gap-1">
                            <Kbd>{k}</Kbd>
                            {ki < s.keys.length - 1 && <span className="text-xs text-[rgb(var(--muted))]">+</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[rgb(var(--muted))] text-center mt-8">
            On Windows/Linux, replace <Kbd>⌘</Kbd> with <Kbd>Ctrl</Kbd>
          </p>
        </div>
      </main>
    </div>
  );
}
