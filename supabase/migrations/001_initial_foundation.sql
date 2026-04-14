create extension if not exists pgcrypto;

create type public.onboarding_status as enum (
  'not_started',
  'in_progress',
  'completed'
);

create type public.project_status as enum (
  'active',
  'archived',
  'suspended'
);

create type public.project_member_role as enum (
  'owner',
  'admin',
  'member',
  'viewer'
);

create type public.keyword_type as enum (
  'custom',
  'ai_suggested',
  'competitor'
);

create type public.intent_category as enum (
  'informational',
  'comparative',
  'transactional'
);

create type public.lead_status as enum (
  'new',
  'reviewing',
  'replied',
  'won',
  'lost',
  'irrelevant'
);

create type public.lead_sentiment as enum (
  'positive',
  'negative',
  'neutral'
);

create type public.reply_style as enum (
  'engaging',
  'direct',
  'balanced',
  'custom'
);

create type public.api_service as enum (
  'openai',
  'anthropic',
  'reddit',
  'apify',
  'inngest'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  onboarding_status public.onboarding_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  website_url text,
  value_proposition text,
  tone text,
  region text,
  currency_code char(3) not null default 'USD',
  primary_language text not null default 'en',
  secondary_language text,
  status public.project_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.project_member_role not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  term text not null,
  type public.keyword_type not null default 'custom',
  intent_category public.intent_category,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, term)
);

create table public.subreddits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  is_regional boolean not null default false,
  region text,
  avg_daily_posts integer,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reddit_post_id text not null,
  reddit_fullname text,
  title text not null,
  body text,
  subreddit text not null,
  author text,
  permalink text not null,
  url text,
  created_utc timestamptz,
  score integer,
  num_comments integer,
  intent_score integer check (intent_score >= 0 and intent_score <= 100),
  region_score integer check (region_score >= 0 and region_score <= 10),
  sentiment public.lead_sentiment,
  classification_reason text,
  keywords_matched text[] not null default '{}',
  status public.lead_status not null default 'new',
  assigned_to uuid references public.users(id) on delete set null,
  snoozed_until timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  won_value numeric(12, 2),
  lost_reason text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, reddit_post_id)
);

alter table public.leads
  add constraint leads_project_id_id_unique unique (project_id, id);

create table public.lead_replies (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  style public.reply_style not null,
  content text not null,
  prompt_version text,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12, 6),
  was_used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lead_replies_project_matches_lead
    foreign key (project_id, lead_id)
    references public.leads(project_id, id)
    on delete cascade
);

create table public.api_usage_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  project_id_snapshot uuid,
  user_id_snapshot uuid,
  service public.api_service not null,
  operation text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  requests_count integer not null default 1,
  cost_usd numeric(12, 6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects(owner_id);
create index projects_status_idx on public.projects(status);
create index project_members_user_id_idx on public.project_members(user_id);
create index project_members_project_id_role_idx on public.project_members(project_id, role);
create index keywords_project_id_active_idx on public.keywords(project_id, is_active);
create index subreddits_project_id_active_idx on public.subreddits(project_id, is_active);
create index leads_project_id_status_idx on public.leads(project_id, status);
create index leads_project_id_intent_score_idx on public.leads(project_id, intent_score desc);
create index leads_project_id_created_at_idx on public.leads(project_id, created_at desc);
create index leads_project_id_reddit_post_id_idx on public.leads(project_id, reddit_post_id);
create index lead_replies_lead_id_idx on public.lead_replies(lead_id);
create index lead_replies_project_id_idx on public.lead_replies(project_id);
create index api_usage_log_project_created_idx on public.api_usage_log(project_id_snapshot, created_at desc);
create index api_usage_log_user_created_idx on public.api_usage_log(user_id_snapshot, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger keywords_set_updated_at
before update on public.keywords
for each row execute function public.set_updated_at();

create trigger subreddits_set_updated_at
before update on public.subreddits
for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.users.full_name, excluded.full_name),
        avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_project_member(_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = _project_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.has_project_role(
  _project_id uuid,
  _roles public.project_member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = _project_id
      and pm.user_id = auth.uid()
      and pm.role = any(_roles)
  );
$$;

create or replace function public.set_api_usage_snapshots()
returns trigger
language plpgsql
as $$
begin
  new.project_id_snapshot = coalesce(new.project_id_snapshot, new.project_id);
  new.user_id_snapshot = coalesce(new.user_id_snapshot, new.user_id);
  return new;
end;
$$;

create trigger api_usage_log_set_snapshots
before insert on public.api_usage_log
for each row execute function public.set_api_usage_snapshots();

create or replace function public.create_project_with_owner(
  _name text,
  _website_url text default null,
  _value_proposition text default null,
  _tone text default null,
  _region text default null,
  _currency_code char(3) default 'USD',
  _primary_language text default 'en',
  _secondary_language text default null
)
returns public.projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  _project public.projects;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.projects (
    owner_id,
    name,
    website_url,
    value_proposition,
    tone,
    region,
    currency_code,
    primary_language,
    secondary_language
  )
  values (
    auth.uid(),
    _name,
    _website_url,
    _value_proposition,
    _tone,
    _region,
    upper(_currency_code),
    _primary_language,
    _secondary_language
  )
  returning * into _project;

  insert into public.project_members (project_id, user_id, role)
  values (_project.id, auth.uid(), 'owner');

  return _project;
end;
$$;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.keywords enable row level security;
alter table public.subreddits enable row level security;
alter table public.leads enable row level security;
alter table public.lead_replies enable row level security;
alter table public.api_usage_log enable row level security;

create policy "users can read own profile"
on public.users for select
to authenticated
using (id = auth.uid());

create policy "users can update own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users can insert own profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

create policy "members can read projects"
on public.projects for select
to authenticated
using (owner_id = auth.uid() or public.is_project_member(id));

create policy "authenticated users can create owned projects"
on public.projects for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owners and admins can update projects"
on public.projects for update
to authenticated
using (public.has_project_role(id, array['owner', 'admin']::public.project_member_role[]))
with check (public.has_project_role(id, array['owner', 'admin']::public.project_member_role[]));

create policy "owners can delete projects"
on public.projects for delete
to authenticated
using (public.has_project_role(id, array['owner']::public.project_member_role[]));

create policy "members can read project memberships"
on public.project_members for select
to authenticated
using (public.is_project_member(project_id) or user_id = auth.uid());

create policy "owners can add their initial membership"
on public.project_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = auth.uid()
  )
);

create policy "owners can manage project memberships"
on public.project_members for update
to authenticated
using (public.has_project_role(project_id, array['owner']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner']::public.project_member_role[]));

create policy "owners can remove project memberships"
on public.project_members for delete
to authenticated
using (public.has_project_role(project_id, array['owner']::public.project_member_role[]));

create policy "members can read keywords"
on public.keywords for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert keywords"
on public.keywords for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can update keywords"
on public.keywords for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins can delete keywords"
on public.keywords for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

create policy "members can read subreddits"
on public.subreddits for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert subreddits"
on public.subreddits for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can update subreddits"
on public.subreddits for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins can delete subreddits"
on public.subreddits for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

create policy "members can read leads"
on public.leads for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert leads"
on public.leads for insert
to authenticated
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins members can update leads"
on public.leads for update
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]))
with check (public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[]));

create policy "owners admins can delete leads"
on public.leads for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

create policy "members can read lead replies"
on public.lead_replies for select
to authenticated
using (public.is_project_member(project_id));

create policy "owners admins members can insert lead replies"
on public.lead_replies for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[])
);

create policy "reply creators can update lead replies"
on public.lead_replies for update
to authenticated
using (
  created_by = auth.uid()
  and public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[])
)
with check (
  created_by = auth.uid()
  and public.has_project_role(project_id, array['owner', 'admin', 'member']::public.project_member_role[])
);

create policy "owners admins can delete lead replies"
on public.lead_replies for delete
to authenticated
using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

create policy "members can read api usage logs"
on public.api_usage_log for select
to authenticated
using (
  project_id_snapshot is not null
  and public.is_project_member(project_id_snapshot)
);

create policy "members can insert api usage logs"
on public.api_usage_log for insert
to authenticated
with check (
  user_id = auth.uid()
  and project_id is not null
  and public.is_project_member(project_id)
);
