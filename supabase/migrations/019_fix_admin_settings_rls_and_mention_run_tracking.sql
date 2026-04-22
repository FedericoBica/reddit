-- Fix 1: Lock down admin_settings — drop the permissive FOR ALL policy,
-- replace with admin-read-only (all writes stay service-role via admin client).
DROP POLICY IF EXISTS "Service role manages admin_settings" ON admin_settings;

CREATE POLICY "Admins can read admin_settings"
  ON admin_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role bypasses RLS; no write policy needed for authenticated role.

-- Fix 2: Track when we last attempted a mention scrape per project,
-- independent of whether any mentions were actually inserted.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_mentions_scraped_at TIMESTAMPTZ;
