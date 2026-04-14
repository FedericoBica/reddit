create type public.scrape_run_status as enum (
  'started',
  'completed',
  'failed',
  'skipped'
);

alter table public.projects
  add column last_scraped_at timestamptz,
  add column scrape_fail_count integer not null default 0,
  add column scrape_backoff_until timestamptz,
  add column last_scrape_error text;

create table public.project_scrape_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id text not null,
  status public.scrape_run_status not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  subreddits_count integer not null default 0,
  posts_seen integer not null default 0,
  leads_created integer not null default 0,
  duplicates_skipped integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_scrape_due_idx
  on public.projects(status, onboarding_status, scrape_backoff_until, last_scraped_at);

create index project_scrape_runs_project_started_idx
  on public.project_scrape_runs(project_id, started_at desc);

create index project_scrape_runs_run_id_idx
  on public.project_scrape_runs(run_id);

alter table public.project_scrape_runs enable row level security;

create policy "members can read project scrape runs"
on public.project_scrape_runs for select
to authenticated
using (public.is_project_member(project_id));
