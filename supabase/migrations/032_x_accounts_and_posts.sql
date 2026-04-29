-- X connected accounts (OAuth 2.0 tokens per project)
create table public.x_connected_accounts (
  id                    uuid        primary key default gen_random_uuid(),
  project_id            uuid        not null references public.projects(id) on delete cascade,
  user_id               uuid        not null references auth.users(id),
  x_user_id             text        not null,
  x_username            text        not null,
  x_name                text,
  x_profile_image_url   text,
  access_token          text        not null,
  refresh_token         text,
  token_expires_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (project_id, x_user_id)
);

alter table public.x_connected_accounts enable row level security;

create policy "service role manage x_connected_accounts" on public.x_connected_accounts
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- X scheduled posts / queue
create table public.x_scheduled_posts (
  id                    uuid        primary key default gen_random_uuid(),
  project_id            uuid        not null references public.projects(id) on delete cascade,
  created_by            uuid        not null references auth.users(id),
  connected_account_id  uuid        references public.x_connected_accounts(id) on delete set null,
  content               text        not null,
  scheduled_for         timestamptz,
  status                text        not null default 'draft'
                          check (status in ('draft','scheduled','publishing','published','failed')),
  published_at          timestamptz,
  x_tweet_id            text,
  error                 text,
  source                text        not null default 'manual'
                          check (source in ('ai_writer','inspiration','manual')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.x_scheduled_posts enable row level security;

create policy "members read x_scheduled_posts" on public.x_scheduled_posts
  for select using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );

create policy "members manage x_scheduled_posts" on public.x_scheduled_posts
  for all using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );
