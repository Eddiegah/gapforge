"use client";

import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode {
  // Handle bold **text** and __text__, italic *text* and _text_, code `text`, links [text](url)
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_|\[([^\]]+)\]\(([^)]+)\))/g);
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (!part) { i++; continue; }
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      result.push(<strong key={i} className="font-semibold text-[rgb(var(--fg))]">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("`") && part.endsWith("`")) {
      result.push(<code key={i} className="bg-[rgb(var(--border))] px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">{part.slice(1, -1)}</code>);
    } else if ((part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
               (part.startsWith("_") && part.endsWith("_") && part.length > 2)) {
      result.push(<em key={i} className="italic">{part.slice(1, -1)}</em>);
    } else if (part.startsWith("[")) {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        result.push(<a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">{linkMatch[1]}</a>);
      } else result.push(part);
    } else {
      result.push(part);
    }
    i++;
  }
  return result;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      result.push(<h1 key={i} className="text-xl font-bold text-[rgb(var(--fg))] mt-6 mb-2 first:mt-0">{parseInline(line.slice(2))}</h1>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="text-base font-bold text-[rgb(var(--fg))] mt-5 mb-1.5 border-b border-[rgb(var(--border))] pb-1">{parseInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="text-sm font-bold text-[rgb(var(--fg))] mt-4 mb-1">{parseInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("#### ")) {
      result.push(<h4 key={i} className="text-sm font-semibold text-violet-400 mt-3 mb-0.5">{parseInline(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith("> ")) {
      result.push(
        <blockquote key={i} className="border-l-4 border-violet-500/40 pl-4 py-1 my-2 bg-violet-500/5 rounded-r-lg">
          <p className="text-sm text-violet-300 italic">{parseInline(line.slice(2))}</p>
        </blockquote>
      );
      i++; continue;
    }
    // Code block
    if (line.startsWith("```")) {
      const langMatch = line.match(/^```(\w*)/);
      const lang = langMatch?.[1] ?? "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      result.push(
        <pre key={`code-${i}`} className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-xl p-4 my-3 overflow-x-auto">
          {lang && <p className="text-xs text-[rgb(var(--muted))] mb-2 font-mono">{lang}</p>}
          <code className="text-xs font-mono text-[rgb(var(--fg))] leading-relaxed">{codeLines.join("\n")}</code>
        </pre>
      );
      i++; continue;
    }
    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^(\d+)\.\s+(.+)/)) {
        const m = lines[i].match(/^(\d+)\.\s+(.+)/)!;
        listItems.push(
          <li key={i} className="flex gap-2 text-sm text-[rgb(var(--muted))] leading-relaxed">
            <span className="text-violet-400 font-semibold flex-shrink-0 w-5">{m[1]}.</span>
            <span>{parseInline(m[2])}</span>
          </li>
        );
        i++;
      }
      result.push(<ol key={`ol-${i}`} className="space-y-1.5 my-2 ml-1">{listItems}</ol>);
      continue;
    }
    // Bullet list (- or * or •)
    if (line.match(/^[-*•]\s+/)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*•]\s+/)) {
        listItems.push(
          <li key={i} className="flex gap-2 text-sm text-[rgb(var(--muted))] leading-relaxed">
            <span className="text-violet-400 flex-shrink-0 mt-1 text-xs">•</span>
            <span>{parseInline(lines[i].replace(/^[-*•]\s+/, ""))}</span>
          </li>
        );
        i++;
      }
      result.push(<ul key={`ul-${i}`} className="space-y-1 my-2 ml-1">{listItems}</ul>);
      continue;
    }
    if (line.match(/^---+$/)) {
      result.push(<hr key={i} className="border-[rgb(var(--border))] my-4" />);
      i++; continue;
    }
    if (line.trim() === "") {
      result.push(<div key={i} className="h-1.5" />);
      i++; continue;
    }
    result.push(
      <p key={i} className="text-sm text-[rgb(var(--muted))] leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return result;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) return null;
  return (
    <div className={cn("space-y-1 prose-content", className)}>
      {parseMarkdown(content)}
    </div>
  );
}
