# GapForge — AI Research Gap Detection Platform

> **Find genuine research gaps before anyone else. 250M+ papers. 10+ live databases. 95+ research tools.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gapforge--self.vercel.app-7c3aed?style=for-the-badge)](https://gapforge-self.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%2016%20%7C%20GPT--4o%20%7C%20Neon-0f0f23?style=for-the-badge)](https://gapforge-self.vercel.app)
[![Payments](https://img.shields.io/badge/Payments-Paystack%20%7C%20Flutterwave%20GHS-059669?style=for-the-badge)](https://paystack.com)

---

## What is GapForge?

GapForge is a full-stack research intelligence platform that scans millions of live academic papers across 10+ databases simultaneously and surfaces **genuine, evidence-backed research gaps** with real citations — not hallucinated references.

Built for PhD students, faculty, independent researchers, and institutions who need to know **what hasn't been studied yet** before they invest years of work.

---

## The Problem It Solves

Most researchers spend 6–18 months doing manual literature reviews before identifying a viable research direction. They miss gaps hidden in non-English literature, multi-database intersections, and cross-disciplinary zones. GapForge reduces this to minutes.

---

## Core Features

### Gap AI (The Core Engine)
- Queries **Semantic Scholar, arXiv, PubMed, OpenAlex, Crossref, CORE, bioRxiv, DOAJ, NASA ADS** in parallel
- Azure OpenAI GPT-4o detects 6 gap types: Contradictions, Missing Mechanistic Links, Method Transfers, Population Blind Spots, Dataset Opportunities, Translational Bottlenecks
- Every gap ranked by relevance, confidence, novelty, and feasibility — all backed by real papers
- Fallback chain: Azure OpenAI → Groq → Gemini → OpenAI → Claude (zero downtime)

### Research Writing Suite
| Tool | What it does |
|---|---|
| Paper Writer | Full IMRaD research paper, section by section |
| Grant Writer | NIH R01, NSF, EU Horizon, Wellcome Trust formats |
| Abstract Writer | 4 styles, APA/IEEE/narrative |
| Peer Review AI | Simulated review with scores, verdict, revision suggestions |
| Policy Brief | 8-section policy document for government/NGOs |
| AI Writer | Full papers by section with tone control |
| Writing Assistant | Improve, formalize, shorten, expand any text |
| Paraphraser | 6 tone modes while preserving academic meaning |

### Analysis Tools
- **GapSimplify** — DOI/arXiv/PDF → plain language + evidence-rated claims + interactive glossary
- **PDF Chat** — conversational Q&A on any paper
- **Paper Comparator** — side-by-side comparison with contradiction detection
- **AI Detector** — checks if academic text was written by AI
- **Citation Verifier** — checks if your references actually exist
- **Citation Booster** — finds best papers to support your claims
- **Systematic Review** — PRISMA-style review from live literature

### Discovery Tools
- **Gap Radar** — SVG bubble visualization of gap landscape
- **Niche Map** — interactive research field relationship map
- **Literature Map** — citation network visualization
- **Citation Graph** — interactive citation relationship explorer
- **Gap Freshness** — checks if a gap is still unstudied (real-time)
- **Gap Score Card** — pursue/skip verdict with full metrics
- **Hypothesis Designer** — complete experimental design from a gap
- **Research Ideas** — 8 novel, fundable research project ideas
- **Multilingual Search** — 6 languages (French, Spanish, Portuguese, Arabic, Chinese, German)

### Personal Research Tools
- **Notebook** — rich text notes linked to gaps and papers
- **AI Chat** — persistent research-focused AI assistant with memory
- **Research Planner** — goal tracking with milestones and deadlines
- **Research Calendar** — deadline and milestone management
- **Research Timeline** — document your research journey
- **Gap Alerts** — weekly email when new papers address your saved gaps
- **Analytics** — complete activity dashboard

### Community
- **Feed** — gap activity from researchers you follow
- **Leaderboard** — top gap hunters and hottest niches
- **Gap Battle** — vote on which gap deserves more attention
- **Challenges** — weekly and monthly themed gap-finding challenges
- **Claim a Gap** — publicly declare you're working on a gap
- **Collaboration Matchmaking** — find researchers with complementary expertise

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Neon Postgres (serverless) |
| Cache / Rate Limits | Upstash Redis |
| Auth | NextAuth v4 (Google + GitHub OAuth) |
| Primary LLM | Azure OpenAI GPT-4o (Microsoft for Startups — $1,000 credits) |
| LLM Fallbacks | Groq (Llama 3.1) → Gemini 1.5 Flash → OpenAI → Claude |
| Email | Resend |
| Payments | Paystack + Flutterwave (GHS — Ghana Cedis) |
| Deployment | Vercel (Edge + Serverless Functions) |
| Cron Jobs | Vercel Cron (5 scheduled jobs) |
| Styling | Tailwind CSS + custom design system |
| Animations | Framer Motion |

---

## Academic Sources Integrated

```
Semantic Scholar   arXiv         PubMed        OpenAlex
Crossref           CORE          bioRxiv       DOAJ
NASA ADS           (+more via orchestrator)
```

Each source is health-checked before every query. Only healthy sources are queried. Source status shown in real time to users.

---

## Architecture Highlights

### LLM Reliability Chain
```
Azure OpenAI GPT-4o (primary — no quota limits)
    ↓ if unavailable
Groq Llama 3.1 70B (fast free fallback)
    ↓ if quota hit
Gemini 1.5 Flash (multiple model fallbacks)
    ↓ if unavailable
OpenAI GPT-4o-mini
    ↓ last resort
Claude Haiku
```

### Gap Detection Pipeline
```
User query → Query expansion (4 sub-queries)
    → Parallel source fetching (10+ databases)
    → Paper deduplication + relevance scoring
    → GPT-4o gap synthesis
    → 6-category classification
    → Scoring (confidence, novelty, feasibility)
    → Real citation attachment
    → Result returned to user
```

### Security
- Security headers on all responses (X-Frame-Options, HSTS, CSP)
- Upstash Redis rate limiting (10 searches/hour per user)
- Input sanitization + prompt injection stripping
- Bot blocking (sqlmap, nikto, nessus)
- 1MB payload limit on all routes (except uploads)
- HMAC webhook signature verification (Paystack)

---

## Database Schema

Full normalized PostgreSQL schema with:
- Users, accounts, sessions (NextAuth)
- Research profiles, keywords, disciplines
- Gap searches, saved gaps, gap votes
- Gap drops (weekly digests), gap alerts
- Simplified papers, literature reviews
- Workspaces, workspace members, items, comments
- Notebook entries, research issues, goals
- Research calendar, timeline
- AI conversations, messages
- User badges, follows, referrals
- Claimed gaps, read-later queue
- API keys (hashed)

---

## Automated Cron Jobs

| Schedule | Job | What it does |
|---|---|---|
| Every Friday 9am UTC | Gap Drops | Generates personalized weekly digests for all users |
| Every Monday 8am UTC | Gap Alerts | Scans literature for new papers matching saved gaps |
| Every Monday 7am UTC | Weekly Digest | Sends email recap to active users |
| Every Tuesday 10am UTC | Streak Nudge | Motivates users approaching streak breaks |
| Every Monday 8am UTC | Personal Digest | Personalized stats + feature spotlight email |

---

## Pricing (Ghana Cedis)

| Plan | Price | Searches |
|---|---|---|
| Free | GHS 0 | 10/month |
| Starter | GHS 118/month | 50/month |
| Pro | GHS 236/month | 500/month |
| Team | GHS 472/month | Unlimited |

Payments via Paystack and Flutterwave (cards, mobile money, bank transfer).

---

## Getting Started

### Prerequisites
- Node.js 18+
- Neon Postgres database
- Upstash Redis instance
- Azure OpenAI (or at least one LLM API key)

### Setup

```bash
git clone https://github.com/Eddiegah/gapforge
cd gapforge
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

### Environment Variables

See `.env.example` for the full list. Required:

```env
AUTH_SECRET=                    # NextAuth secret
GOOGLE_CLIENT_ID=               # Google OAuth
GOOGLE_CLIENT_SECRET=           
DATABASE_URL=                   # Neon Postgres
UPSTASH_REDIS_REST_URL=         # Upstash Redis
UPSTASH_REDIS_REST_TOKEN=       
AZURE_OPENAI_API_KEY=           # Primary LLM
AZURE_OPENAI_ENDPOINT=          
RESEND_API_KEY=                 # Email
PAYSTACK_SECRET_KEY=            # Payments
NEXT_PUBLIC_APP_URL=            # Your domain
CRON_SECRET=                    # Cron security
```

### Database Setup

```bash
# Run the full schema against your Neon database
psql $DATABASE_URL < lib/db/schema.sql
```

---

## API (Institutional Access)

GapForge exposes a REST API for institutional and Pro+ users:

```
POST /api/v1/gaps      — Search for research gaps
POST /api/v1/simplify  — Simplify a paper by DOI/URL
```

Full documentation at `/docs`.

---

## Project Structure

```
gapforge/
├── app/
│   ├── api/          # 126 API route handlers
│   ├── gap-ai/       # Core gap search interface
│   ├── paper-writer/ # Full paper generation
│   ├── grant-writer/ # Grant proposal generation
│   └── ...           # 90+ feature pages
├── components/       # Shared UI components
├── lib/
│   ├── gapAI/        # Gap detection engine
│   ├── gapSimplify/  # Paper simplification
│   ├── sources/      # 9 academic source adapters
│   ├── llm/          # Multi-provider LLM client
│   ├── email/        # Email templates
│   ├── citations/    # Citation export (APA, BibTeX, RIS...)
│   └── security/     # Rate limiting, sanitization
└── lib/db/schema.sql # Full database schema
```

---

## Acknowledgments

Built with Microsoft for Startups Azure credits ($1,000). Academic data from Semantic Scholar, OpenAlex, arXiv, PubMed, and other open academic APIs.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*GapForge — Built in Ghana. For researchers everywhere.*
