create table public.x_profiles (
  id                uuid        primary key default gen_random_uuid(),
  project_id        uuid        not null unique references public.projects(id) on delete cascade,
  interests         text[]      not null default '{}',
  favorite_creators text[]      not null default '{}',
  use_own_tweets    boolean     not null default false,
  structure_types   text[]      not null default '{}',
  products          text[]      not null default '{}',
  x_rules           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.x_profiles enable row level security;

create policy "members read x_profiles" on public.x_profiles
  for select using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );

create policy "members upsert x_profiles" on public.x_profiles
  for all using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );
