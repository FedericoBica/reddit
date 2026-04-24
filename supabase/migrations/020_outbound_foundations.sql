-- ─────────────────────────────────────────────────────────────
-- 020_outbound_foundations.sql
-- Outbound DM module: campaigns, contacts, queue, messages,
-- extension tokens. Also adds DM usage counters to users.
-- ─────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────

create type public.dm_campaign_type as enum (
  'lead',
  'thread',
  'subreddit'
);

create type public.dm_campaign_status as enum (
  'draft',
  'active',
  'paused',
  'completed',
  'failed'
);

create type public.dm_contact_status as enum (
  'queued',
  'sent',
  'replied',
  'interested',
  'won',
  'lost'
);

create type public.dm_queue_status as enum (
  'pending',
  'sending',
  'sent',
  'failed',
  'skipped'
);

create type public.dm_message_direction as enum (
  'out',
  'in'
);

-- ── Users: DM usage counters ─────────────────────────────────

alter table public.users
  add column if not exists dm_monthly_used  integer     not null default 0,
  add column if not exists dm_cycle_resets_at timestamptz;

-- ── dm_campaigns ─────────────────────────────────────────────

create table public.dm_campaigns (
  id              uuid                      primary key default gen_random_uuid(),
  project_id      uuid                      not null references public.projects(id) on delete cascade,
  created_by      uuid                      not null references public.users(id),
  name            text                      not null,
  type            public.dm_campaign_type   not null,
  status          public.dm_campaign_status not null default 'draft',
  source_url      text,
  source_config   jsonb                     not null default '{}',
  message_template text                     not null default '',
  daily_limit     integer                   not null default 20,
  delay_min_sec   integer                   not null default 30,
  delay_max_sec   integer                   not null default 120,
  sent_count      integer                   not null default 0,
  reply_count     integer                   not null default 0,
  failed_count    integer                   not null default 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz               not null default now(),
  updated_at      timestamptz               not null default now()
);

create index dm_campaigns_project_id_idx on public.dm_campaigns(project_id);
create index dm_campaigns_status_idx     on public.dm_campaigns(project_id, status);

-- ── dm_contacts ───────────────────────────────────────────────

create table public.dm_contacts (
  id                 uuid                       primary key default gen_random_uuid(),
  project_id         uuid                       not null references public.projects(id) on delete cascade,
  lead_id            uuid                       references public.leads(id) on delete set null,
  reddit_username    text                       not null,
  source_type        public.dm_campaign_type    not null,
  first_campaign_id  uuid                       references public.dm_campaigns(id) on delete set null,
  last_campaign_id   uuid                       references public.dm_campaigns(id) on delete set null,
  status             public.dm_contact_status   not null default 'queued',
  last_message_at    timestamptz,
  last_reply_at      timestamptz,
  created_at         timestamptz                not null default now(),
  updated_at         timestamptz                not null default now(),

  constraint dm_contacts_project_username_unique unique (project_id, reddit_username)
);

create index dm_contacts_project_id_idx on public.dm_contacts(project_id);
create index dm_contacts_status_idx     on public.dm_contacts(project_id, status);
create index dm_contacts_lead_id_idx    on public.dm_contacts(lead_id) where lead_id is not null;

-- ── dm_queue ──────────────────────────────────────────────────

create table public.dm_queue (
  id            uuid                    primary key default gen_random_uuid(),
  campaign_id   uuid                    not null references public.dm_campaigns(id) on delete cascade,
  contact_id    uuid                    not null references public.dm_contacts(id) on delete cascade,
  priority      integer                 not null default 0,
  status        public.dm_queue_status  not null default 'pending',
  error_reason  text,
  scheduled_at  timestamptz             not null default now(),
  sent_at       timestamptz,
  created_at    timestamptz             not null default now(),
  updated_at    timestamptz             not null default now(),

  constraint dm_queue_campaign_contact_unique unique (campaign_id, contact_id)
);

create index dm_queue_campaign_pending_idx on public.dm_queue(campaign_id, scheduled_at)
  where status = 'pending';

-- ── dm_messages ───────────────────────────────────────────────

create table public.dm_messages (
  id                  uuid                       primary key default gen_random_uuid(),
  project_id          uuid                       not null references public.projects(id) on delete cascade,
  campaign_id         uuid                       not null references public.dm_campaigns(id) on delete cascade,
  contact_id          uuid                       not null references public.dm_contacts(id) on delete cascade,
  -- For outbound messages queue_item_id is required; for inbound it is null.
  queue_item_id       uuid                       references public.dm_queue(id) on delete set null,
  direction           public.dm_message_direction not null,
  body                text                       not null check (char_length(body) <= 2000),
  reddit_message_id   text,
  sent_at             timestamptz,
  received_at         timestamptz,
  created_at          timestamptz                not null default now()
);

-- Prevent duplicate outbound message rows for the same queue item (idempotency).
create unique index dm_messages_outbound_queue_item_unique
  on public.dm_messages(queue_item_id)
  where direction = 'out' and queue_item_id is not null;

-- Prevent duplicate inbound sync for the same Reddit message.
create unique index dm_messages_reddit_message_id_unique
  on public.dm_messages(project_id, reddit_message_id)
  where direction = 'in' and reddit_message_id is not null;

create index dm_messages_contact_id_idx on public.dm_messages(contact_id, created_at);

-- ── extension_connect_tokens ──────────────────────────────────
-- Short-lived one-time tokens used to pair the extension with an account.

create table public.extension_connect_tokens (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.users(id) on delete cascade,
  project_id  uuid        not null references public.projects(id) on delete cascade,
  token_hash  text        not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index extension_connect_tokens_user_id_idx on public.extension_connect_tokens(user_id);

-- ── extension_tokens ──────────────────────────────────────────
-- Persistent per-device tokens stored in chrome.storage.local.

create table public.extension_tokens (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  project_id   uuid        not null references public.projects(id) on delete cascade,
  token_hash   text        not null unique,
  label        text,
  last_used_at timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index extension_tokens_user_id_idx on public.extension_tokens(user_id);

-- ── updated_at triggers ───────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dm_campaigns_set_updated_at
  before update on public.dm_campaigns
  for each row execute function public.set_updated_at();

create trigger dm_contacts_set_updated_at
  before update on public.dm_contacts
  for each row execute function public.set_updated_at();

create trigger dm_queue_set_updated_at
  before update on public.dm_queue
  for each row execute function public.set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────

alter table public.dm_campaigns         enable row level security;
alter table public.dm_contacts          enable row level security;
alter table public.dm_queue             enable row level security;
alter table public.dm_messages          enable row level security;
alter table public.extension_connect_tokens enable row level security;
alter table public.extension_tokens     enable row level security;

-- dm_campaigns: all project members can read; members can insert/update;
-- only owner/admin can delete.

create policy "Project members can view campaigns"
  on public.dm_campaigns for select
  using (public.is_project_member(project_id));

create policy "Project members can create campaigns"
  on public.dm_campaigns for insert
  with check (public.is_project_member(project_id));

create policy "Project members can update campaigns"
  on public.dm_campaigns for update
  using (public.is_project_member(project_id));

create policy "Project owners can delete campaigns"
  on public.dm_campaigns for delete
  using (public.has_project_role(project_id, array['owner', 'admin']::public.project_member_role[]));

-- dm_contacts

create policy "Project members can view contacts"
  on public.dm_contacts for select
  using (public.is_project_member(project_id));

create policy "Project members can insert contacts"
  on public.dm_contacts for insert
  with check (public.is_project_member(project_id));

create policy "Project members can update contacts"
  on public.dm_contacts for update
  using (public.is_project_member(project_id));

-- dm_queue

create policy "Project members can view queue"
  on public.dm_queue for select
  using (
    exists (
      select 1 from public.dm_campaigns c
      where c.id = campaign_id
        and public.is_project_member(c.project_id)
    )
  );

create policy "Project members can insert queue items"
  on public.dm_queue for insert
  with check (
    exists (
      select 1 from public.dm_campaigns c
      where c.id = campaign_id
        and public.is_project_member(c.project_id)
    )
  );

create policy "Project members can update queue items"
  on public.dm_queue for update
  using (
    exists (
      select 1 from public.dm_campaigns c
      where c.id = campaign_id
        and public.is_project_member(c.project_id)
    )
  );

-- dm_messages

create policy "Project members can view messages"
  on public.dm_messages for select
  using (public.is_project_member(project_id));

create policy "Project members can insert messages"
  on public.dm_messages for insert
  with check (public.is_project_member(project_id));

-- extension_connect_tokens: only the owning user

create policy "Users can view own connect tokens"
  on public.extension_connect_tokens for select
  using (user_id = auth.uid());

create policy "Users can create connect tokens"
  on public.extension_connect_tokens for insert
  with check (
    user_id = auth.uid()
    and public.has_project_role(project_id, array['owner']::public.project_member_role[])
  );

create policy "Users can update own connect tokens"
  on public.extension_connect_tokens for update
  using (user_id = auth.uid());

-- extension_tokens: only the owning user

create policy "Users can view own extension tokens"
  on public.extension_tokens for select
  using (user_id = auth.uid());

create policy "Users can insert own extension tokens"
  on public.extension_tokens for insert
  with check (user_id = auth.uid());

create policy "Users can update own extension tokens"
  on public.extension_tokens for update
  using (user_id = auth.uid());

create policy "Users can delete own extension tokens"
  on public.extension_tokens for delete
  using (user_id = auth.uid());
