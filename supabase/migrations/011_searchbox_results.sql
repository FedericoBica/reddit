alter type public.api_service add value if not exists 'serpapi';

alter table public.projects
  add column last_searchbox_at timestamptz;

create type public.searchbox_result_status as enum (
  'new',
  'replied',
  'dismissed'
);

create table public.searchbox_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reddit_post_id text not null,
  google_keyword text not null,
  google_rank integer not null check (google_rank between 1 and 10),
  title text not null,
  body text,
  subreddit text not null,
  author text,
  permalink text not null,
  url text,
  reddit_score integer,
  reddit_num_comments integer,
  reddit_created_utc timestamptz,
  intent_score integer check (intent_score between 0 and 100),
  classification_reason text,
  status public.searchbox_result_status not null default 'new',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint searchbox_results_project_post_unique unique (project_id, reddit_post_id)
);

create index searchbox_results_project_status_idx
  on public.searchbox_results(project_id, status, intent_score desc);

create index searchbox_results_project_last_seen_idx
  on public.searchbox_results(project_id, last_seen_at desc);

alter table public.searchbox_results enable row level security;

create policy "members can read searchbox results"
on public.searchbox_results for select
to authenticated
using (public.is_project_member(project_id));

create policy "members can update searchbox results"
on public.searchbox_results for update
to authenticated
using (public.is_project_member(project_id));
