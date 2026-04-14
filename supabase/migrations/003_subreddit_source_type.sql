alter table public.subreddits
  add column type public.keyword_type not null default 'custom';
