alter table public.brand_mentions
  add column if not exists post_type        text,
  add column if not exists mention_context  text,
  add column if not exists response_priority smallint,
  add column if not exists sentiment_evidence text,
  add column if not exists summary          text,
  add column if not exists wrong_region     boolean default false;
