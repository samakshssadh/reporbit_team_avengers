-- 004: GitHub account connection + Learn progress (finishing a language adds it to the tech stack)
ALTER TABLE users
  ADD COLUMN github_id bigint,
  ADD COLUMN github_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN github_synced_at timestamptz;

CREATE TABLE oauth_states (
  state      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learn_progress (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject      text NOT NULL,
  stage_id     text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, subject, stage_id)
);
