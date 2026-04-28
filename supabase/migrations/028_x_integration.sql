create table if not exists public.x_keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  query text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, query)
);

create table if not exists public.x_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  x_post_id text not null,
  author_id text,
  author_username text,
  author_name text,
  author_verified boolean,
  author_followers_count integer,
  text text not null,
  permalink text not null,
  lang text,
  posted_at timestamptz,
  like_count integer not null default 0,
  retweet_count integer not null default 0,
  reply_count integer not null default 0,
  quote_count integer not null default 0,
  bookmark_count integer,
  impression_count integer,
  intent_score integer check (intent_score >= 0 and intent_score <= 100),
  sentiment public.lead_sentiment,
  classification_reason text,
  classifier_prompt_version text,
  keywords_matched text[] not null default '{}',
  status public.lead_status not null default 'new',
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, x_post_id)
);

create index if not exists x_keywords_project_id_active_idx
  on public.x_keywords(project_id, is_active);

create index if not exists x_posts_project_id_status_idx
  on public.x_posts(project_id, status);

create index if not exists x_posts_project_id_intent_score_idx
  on public.x_posts(project_id, intent_score desc);

create index if not exists x_posts_project_id_created_at_idx
  on public.x_posts(project_id, created_at desc);

create index if not exists x_posts_project_id_x_post_id_idx
  on public.x_posts(project_id, x_post_id);

drop trigger if exists x_keywords_set_updated_at on public.x_keywords;
create trigger x_keywords_set_updated_at
before update on public.x_keywords
for each row execute function public.set_updated_at();

drop trigger if exists x_posts_set_updated_at on public.x_posts;
create trigger x_posts_set_updated_at
before update on public.x_posts
for each row execute function public.set_updated_at();

alter table public.x_keywords enable row level security;
alter table public.x_posts enable row level security;

drop policy if exists "members can read x_keywords" on public.x_keywords;
create policy "members can read x_keywords"
on public.x_keywords for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "owners admins members can insert x_keywords" on public.x_keywords;
create policy "owners admins members can insert x_keywords"
on public.x_keywords for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

drop policy if exists "owners admins members can update x_keywords" on public.x_keywords;
create policy "owners admins members can update x_keywords"
on public.x_keywords for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

drop policy if exists "owners admins can delete x_keywords" on public.x_keywords;
create policy "owners admins can delete x_keywords"
on public.x_keywords for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

drop policy if exists "members can read x_posts" on public.x_posts;
create policy "members can read x_posts"
on public.x_posts for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "service role can manage x_posts" on public.x_posts;
create policy "service role can manage x_posts"
on public.x_posts for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
