alter table public.leads
  add column if not exists post_type          text,
  add column if not exists sentiment_evidence text,
  add column if not exists summary            text,
  add column if not exists wrong_region       boolean default false;
