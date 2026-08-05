# GapForge — Research Intelligence Platform

GapForge combines three tools for researchers: **Gap AI** (on-demand gap detection), **Gap Drops** (weekly personalized digests), and **GapSimplify** (plain-language paper translation), plus premium features for teams and institutions.

---

## Setup

### Prerequisites

- Node.js 20+ (tested on v24)
- npm 10+
- Windows — all commands below use PowerShell

### Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```powershell
Copy-Item .env.example .env.local
```

Required variables:

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | NextAuth secret — generate with `openssl rand -base64 32` |
| `AUTH_URL` | Your deployed URL (e.g. `https://gapforge.vercel.app`) |
| `AUTH_TRUST_HOST` | Set to `true` for Vercel deployments |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth app credentials |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth app credentials (must be **Published**, not just Testing) |
| `DATABASE_URL` | Neon Postgres connection string |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Upstash Redis for rate limiting |
| `ANTHROPIC_API_KEY` | Claude API key (primary LLM) |
| `RESEND_API_KEY` | Email sending via Resend |
| `PAYSTACK_SECRET_KEY` | Paystack payments (Ghana/West Africa) |
| `CRON_SECRET` | Secret for authorizing Vercel Cron requests |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

Optional (enable more sources):

| Variable | Purpose |
|---|---|
| `CORE_API_KEY` | Free key from [core.ac.uk/services/api](https://core.ac.uk/services/api) |
| `NASA_ADS_TOKEN` | Free token from [ui.adsabs.harvard.edu](https://ui.adsabs.harvard.edu/user/settings/token) |

### Database setup

Run the schema against your Neon Postgres instance:

```powershell
# Using psql (install from PostgreSQL)
psql $env:DATABASE_URL -f lib/db/schema.sql
```

Or paste `lib/db/schema.sql` contents directly into the Neon SQL editor.

### Local development

```powershell
npm run dev
```

### Build

```powershell
npm run build
```

---

## Source Reliability Architecture

GapForge does not claim a fixed source count. Every query goes through a health-check layer before any papers are fetched:

### How it works

1. **Source registry** (`lib/sources/registry.ts`) holds all academic source modules. Each implements two methods: `healthCheck()` and `search()`.

2. **Before every query**, all sources are health-checked. Results are cached for 5 minutes (TTL configurable). A source that fails its health check is excluded from that query, logged server-side, and reported in the "Sources checked" indicator shown to the user.

3. **The UI shows the actual sources queried** — not a static "43+ sources" claim. Users see which sources responded and which were skipped.

4. **Citations are verified** after Claude returns gaps. Every cited paper must exist in the actual results set before being included. Papers not found in the result set are dropped — never fabricated.

### Source tiers

| Tier | Sources | Notes |
|---|---|---|
| High reliability | Semantic Scholar, arXiv, PubMed, OpenAlex, Crossref, CORE, bioRxiv/medRxiv, DOAJ | Free APIs, well-documented, consistently available |
| Medium reliability | NASA ADS | Requires free API token (`NASA_ADS_TOKEN`) |

### Honest accuracy framing

Gap detection surfaces **candidate gaps for the researcher's own judgment**. Relevance scores (1-10) are computed from a transparent formula:

- Citation impact of supporting papers (log scale, 0-4 points)
- Recency of supporting papers (0-3 points)
- Evidence breadth — number of supporting papers (0-2 points)
- Directness hint from Claude (0-1 points)

This is not a benchmark claim. It is an explainable signal to help researchers prioritize which gaps to investigate further.

---

## Features

### Gap AI
On-demand gap detection across all currently-healthy sources. Six gap categories: contradictions, missing mechanistic links, unexplored method transfers, population blind spots, untouched dataset opportunities, translational bottlenecks.

### Gap Drops
Weekly personalized research digest, generated every Friday at 09:00 UTC via Vercel Cron. Includes: 3 research gaps, startup opportunities, emerging trends, funding opportunities, cross-disciplinary transfers. All content is derived from real source queries scoped to the user's research profile — not templated filler.

### GapSimplify
Enter a DOI, arXiv ID, or Semantic Scholar URL. Get: plain-language section translations with hover/click glossary, key claims rated by evidence strength (strong/moderate/weak/speculative), surfaced gaps within that paper.

### Premium features

| Feature | Plan |
|---|---|
| Gap Drops (personalized) | Pro, Team, Institutional |
| Literature review compiler | Pro, Team, Institutional |
| Zotero / Mendeley export | Pro, Team, Institutional |
| BibTeX / RIS export | Pro, Team, Institutional |
| Team workspaces | Team, Institutional |
| Institutional API (`/api/v1/`) | Institutional |

---

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel project settings
4. Set `AUTH_URL` to your Vercel deployment URL
5. Set `AUTH_TRUST_HOST=true`
6. Vercel Cron is configured in `vercel.json` — runs `/api/cron/gap-drops` every Friday at 09:00 UTC

### Google OAuth note
Google OAuth must be **Published** (not just in Testing mode) for non-developer users to sign in. Set this in the Google Cloud Console under OAuth consent screen.

---

## Institutional API

`POST /api/v1/gaps` — Gap detection  
`POST /api/v1/simplify` — Paper simplification

Authentication: `Authorization: Bearer YOUR_API_KEY`

Rate limits: 100 requests/hour (gaps), 50/hour (simplify)

Requires institutional, team, or pro plan.

---

## What to check after deployment

1. **Source health** — hit `/api/sources/health` and check how many sources are actually healthy. This honest count matters more than the aspirational maximum.

2. **Citation verification** — run a Gap AI query on a topic you know well and manually verify at least one cited paper says what the gap description claims.

3. **Gap Drop personalization** — trigger a drop via `POST /api/gap-drops` and confirm the content reflects your research profile keywords, not generic output.

4. **Reference export** — save a gap, go to Library, add it to a lit review, compile it, and export as BibTeX. Verify the export is correct.

5. **Cron scheduling** — after deploying, check Vercel's Cron dashboard to confirm the Friday schedule is registered and running.

---

## Project structure

```
gapforge/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── login/                      # Auth page
│   ├── onboarding/                 # Research profile setup
│   ├── gap-ai/                     # Gap AI search UI
│   ├── gap-drops/                  # Weekly drops UI
│   ├── gap-simplify/               # Paper simplification UI
│   ├── workspaces/                 # Team workspace UI
│   ├── library/                    # Saved items + lit reviews
│   ├── pricing/                    # Pricing page
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth v5 handlers
│       ├── gap-ai/                 # Search + save endpoints
│       ├── gap-drops/              # Drop retrieval + manual trigger
│       ├── gap-simplify/           # Paper simplification endpoint
│       ├── onboarding/             # Research profile CRUD
│       ├── workspaces/             # Workspace CRUD
│       ├── lit-review/             # Literature review compiler
│       ├── payments/paystack/      # Paystack payment + webhook
│       ├── sources/health/         # Source health check endpoint
│       ├── cron/gap-drops/         # Vercel Cron job handler
│       └── v1/                     # Institutional API
├── lib/
│   ├── db/                         # Neon Postgres client + schema
│   ├── sources/                    # Source registry + individual modules
│   ├── gapAI/                      # Orchestrator + gap detection
│   ├── gapDrops/                   # Weekly drop generation
│   ├── gapSimplify/                # Paper fetch + simplification
│   ├── litReview/                  # Literature review compiler
│   ├── integrations/               # Zotero, Mendeley, BibTeX, RIS
│   ├── email/                      # Resend email notifications
│   └── utils.ts                    # Shared utilities
├── components/                     # Shared React components
├── vercel.json                     # Cron schedule
├── .env.example                    # Environment variable template
└── README.md
```

---

## Tech stack

- **Framework**: Next.js 16 (App Router), TypeScript
- **Auth**: NextAuth v5 — GitHub + Google OAuth
- **Database**: Neon Postgres (serverless)
- **Cache / Rate limiting**: Upstash Redis
- **LLM**: Anthropic Claude (primary)
- **Email**: Resend
- **Payments**: Paystack (USD, Ghana/West Africa)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Deploy**: Vercel (single platform — no separate backend)
