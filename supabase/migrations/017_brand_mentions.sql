-- Brand mentions: separate table for brand/competitor monitoring
-- Different from leads (which track buying intent) — this tracks name mentions

CREATE TABLE brand_mentions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reddit_post_id TEXT        NOT NULL,
  target_type    TEXT        NOT NULL CHECK (target_type IN ('company', 'competitor')),
  target_label   TEXT        NOT NULL, -- company name or competitor name
  title          TEXT        NOT NULL,
  body           TEXT,
  subreddit      TEXT        NOT NULL,
  author         TEXT,
  permalink      TEXT        NOT NULL,
  url            TEXT,
  reddit_score   INTEGER     DEFAULT 0,
  num_comments   INTEGER     DEFAULT 0,
  sentiment      TEXT        NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  sentiment_reason TEXT,
  posted_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Same post can mention both company and a competitor → unique per (post, target_label)
CREATE UNIQUE INDEX brand_mentions_unique
  ON brand_mentions (project_id, reddit_post_id, target_label);

CREATE INDEX brand_mentions_project_id_idx ON brand_mentions (project_id);
CREATE INDEX brand_mentions_target_type_idx ON brand_mentions (project_id, target_type);
CREATE INDEX brand_mentions_sentiment_idx ON brand_mentions (project_id, sentiment);
CREATE INDEX brand_mentions_created_at_idx ON brand_mentions (project_id, created_at DESC);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own brand_mentions"
  ON brand_mentions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage brand_mentions"
  ON brand_mentions FOR ALL
  USING (true)
  WITH CHECK (true);
