alter table extension_tokens
  add column if not exists reddit_username text,
  add column if not exists reddit_verified_at timestamptz;
