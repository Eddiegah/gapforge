import { PublicNav } from "@/components/nav";
import Link from "next/link";
import { Key, Zap } from "lucide-react";

const BASE = "https://gapforge.app";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-24 md:pb-10">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-medium mb-4">
            <Zap size={12} /> Institutional API
          </div>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-2">API Documentation</h1>
          <p className="text-[rgb(var(--muted))] max-w-2xl">Programmatic access to Gap AI and GapSimplify for institutional and enterprise customers.</p>
        </div>

        {/* Auth */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3"><Key size={16} className="text-violet-400" /><h2 className="font-semibold text-[rgb(var(--fg))]">Authentication</h2></div>
          <p className="text-sm text-[rgb(var(--muted))] mb-3">All API requests require a Bearer token in the Authorization header. Get your API key from <Link href="/settings" className="text-violet-400 hover:underline">Settings → Security</Link>.</p>
          <pre className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg p-4 text-xs font-mono text-[rgb(var(--fg))] overflow-x-auto">
{`Authorization: Bearer gf_your_api_key_here`}
          </pre>
        </div>

        {/* Endpoints */}
        {[
          {
            method: "POST", path: "/api/v1/gaps", badge: "Team+",
            description: "Detect research gaps for a given query. Scans multiple academic sources and returns verified candidate gaps.",
            body: `{\n  "query": "CRISPR off-target effects",  // required\n  "maxGaps": 5                          // optional, 1-10\n}`,
            response: `{\n  "query": "string",\n  "gaps": [\n    {\n      "id": "string",\n      "title": "string",\n      "description": "string",\n      "category": "contradiction | missing-mechanistic-link | ...",\n      "relevanceScore": 8,\n      "confidence": 85,\n      "novelty": 90,\n      "feasibility": 70,\n      "suggestedDirection": "string",\n      "citations": [...]\n    }\n  ],\n  "meta": {\n    "sourcesQueried": ["semantic-scholar", "arxiv", ...],\n    "papersAnalyzed": 40\n  }\n}`,
            example: `curl -X POST ${BASE}/api/v1/gaps \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "CRISPR off-target effects", "maxGaps": 5}'`,
          },
          {
            method: "POST", path: "/api/v1/simplify", badge: "Pro+",
            description: "Simplify an academic paper by DOI, arXiv ID, or URL. Returns plain-language sections, glossary, key claims, and surfaced gaps.",
            body: `{\n  "input": "10.1038/s41586-023-06936-3"  // DOI, arXiv ID, or URL\n}`,
            response: `{\n  "paper": { "title": "string", "authors": [...], "year": 2024, "doi": "string" },\n  "sections": [{ "heading": "Abstract", "simplified": "string", "technicalTerms": [...] }],\n  "glossary": [{ "term": "string", "definition": "string" }],\n  "keyClaims": [{ "claim": "string", "evidenceRating": "strong | moderate | weak | speculative" }],\n  "gaps": [...]\n}`,
            example: `curl -X POST ${BASE}/api/v1/simplify \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": "10.1038/s41586-023-06936-3"}'`,
          },
        ].map(ep => (
          <div key={ep.path} className="card p-6 mb-4">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-violet-600 text-white">{ep.method}</span>
              <code className="text-sm font-mono text-[rgb(var(--fg))]">{ep.path}</code>
              <span className="text-xs text-amber-400 border border-amber-400/30 rounded-full px-2 py-0.5">{ep.badge}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))] mb-4">{ep.description}</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5">Request body</p>
                <pre className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg p-3 text-xs font-mono text-[rgb(var(--fg))] overflow-x-auto whitespace-pre">{ep.body}</pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5">Response</p>
                <pre className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg p-3 text-xs font-mono text-[rgb(var(--fg))] overflow-x-auto whitespace-pre">{ep.response}</pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-1.5">Example</p>
                <pre className="bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-lg p-3 text-xs font-mono text-violet-300 overflow-x-auto whitespace-pre">{ep.example}</pre>
              </div>
            </div>
          </div>
        ))}

        {/* Rate limits */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-[rgb(var(--fg))] mb-3">Rate Limits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[rgb(var(--border))]"><th className="text-left py-2 text-[rgb(var(--muted))] font-medium">Endpoint</th><th className="text-left py-2 text-[rgb(var(--muted))] font-medium">Limit</th></tr></thead>
              <tbody className="text-[rgb(var(--muted))]">
                <tr className="border-b border-[rgb(var(--border))]"><td className="py-2">/api/v1/gaps</td><td className="py-2">100 requests/hour</td></tr>
                <tr><td className="py-2">/api/v1/simplify</td><td className="py-2">50 requests/hour</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6 text-center">
          <h2 className="font-semibold text-[rgb(var(--fg))] mb-2">Get API access</h2>
          <p className="text-sm text-[rgb(var(--muted))] mb-4">API access is available on Team and Institutional plans.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/pricing" className="btn-primary text-sm">View plans</Link>
            <Link href="/settings" className="btn-secondary text-sm">Get API key</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
