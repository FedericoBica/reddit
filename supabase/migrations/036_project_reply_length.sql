ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS reply_length text NOT NULL DEFAULT 'medium'
    CHECK (reply_length IN ('short', 'medium', 'long'));
