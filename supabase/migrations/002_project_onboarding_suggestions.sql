create type public.project_onboarding_status as enum (
  'needs_suggestions',
  'suggestions_pending',
  'suggestions_ready',
  'suggestions_failed',
  'completed'
);

alter table public.projects
  add column onboarding_status public.project_onboarding_status not null default 'needs_suggestions',
  add column onboarding_completed_at timestamptz,
  add column suggestions_error text;

create table public.project_keyword_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  term text not null,
  intent_category public.intent_category,
  rationale text,
  created_at timestamptz not null default now(),
  unique (project_id, term)
);

create table public.project_subreddit_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_regional boolean not null default false,
  rationale text,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index project_keyword_suggestions_project_id_idx
  on public.project_keyword_suggestions(project_id);

create index project_subreddit_suggestions_project_id_idx
  on public.project_subreddit_suggestions(project_id);

alter table public.project_keyword_suggestions enable row level security;
alter table public.project_subreddit_suggestions enable row level security;

create policy "members can read keyword suggestions"
on public.project_keyword_suggestions for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert keyword suggestions"
on public.project_keyword_suggestions for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can update keyword suggestions"
on public.project_keyword_suggestions for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can delete keyword suggestions"
on public.project_keyword_suggestions for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "members can read subreddit suggestions"
on public.project_subreddit_suggestions for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert subreddit suggestions"
on public.project_subreddit_suggestions for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can update subreddit suggestions"
on public.project_subreddit_suggestions for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can delete subreddit suggestions"
on public.project_subreddit_suggestions for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));
