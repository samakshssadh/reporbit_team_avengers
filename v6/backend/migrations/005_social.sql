-- 005: social layer. People follow people (public profiles: instant; private profiles: needs approval),
-- people follow repositories, and the leaderboard is computed from existing activity tables.
-- Privacy reuses profiles.is_public (default false = private).
CREATE TABLE follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> followee_id)
);
CREATE INDEX follows_followee_idx ON follows (followee_id, status);

CREATE TABLE repo_follows (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_id     text NOT NULL,
  repo_name   text NOT NULL,
  platform    text NOT NULL DEFAULT 'github' CHECK (platform IN ('github','gitlab','bitbucket')),
  followed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, repo_id)
);
CREATE INDEX repo_follows_repo_idx ON repo_follows (repo_id);
