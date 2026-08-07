import Link from "next/link";
import { PublicNav } from "@/components/nav";
import { Grid3X3, BookOpen, Microscope, Users, Globe } from "lucide-react";

const TOPICS = ["Neuroscience", "Machine Learning", "Climate Change", "Genomics", "Drug Discovery", "Mental Health", "Quantum Computing", "Microbiome", "Cancer Research", "Aging", "Immunology", "Epidemiology", "Materials Science", "Ecology", "Behavioral Economics"];

const FIELDS = ["Biology", "Medicine", "Computer Science", "Physics", "Psychology", "Chemistry", "Economics", "Engineering", "Environmental Science", "Mathematics", "Sociology", "Philosophy"];

const JOURNALS = [
  { name: "Nature", field: "Multidisciplinary" },
  { name: "Science", field: "Multidisciplinary" },
  { name: "Cell", field: "Biology" },
  { name: "PNAS", field: "Multidisciplinary" },
  { name: "The Lancet", field: "Medicine" },
  { name: "NEJM", field: "Medicine" },
  { name: "JAMA", field: "Medicine" },
  { name: "PLOS ONE", field: "Open Access" },
  { name: "arXiv", field: "Preprints" },
  { name: "bioRxiv", field: "Biology Preprints" },
];

export default function DirectoriesPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-slate-500/20 flex items-center justify-center">
            <Grid3X3 size={18} className="text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Directories</h1>
            <p className="text-sm text-[rgb(var(--muted))]">Browse research gaps by topic, field, journal, or institution.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Topics */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Microscope size={16} className="text-violet-400" />
              <h2 className="font-semibold text-[rgb(var(--fg))]">Browse by Topic</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <Link key={t} href={`/question-bank?q=${encodeURIComponent(t)}`}
                  className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-violet-400 hover:border-violet-500/40 transition-all">
                  {t}
                </Link>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-teal-400" />
              <h2 className="font-semibold text-[rgb(var(--fg))]">Browse by Field</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map(f => (
                <Link key={f} href={`/question-bank?q=${encodeURIComponent(f)}`}
                  className="px-3 py-1.5 rounded-full border border-[rgb(var(--border))] text-sm text-[rgb(var(--muted))] hover:text-teal-400 hover:border-teal-500/40 transition-all">
                  {f}
                </Link>
              ))}
            </div>
          </div>

          {/* Journals */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-amber-400" />
              <h2 className="font-semibold text-[rgb(var(--fg))]">Top Journals</h2>
            </div>
            <div className="space-y-2">
              {JOURNALS.map(j => (
                <Link key={j.name} href={`/browse-papers?q=${encodeURIComponent(j.name)}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--border))] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                  <span className="text-sm font-medium text-[rgb(var(--fg))]">{j.name}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">{j.field}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Gap categories */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-rose-400" />
              <h2 className="font-semibold text-[rgb(var(--fg))]">Gap Categories</h2>
            </div>
            <div className="space-y-2">
              {[
                { label: "Contradictions", slug: "contradiction", color: "text-red-400" },
                { label: "Missing Mechanistic Links", slug: "missing-mechanistic-link", color: "text-amber-400" },
                { label: "Method Transfers", slug: "unexplored-method-transfer", color: "text-blue-400" },
                { label: "Population Blind Spots", slug: "population-blind-spot", color: "text-purple-400" },
                { label: "Dataset Opportunities", slug: "untouched-dataset-opportunity", color: "text-green-400" },
                { label: "Translational Bottlenecks", slug: "translational-bottleneck", color: "text-orange-400" },
              ].map(cat => (
                <Link key={cat.slug} href={`/gaps/${cat.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-[rgb(var(--border))] hover:border-violet-500/30 hover:bg-violet-500/5 transition-all">
                  <span className={`text-sm font-medium ${cat.color}`}>{cat.label}</span>
                  <span className="text-xs text-violet-400">Browse →</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
