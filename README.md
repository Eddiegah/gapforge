<div align="center">

<!-- Logo SVG rendered inline -->
<svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gf-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="40" height="40" rx="10" fill="url(#gf-bg)"/>
  <circle cx="17" cy="17" r="7.5" stroke="white" stroke-width="2.5" fill="none" stroke-opacity="0.95"/>
  <path d="M22.5 11.5 L24.5 9.5" stroke="#6d28d9" stroke-width="3" stroke-linecap="round"/>
  <line x1="22.5" y1="22.5" x2="29" y2="29" stroke="white" stroke-width="2.8" stroke-linecap="round" stroke-opacity="0.95"/>
  <path d="M26 10 L23.5 15 L26.5 15 L24 20" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9" fill="none"/>
</svg>

# GapForge

### *Find what nobody has studied. Before anyone else does.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-gapforge--self.vercel.app-7c3aed?style=for-the-badge&logoColor=white)](https://gapforge-self.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/Eddiegah/gapforge?style=for-the-badge&color=7c3aed)](https://github.com/Eddiegah/gapforge)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)

[![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-GPT--4o-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![Microsoft for Startups](https://img.shields.io/badge/Microsoft_for_Startups-Approved_$1K-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)](https://www.microsoft.com/en-us/startups)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)

<br/>

> **GapForge scans 250,000,000+ academic papers across 10+ live databases simultaneously**  
> **and tells you exactly what hasn't been studied yet — with real citations to prove it.**

<br/>

---

</div>

## The Problem

Researchers spend **6–18 months** doing manual literature reviews before they even know if their idea is worth pursuing. They miss gaps hidden across databases they never checked, in languages they don't read, at intersections of fields they never thought to combine.

**GapForge solves this in minutes.**

---

## What It Does

<table>
<tr>
<td width="50%">

### 🔍 Gap AI — The Core Engine
Enter any research topic. GapForge queries **9 live academic databases** in parallel, then uses **Azure GPT-4o** to synthesize genuine research gaps — ranked by confidence, novelty, and feasibility, each backed by real verifiable citations.

**No hallucinated references. Ever.**

</td>
<td width="50%">

### 📬 Gap Drops
Every Friday at 9am, researchers receive a personalized weekly intelligence digest — gaps, startup opportunities, emerging trends, funding prospects, and cross-disciplinary opportunities — scoped to their exact research niche.

</td>
</tr>
<tr>
<td width="50%">

### ✍️ Research Writing Suite
Generate complete grant proposals (NIH R01, NSF, EU Horizon), full research papers section by section, peer review simulations, policy briefs, abstracts, and systematic reviews — all from a single gap.

</td>
<td width="50%">

### 📖 GapSimplify
Paste any DOI, arXiv ID, or upload a PDF. Get section-by-section plain-language summaries, evidence-rated claims, an interactive glossary, and the gaps that paper opens — in one click.

</td>
</tr>
</table>

---

## Feature Scope

<div align="center">

| Category | Tools |
|---|---|
| **Gap Discovery** | Gap AI, Gap Radar, Gap Freshness, Gap Score Card, Niche Map, Literature Map, Multilingual Search (6 languages) |
| **Research Writing** | Paper Writer, Grant Writer, Abstract Writer, AI Writer, Policy Brief, Cover Letter, Paraphraser, Writing Assistant |
| **Analysis** | GapSimplify, PDF Chat, Peer Review AI, Citation Verifier, Citation Booster, AI Detector, Paper Comparator, Systematic Review |
| **Ideation** | Hypothesis Designer, Research Ideas, Research Questions, Conference Finder, Journal Finder, Gap to Startup, Gap to Tweet |
| **Personal Tools** | Notebook, AI Chat, Research Planner, Calendar, Timeline, Gap Alerts, Portfolio, Research CV, Analytics, Impact Score |
| **Community** | Feed, Leaderboard, Gap Battle, Challenges, Collab Matchmaking, Claim a Gap, Gap of the Day |

**95+ tools. 93 pages. 126 API routes. All production-ready.**

</div>

---

## How the Gap Engine Works

```
User query
    ↓
Query expansion → 4 targeted sub-queries
    ↓
Parallel fetch → Semantic Scholar + arXiv + PubMed + OpenAlex
                + Crossref + bioRxiv + CORE + DOAJ + NASA ADS
    ↓
Deduplication + relevance scoring
    ↓
Azure GPT-4o gap synthesis
    ↓
6-category classification:
  Contradiction · Missing Mechanistic Link · Unexplored Method Transfer
  Population Blind Spot · Dataset Opportunity · Translational Bottleneck
    ↓
Scoring: confidence % · novelty % · feasibility % · difficulty rating
    ↓
Real citations attached from retrieved papers
    ↓
Result delivered to user
```

---

## Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 — App Router, Server Components, Edge Functions |
| **Language** | TypeScript (strict mode, zero `any`) |
| **Database** | Neon Postgres (serverless, connection pooling) |
| **Cache / Rate Limiting** | Upstash Redis |
| **Auth** | NextAuth v4 — Google + GitHub OAuth |
| **Primary LLM** | Azure OpenAI GPT-4o *(Microsoft for Startups — $1,000 credits)* |
| **LLM Fallback Chain** | Groq Llama 3.1 70B → Gemini 1.5 Flash → OpenAI → Claude Haiku |
| **Email** | Resend |
| **Payments** | Paystack + Flutterwave *(GHS — Ghana Cedis, mobile money)* |
| **Deployment** | Vercel *(serverless + edge + 5 cron jobs)* |
| **Animations** | Framer Motion |
| **Styling** | Tailwind CSS + custom dark/light design system |

</div>

---

## Academic Sources

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Semantic Scholar   ·   arXiv   ·   PubMed   ·   OpenAlex    │
│                                                                 │
│      Crossref   ·   CORE   ·   bioRxiv   ·   DOAJ            │
│                                                                 │
│                      NASA ADS                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Every source is health-checked before each query. Only live sources are queried.  
Source status shown in real time. Zero silent failures.

</div>

---

## LLM Reliability Chain

```
Azure OpenAI GPT-4o     ← Primary (no daily quota, $1K credits)
        ↓ fail
Groq Llama 3.1 70B      ← Fast free fallback
        ↓ fail
Gemini 1.5 Flash        ← Multi-model quota failover
        ↓ fail
OpenAI GPT-4o-mini      ← Paid fallback
        ↓ fail
Claude Haiku            ← Last resort
```

Zero downtime. Users never see a dead AI.

---

## Automated Intelligence (Cron Jobs)

| Every | Job | What happens |
|---|---|---|
| Friday 9am UTC | **Gap Drops** | Personalized weekly digests generated for all users |
| Monday 8am UTC | **Gap Alerts** | Literature re-scanned for new papers matching saved gaps |
| Monday 7am UTC | **Weekly Digest** | Email recap sent to active researchers |
| Tuesday 10am UTC | **Streak Nudge** | Researchers approaching streak breaks get motivated |
| Monday 8am UTC | **Personal Digest** | Stats + feature spotlight delivered to inboxes |

---

## Pricing

Built for the Ghanaian research community — Paystack and Flutterwave, Ghana Cedis.

| Plan | Price | Searches/month |
|---|---|---|
| Free | GHS 0 | 10 |
| Starter | GHS 118 | 50 |
| Pro | GHS 236 | 500 |
| Team | GHS 472 | Unlimited |

---

## Quick Start

```bash
git clone https://github.com/Eddiegah/gapforge
cd gapforge
npm install
cp .env.example .env.local
# Add your API keys (see .env.example)
npm run dev
```

Then run the database schema:
```bash
psql $DATABASE_URL < lib/db/schema.sql
```

### Minimum required env vars:
```env
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DATABASE_URL=                 # Neon Postgres
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
AZURE_OPENAI_API_KEY=         # Or any one LLM key
AZURE_OPENAI_ENDPOINT=
RESEND_API_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

---

## Project Structure

```
gapforge/
├── app/
│   ├── api/              # 126 API route handlers
│   ├── gap-ai/           # Core gap search interface
│   ├── paper-writer/     # Full research paper generation
│   ├── grant-writer/     # NIH/NSF/EU grant proposals
│   └── ...               # 90+ more feature pages
├── components/           # Reusable UI components
├── lib/
│   ├── gapAI/            # Gap detection engine
│   ├── gapSimplify/      # Paper simplification pipeline
│   ├── sources/          # 9 academic database adapters
│   ├── llm/              # Multi-provider LLM client
│   ├── email/            # Transactional email templates
│   ├── citations/        # Citation export (APA, BibTeX, RIS, MLA)
│   ├── security/         # Rate limiting, input sanitization
│   └── export/           # PDF, Markdown, text export
└── lib/db/schema.sql     # Full normalized PostgreSQL schema
```

---

<div align="center">

## Built in Ghana. For researchers everywhere.

*Solo full-stack build — architecture, design, backend, frontend, payments, security, email automation, and deployment by one person.*

<br/>

[![Live Demo](https://img.shields.io/badge/Try_GapForge-gapforge--self.vercel.app-7c3aed?style=for-the-badge)](https://gapforge-self.vercel.app)

<br/>

*MIT License · © 2026 Edmund Gah*

</div>
