-- 002: onboarding profile fields + Dummy PR review history
ALTER TABLE profiles
  ADD COLUMN profession text,
  ADD COLUMN experience_months integer CHECK (experience_months IS NULL OR experience_months BETWEEN 0 AND 720),
  ADD COLUMN prior_contributions integer NOT NULL DEFAULT 0 CHECK (prior_contributions BETWEEN 0 AND 100000);

CREATE TABLE pr_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  language    text,
  verdict     text NOT NULL,
  issues      integer NOT NULL DEFAULT 0,
  model       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pr_reviews_user_idx ON pr_reviews (user_id, created_at DESC);
