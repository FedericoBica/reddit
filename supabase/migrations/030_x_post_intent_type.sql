-- Add intent_type to x_posts (parallel to leads.intent_type)
alter table public.x_posts
  add column if not exists intent_type text;
