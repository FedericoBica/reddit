ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;
