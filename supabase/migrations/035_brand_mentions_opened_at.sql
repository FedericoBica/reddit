-- Track when a brand mention was first opened by the user
ALTER TABLE brand_mentions ADD COLUMN IF NOT EXISTS opened_at timestamptz;
