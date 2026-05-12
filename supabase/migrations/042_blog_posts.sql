CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  meta_description TEXT,
  content     TEXT,
  target_keyword TEXT,
  word_count  INTEGER,
  faq_schema  JSONB,
  status      TEXT        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read access for published posts (no auth needed)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published posts are public"
  ON blog_posts FOR SELECT
  USING (status = 'published');
