-- Support storing Reddit comments (not just posts) as brand mentions
ALTER TABLE brand_mentions
  ADD COLUMN IF NOT EXISTS is_comment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_post_id text;
