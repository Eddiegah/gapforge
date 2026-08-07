-- GapForge Database Schema
-- Run this on your Neon Postgres database

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  image         TEXT,
  plan          TEXT NOT NULL DEFAULT 'free',  -- free | pro | team | institutional
  stripe_customer_id TEXT,
  paystack_customer_code TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NextAuth accounts
CREATE TABLE IF NOT EXISTS accounts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  provider_account_id  TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           INTEGER,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,
  UNIQUE(provider, provider_account_id)
);

-- NextAuth sessions
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT UNIQUE NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

-- NextAuth verification tokens
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- ─── Onboarding / Research Profile ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS research_profiles (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id          TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  research_areas   TEXT[] NOT NULL DEFAULT '{}',
  methodologies    TEXT[] NOT NULL DEFAULT '{}',
  career_stage     TEXT,         -- undergrad | phd | postdoc | faculty | industry | independent
  disciplines      TEXT[] NOT NULL DEFAULT '{}',
  keywords         TEXT[] NOT NULL DEFAULT '{}',
  goals            TEXT[],       -- gap-finding | staying-current | literature-review | collaboration
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Gap AI ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gap_searches (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  query           TEXT NOT NULL,
  sources_queried TEXT[] NOT NULL DEFAULT '{}',
  sources_skipped TEXT[] NOT NULL DEFAULT '{}',
  papers_analyzed INTEGER NOT NULL DEFAULT 0,
  gaps_found      INTEGER NOT NULL DEFAULT 0,
  result_json     JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_gaps (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_id   TEXT REFERENCES gap_searches(id) ON DELETE SET NULL,
  gap_json    JSONB NOT NULL,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Gap Drops ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gap_drops (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_label      TEXT NOT NULL,   -- e.g. "2024-W47"
  gaps            JSONB NOT NULL,  -- array of DetectedGap
  startup_opps    JSONB NOT NULL DEFAULT '[]',
  trends          JSONB NOT NULL DEFAULT '[]',
  funding_opps    JSONB NOT NULL DEFAULT '[]',
  cross_discipline JSONB NOT NULL DEFAULT '[]',
  sources_queried TEXT[] NOT NULL DEFAULT '{}',
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified_at     TIMESTAMPTZ,
  UNIQUE(user_id, week_label)
);

-- ─── GapSimplify ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS simplified_papers (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  original_url    TEXT NOT NULL,
  doi             TEXT,
  title           TEXT NOT NULL,
  authors         TEXT[] DEFAULT '{}',
  year            INTEGER,
  source          TEXT,
  sections_json   JSONB NOT NULL,  -- array of SimplifiedSection
  glossary_json   JSONB NOT NULL DEFAULT '[]',
  gaps_json       JSONB NOT NULL DEFAULT '[]',
  claims_json     JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Workspaces ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workspaces (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL DEFAULT 'team',  -- team | institutional
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',  -- owner | admin | member
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS workspace_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  added_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  item_type     TEXT NOT NULL,  -- gap | paper
  item_json     JSONB NOT NULL,
  notes         TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_comments (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id     TEXT NOT NULL REFERENCES workspace_items(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Literature Reviews ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS literature_reviews (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  item_ids        TEXT[] DEFAULT '{}',  -- saved_gap ids or simplified_paper ids
  compiled_json   JSONB,
  export_format   TEXT,  -- docx | pdf | markdown
  last_compiled   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── API Keys (institutional) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    TEXT UNIQUE NOT NULL,  -- bcrypt hash of actual key
  key_prefix  TEXT NOT NULL,         -- first 8 chars for display
  name        TEXT NOT NULL,
  last_used   TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gap_searches_user ON gap_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_gaps_user ON saved_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_drops_user ON gap_drops(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_drops_week ON gap_drops(week_label);
CREATE INDEX IF NOT EXISTS idx_simplified_papers_user ON simplified_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_items_workspace ON workspace_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_literature_reviews_user ON literature_reviews(user_id);

-- ─── Credits ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_credits (
  user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_limit INTEGER NOT NULL DEFAULT 10,
  reset_at     TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + interval '1 month'),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Gap Alerts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gap_alerts (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_gap_id TEXT REFERENCES saved_gaps(id) ON DELETE CASCADE,
  gap_title    TEXT NOT NULL,
  gap_query    TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gap_alerts_user ON gap_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_gap_alerts_active ON gap_alerts(active);

-- ─── Referral System ────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_bonus_credits INTEGER NOT NULL DEFAULT 0;

-- ─── Gap Votes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gap_votes (
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_gap_id  TEXT NOT NULL REFERENCES saved_gaps(id) ON DELETE CASCADE,
  direction     TEXT NOT NULL CHECK (direction IN ('up', 'down')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, saved_gap_id)
);
CREATE INDEX IF NOT EXISTS idx_gap_votes_gap ON gap_votes(saved_gap_id);

-- ─── Research Issues (My Issues tracker) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_issues (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gap_id      TEXT REFERENCES saved_gaps(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'in_progress', 'completed', 'published')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_research_issues_user ON research_issues(user_id);

-- ─── Notification Preferences ───────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"weeklyDigest":true,"gapAlerts":true,"dropNotifications":true,"upgradeNudges":true}'::jsonb;

-- ─── Streak tracking ─────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_search_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;

-- ─── Waitlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email      TEXT NOT NULL,
  feature    TEXT NOT NULL DEFAULT 'niche-map',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Badges ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);
