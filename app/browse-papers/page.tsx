"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Loader, ExternalLink, BookOpen, Bookmark } from "lucide-react";
import { AppNav } from "@/components/nav";
import { useToast } from "@/components/toast";

interface Paper {
  id: string; title: string; authors: string[];
  year: number | null; doi: string | null; url: string;
  source: string; abstract: string | null; citationCount: number | null;
}

const FIELDS = ["All", "Medicine", "Biology", "Computer Science", "Physics", "Psychology", "Economics", "Engineering", "Chemistry", "Neuroscience"];
const YEARS = ["Any year", "2024-2025", "2020-2024", "2015-2020", "Before 2015"];

export default function BrowsePapersPage() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("All");
  const [year, setYear] = useState("Any year");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const search = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const fieldParam = field !== "All" ? `+${field}` : "";
      const res = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(q + fieldParam)}&per_page=15&sort=cited_by_count:desc&mailto=research@gapforge.app`,
        { signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      const results: Paper[] = (data.results ?? []).map((p: Record<string, unknown>) => {
        const inv = p.abstract_inverted_index as Record<string, number[]> | null;
        let abstract: string | null = null;
        if (inv) {
          const words: [string, number][] = Object.entries(inv).flatMap(([w, pos]) => pos.map(pos => [w, pos] as [string, number]));
          words.sort((a, b) => a[1] - b[1]);
          abstract = words.map(([w]) => w).join(" ").slice(0, 300);
        }
        return {
          id: p.id as string,
          title: (p.title as string) ?? "Untitled",
          authors: ((p.authorships as { author: { display_name: string } }[]) ?? []).slice(0, 4).map(a => a.author.display_name),
          year: p.publication_year as number | null,
          doi: (p.doi as string | null)?.replace("https://doi.org/", "") ?? null,
          url: (p.doi as string) ?? (p.id as string),
          source: (p.primary_location as { source?: { display_name?: string } } | null)?.source?.display_name ?? "OpenAlex",
          abstract,
          citationCount: p.cited_by_count as number | null,
        };
      });

      // Filter by year
      const yearFiltered = year === "Any year" ? results :
        year === "2024-2025" ? results.filter(p => p.year && p.year >= 2024) :
        year === "2020-2024" ? results.filter(p => p.year && p.year >= 2020 && p.year < 2024) :
        year === "2015-2020" ? results.filter(p => p.year && p.year >= 2015 && p.year < 2020) :
        results.filter(p => p.year && p.year < 2015);

      setPapers(yearFiltered);
    } catch { setPapers([]); }
    finally { setLoading(false); }
  }, [query, field, year]);

  const savePaper = async (paper: Paper) => {
    try {
      await fetch("/api/gap-simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: paper.doi ? `https://doi.org/${paper.doi}` : paper.url }),
      });
      toast("Paper saved to library!");
    } catch { toast("Could not save paper", "error"); }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <AppNav />
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Browse Papers</h1>
              <p className="text-sm text-[rgb(var(--muted))]">Search 250M+ academic papers and save them to your library.</p>
            </div>
          </div>

          <div className="card p-4 mb-6 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
                <input value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && search()}
                  placeholder="Search papers by topic, title, or author..."
                  className="input pl-9 w-full" aria-label="Search papers" />
              </div>
              <button onClick={() => search()} disabled={!query.trim() || loading} className="btn-primary flex items-center gap-2 flex-shrink-0">
                {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {FIELDS.map(f => (
                  <button key={f} onClick={() => setField(f)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${field === f ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-blue-500/30"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <select value={year} onChange={e => setYear(e.target.value)} className="input text-xs py-1 ml-auto" aria-label="Year filter">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {loading && <div className="flex justify-center py-16"><Loader size={24} className="text-blue-400 animate-spin" /></div>}

          {!loading && searched && papers.length === 0 && (
            <div className="card p-12 text-center"><p className="text-[rgb(var(--muted))] text-sm">No papers found. Try a different search term.</p></div>
          )}

          {!loading && papers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[rgb(var(--muted))] mb-4">{papers.length} papers found</p>
              {papers.map((paper, i) => (
                <motion.div key={paper.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="card p-5 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">{paper.source}</span>
                        {paper.year && <span className="text-xs text-[rgb(var(--muted))]">{paper.year}</span>}
                        {paper.citationCount !== null && <span className="text-xs text-[rgb(var(--muted))]">{paper.citationCount.toLocaleString()} citations</span>}
                      </div>
                      <h3 className="font-semibold text-[rgb(var(--fg))] text-sm leading-snug mb-1">{paper.title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))] mb-2">{paper.authors.join(", ")}{paper.authors.length >= 4 ? " et al." : ""}</p>
                      {paper.abstract && <p className="text-xs text-[rgb(var(--muted))]/70 line-clamp-2 leading-relaxed">{paper.abstract}...</p>}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <a href={paper.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-blue-400 transition-colors" aria-label="Open paper">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => savePaper(paper)}
                        className="p-1.5 rounded-lg text-[rgb(var(--muted))] hover:text-violet-400 transition-colors" aria-label="Save paper">
                        <Bookmark size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!searched && !loading && (
            <div className="card p-16 text-center border-dashed">
              <BookOpen size={36} className="text-blue-400/40 mx-auto mb-4" />
              <p className="font-semibold text-[rgb(var(--fg))] mb-2">Search 250M+ academic papers</p>
              <p className="text-sm text-[rgb(var(--muted))]">Powered by OpenAlex — the world's largest open academic database</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
