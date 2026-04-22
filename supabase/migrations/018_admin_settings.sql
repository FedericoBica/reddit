CREATE TABLE admin_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only service role can access — no RLS needed for user-facing policies
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages admin_settings"
  ON admin_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Default schedule: opportunities 9am, mentions 10am, searchbox 11am (UTC)
INSERT INTO admin_settings (key, value) VALUES (
  'scrape_schedule',
  '{"opportunities_hour": 9, "mentions_hour": 10, "searchbox_hour": 11, "searchbox_days": [1, 15]}'
) ON CONFLICT (key) DO NOTHING;
