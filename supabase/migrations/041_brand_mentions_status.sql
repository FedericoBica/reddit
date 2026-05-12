ALTER TABLE brand_mentions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'replied'));
