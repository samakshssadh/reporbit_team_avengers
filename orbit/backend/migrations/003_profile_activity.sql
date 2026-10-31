-- 003: activity tracking for the profile page (time on site, repos explored/contributed, topics) + onboarding snapshot
CREATE TABLE user_activity (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day      date NOT NULL,
  seconds  integer NOT NULL DEFAULT 0 CHECK (seconds >= 0 AND seconds <= 86400),
  PRIMARY KEY (user_id, day)
);

CREATE TABLE repo_interactions (
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_id   text NOT NULL,
  repo_name text NOT NULL,
  platform  text NOT NULL DEFAULT 'github' CHECK (platform IN ('github','gitlab','bitbucket')),
  kind      text NOT NULL CHECK (kind IN ('viewed','roadmap','chat','contributed')),
  count     integer NOT NULL DEFAULT 1,
  first_at  timestamptz NOT NULL DEFAULT now(),
  last_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, repo_id, kind)
);
CREATE INDEX repo_interactions_user_idx ON repo_interactions (user_id, last_at DESC);

CREATE TABLE learn_topics (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic    text NOT NULL,
  count    integer NOT NULL DEFAULT 1,
  first_at timestamptz NOT NULL DEFAULT now(),
  last_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic)
);

-- "Where I was" — captured once, when onboarding completes.
ALTER TABLE profiles ADD COLUMN onboarding_snapshot jsonb;
