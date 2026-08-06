<div align="center">

<img src="public/icon.svg" width="80" height="80" alt="GapForge Logo" />

# GapForge

### Research Intelligence Platform

**Find the research gaps nobody is exploring yet.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-gapforge--self.vercel.app-7c3aed?style=for-the-badge)](https://gapforge-self.vercel.app)

</div>

---

## What is GapForge?

GapForge is a research intelligence platform that scans thousands of live academic papers and surfaces **genuine, evidence-backed research gaps** — with citations you can verify. No hallucinated references. No inflated accuracy claims. Just real gaps, honest scores, and tools to turn discoveries into action.

Built for researchers, academics, PhD students, and research-driven professionals who want to stay ahead of the literature without spending hours on manual search.

---

## Core Features

### Gap AI
Search any research topic. GapForge queries Semantic Scholar, arXiv, PubMed, OpenAlex, Crossref, bioRxiv, DOAJ and more in parallel — then uses AI to identify genuine candidate gaps, each with:
- **Confidence / Novelty / Feasibility** scores
- **What's Missing** — specific evidence from real papers
- **Why It Matters** — real-world impact
- **Suggested Direction** — actionable research recommendation
- **Gap aging** — how long the gap has been open
- **Difficulty rating** — Easy / Moderate / Hard / Moonshot

### Gap Drops
A personalized weekly research intelligence digest, generated every Friday from your research profile. Includes:
- 3 verified research gaps scoped to your niche
- Startup and commercialization opportunities
- Emerging trends from this week's literature
- Funding opportunities
- Cross-disciplinary transfer ideas

### GapSimplify
Paste a DOI, arXiv ID, or upload a PDF. Get:
- Plain-language section translations (for 4 audience types)
- Key claims rated by evidence strength (Strong / Moderate / Weak / Speculative)
- Interactive glossary with hover definitions
- Gaps surfaced within that specific paper

### Gap Actions (on every gap card)
| Button | What it does |
|---|---|
| Draft Proposal | Full 9-section research proposal with methodology, timeline, references |
| Simplify | Plain-language explanation for any audience |
| Ask AI | Chat with an AI research assistant about the gap |
| Hypotheses | 4 testable H1 statements with method and testability rating |
| Validate | Checks if the gap has been filled by recent papers |
| Grant | NIH / NSF / EU Horizon / General grant proposal draft |
| Why Now? | Timing score + reasons why this is the right moment |
| Funding | Real grant programs that fund this type of research |
| Export | Obsidian .md, Notion .md, BibTeX, RIS, APA, MLA, Chicago |
| Track | Add to My Issues Kanban board |

### Systematic Review Generator
Enter a topic. Get a PRISMA-style structured review with consensus areas, contradictions, research gaps, and recommendations — instantly.

### My Issues
A Kanban board for tracking gaps through your research workflow: Investigating → In Progress → Completed → Published.

### Research Question Bank
A public, searchable database of all community-identified gaps. Browse by category, search by keyword, upvote the best ones.

### Leaderboard
Weekly rankings of top gap hunters, most-upvoted discoveries, and hottest research niches.

### Daily Challenge
A new research topic every day. Find a gap, share it, compete on the leaderboard.

---

## Premium Features

| Feature | Free | Starter ($10) | Pro ($20) | Team ($40) |
|---|:---:|:---:|:---:|:---:|
| Gap AI searches/month | 10 | 50 | 500 | Unlimited |
| Gap Drops (personalized) | — | ✓ | ✓ | ✓ |
| PDF upload in GapSimplify | — | ✓ | ✓ | ✓ |
| Literature review compiler | — | — | ✓ | ✓ |
| AI Research Assistant | — | — | ✓ | ✓ |
| Team workspaces | — | — | — | ✓ |
| Institutional API access | — | — | — | ✓ |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v3, Framer Motion |
| Auth | NextAuth v4 — GitHub + Google OAuth |
| Database | Neon Postgres (serverless) |
| Cache / Rate limiting | Upstash Redis |
| LLM | Google Gemini 1.5 Flash (primary), Groq llama (fallback) |
| Email | Resend |
| Payments | Flutterwave (cards + MTN MoMo) |
| Cron Jobs | Vercel Cron |
| Deployment | Vercel |

## Academic Sources

GapForge queries up to **9 academic sources** with real-time health checks:

| Source | Coverage | Reliability |
|---|---|---|
| Semantic Scholar | 200M+ papers | High |
| arXiv | Physics, CS, Math, Bio | High |
| PubMed / MEDLINE | 36M+ biomedical citations | High |
| OpenAlex | 250M+ works | High |
| Crossref | 150M+ scholarly records | High |
| CORE | 200M+ open access papers | High |
| bioRxiv / medRxiv | Biology & health preprints | High |
| DOAJ | Peer-reviewed open access | High |
| NASA ADS | Astronomy & astrophysics | Medium |

Every source is health-checked before each query. If a source is down, it's skipped silently and the user sees exactly which sources were queried — never a static inflated count.

---

## Source Reliability Architecture

GapForge is built around an honest source reliability model:

1. **Source registry** — each source is a self-contained module with `healthCheck()` and `search()` methods
2. **Pre-query health checks** — cached for 30 minutes, checked before every search
3. **Citation verification** — every cited paper must exist in the actual query results before being included in a gap — zero hallucinated citations
4. **Transparent scoring** — relevance scores are computed from citation count, recency, and evidence breadth — not raw LLM guesses
5. **Honest framing** — gaps are "candidate gaps for the researcher's own judgment", not algorithmic certainties

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Setup

```bash
git clone https://github.com/Eddiegah/gapforge.git
cd gapforge
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

### Environment Variables

See `.env.example` for the full list. Key variables:

```env
AUTH_SECRET=          # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=      # Same value as AUTH_SECRET
DATABASE_URL=         # Neon Postgres connection string
GEMINI_API_KEY=       # Free at aistudio.google.com/app/apikey
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=       # Free at resend.com
```

### Database Setup

```bash
# Run the schema against your Neon Postgres instance
psql $DATABASE_URL -f lib/db/schema.sql
```

---

## Deployment

GapForge deploys entirely to Vercel — no separate backend required.

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add environment variables
4. Deploy

Vercel Cron is configured in `vercel.json`:
- Friday 9am UTC — Gap Drops generation
- Monday 8am UTC — Gap Alerts check
- Monday 7am UTC — Weekly email digest

---

## API Access (Institutional)

Programmatic access via REST API for institutional customers.

```bash
# Gap detection
curl -X POST https://gapforge-self.vercel.app/api/v1/gaps \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "CRISPR off-target effects", "maxGaps": 5}'

# Paper simplification
curl -X POST https://gapforge-self.vercel.app/api/v1/simplify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "10.1038/s41586-023-06936-3"}'
```

Full docs at [gapforge-self.vercel.app/docs](https://gapforge-self.vercel.app/docs)

---

## Project Structure

```
gapforge/
├── app/
│   ├── gap-ai/              # Gap AI search interface (3-panel layout)
│   ├── gap-drops/           # Weekly intelligence digest
│   ├── gap-simplify/        # Paper simplification + PDF upload
│   ├── systematic-review/   # PRISMA-style review generator
│   ├── issues/              # My Issues Kanban tracker
│   ├── compare/             # Side-by-side gap comparison
│   ├── leaderboard/         # Community rankings
│   ├── daily-challenge/     # Daily research challenge
│   ├── question-bank/       # Public gap database
│   ├── trending/            # Most upvoted gaps
│   ├── niche-map/           # Coming soon — visual research map
│   ├── docs/                # API documentation
│   └── api/                 # All backend logic
├── lib/
│   ├── sources/             # 9 academic source modules + registry
│   ├── gapAI/               # Orchestrator + gap detection
│   ├── gapDrops/            # Weekly drop generation
│   ├── gapSimplify/         # Paper fetch + simplification
│   ├── litReview/           # Literature review compiler
│   ├── llm/                 # Gemini/Groq LLM client with fallback
│   ├── citations/           # Citation export (APA, MLA, BibTeX, RIS, Obsidian)
│   └── db/                  # Neon Postgres client + schema
└── components/
    ├── gap-card.tsx          # Rich gap card with all action buttons
    ├── markdown-content.tsx  # Markdown renderer (no asterisks)
    ├── pro-gate.tsx          # Feature gating with upgrade prompt
    └── onboarding-tour.tsx   # First-time user walkthrough
```

---

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with a clear message
4. Open a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contact

Built in Ghana by [Edmund Eric Gah](mailto:gahedmund146@gmail.com)

- Live app: [gapforge-self.vercel.app](https://gapforge-self.vercel.app)
- GitHub: [github.com/Eddiegah/gapforge](https://github.com/Eddiegah/gapforge)
- Email: gahedmund146@gmail.com

---

<div align="center">

**GapForge** — Research Intelligence Platform

*Find the gaps nobody is exploring yet.*

</div>
