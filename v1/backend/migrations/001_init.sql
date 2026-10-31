-- 001_init: users, sessions, rich profiles, skill growth timeline, contributions, resources, cache.
-- Requires PostgreSQL 13+ (gen_random_uuid is built in).

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  password_hash   text NOT NULL,
  display_name    text NOT NULL,
  handle          text NOT NULL,                 -- public URL handle, e.g. /api/u/samaksh
  github_login    text,
  avatar_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  last_login_at   timestamptz,
  CONSTRAINT users_email_format CHECK (email = lower(email) AND position('@' in email) > 1),
  CONSTRAINT users_handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]{1,38}$')
);
CREATE UNIQUE INDEX users_email_uq ON users (email);
CREATE UNIQUE INDEX users_handle_uq ON users (handle);
CREATE UNIQUE INDEX users_github_uq ON users (lower(github_login)) WHERE github_login IS NOT NULL;

-- Server-side sessions. We store only the SHA-256 of the cookie token.
CREATE TABLE sessions (
  token_hash   text PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token   text NOT NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL
);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expiry_idx ON sessions (expires_at);

CREATE TABLE profiles (
  user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline     text,
  bio          text,
  location     text,
  experience   text NOT NULL DEFAULT 'beginner' CHECK (experience IN ('beginner','intermediate','advanced')),
  interests    text[] NOT NULL DEFAULT '{}',
  goals        text[] NOT NULL DEFAULT '{}',
  links        jsonb  NOT NULL DEFAULT '{}'::jsonb,   -- {"github":"...","linkedin":"...","website":"..."}
  coding_since date,
  is_public    boolean NOT NULL DEFAULT false,
  onboarded    boolean NOT NULL DEFAULT false,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Every skill the user is learning / has learned.
CREATE TABLE skills (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  slug         text NOT NULL,
  category     text NOT NULL DEFAULT 'other' CHECK (category IN ('language','framework','library','tool','database','cloud','concept','other')),
  status       text NOT NULL DEFAULT 'learning' CHECK (status IN ('learning','learned','paused')),
  proficiency  smallint NOT NULL DEFAULT 1 CHECK (proficiency BETWEEN 1 AND 5),
  started_at   date NOT NULL DEFAULT CURRENT_DATE,
  learned_at   date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_learned_after_start CHECK (learned_at IS NULL OR learned_at >= started_at)
);
CREATE UNIQUE INDEX skills_user_slug_uq ON skills (user_id, slug);

-- Append-only growth log. Written by the backend on every skill change -> powers the growth timeline.
CREATE TABLE skill_events (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    uuid REFERENCES skills(id) ON DELETE SET NULL,
  skill_name  text NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('started','level_up','level_down','learned','paused','resumed','removed')),
  from_level  smallint,
  to_level    smallint,
  note        text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX skill_events_user_time_idx ON skill_events (user_id, occurred_at);

CREATE TABLE contributions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('pull_request','issue','commit','review','docs','discussion','other')),
  title        text NOT NULL,
  description  text,
  repo_owner   text,
  repo_name    text,
  url          text,
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','merged','closed','draft','completed')),
  skills       text[] NOT NULL DEFAULT '{}',           -- skill slugs used in this contribution
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  source       text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','github')),
  external_id  text,                                   -- GitHub node id for synced items (dedupe)
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contributions_user_time_idx ON contributions (user_id, occurred_at DESC, id DESC);
CREATE UNIQUE INDEX contributions_external_uq ON contributions (user_id, source, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE learning_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  topic       text NOT NULL,
  url         text NOT NULL UNIQUE,
  kind        text NOT NULL DEFAULT 'guide',
  reviewed_at timestamptz,             -- set only when a person/automated check actually verified the link
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX learning_resources_topic_idx ON learning_resources (topic);

-- Bounded cache of PUBLIC GitHub data only (never user secrets).
CREATE TABLE context_cache (
  key        text PRIMARY KEY,
  payload    jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX context_cache_expiry_idx ON context_cache (expires_at);
