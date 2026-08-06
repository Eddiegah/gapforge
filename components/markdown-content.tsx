"use client";

import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1
    if (line.startsWith("# ")) {
      result.push(<h1 key={i} className="text-xl font-bold text-[rgb(var(--fg))] mt-6 mb-2 first:mt-0">{line.slice(2)}</h1>);
      i++; continue;
    }
    // H2
    if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="text-base font-bold text-[rgb(var(--fg))] mt-5 mb-1.5 border-b border-[rgb(var(--border))] pb-1">{line.slice(3)}</h2>);
      i++; continue;
    }
    // H3
    if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="text-sm font-bold text-[rgb(var(--fg))] mt-4 mb-1">{line.slice(4)}</h3>);
      i++; continue;
    }
    // Blockquote
    if (line.startsWith("> ")) {
      result.push(
        <blockquote key={i} className="border-l-4 border-violet-500/40 pl-4 py-1 my-2 bg-violet-500/5 rounded-r-lg">
          <p className="text-sm text-violet-300 italic">{parseInline(line.slice(2))}</p>
        </blockquote>
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
      result.push(<ol key={`ol-${i}`} className="space-y-1.5 my-2">{listItems}</ol>);
      continue;
    }
    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(
          <li key={i} className="flex gap-2 text-sm text-[rgb(var(--muted))] leading-relaxed">
            <span className="text-violet-400 flex-shrink-0 mt-1">•</span>
            <span>{parseInline(lines[i].slice(2))}</span>
          </li>
        );
        i++;
      }
      result.push(<ul key={`ul-${i}`} className="space-y-1 my-2">{listItems}</ul>);
      continue;
    }
    // Horizontal rule
    if (line.match(/^---+$/)) {
      result.push(<hr key={i} className="border-[rgb(var(--border))] my-4" />);
      i++; continue;
    }
    // Empty line
    if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
      i++; continue;
    }
    // Regular paragraph
    result.push(
      <p key={i} className="text-sm text-[rgb(var(--muted))] leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return result;
}

function parseInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-[rgb(var(--fg))]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-[rgb(var(--border))] px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {parseMarkdown(content)}
    </div>
  );
}
