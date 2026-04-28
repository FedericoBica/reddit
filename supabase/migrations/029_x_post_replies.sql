alter table public.x_posts
  add column reply_generation_status public.reply_generation_status not null default 'idle',
  add column reply_generation_error   text,
  add column reply_generation_requested_at  timestamptz,
  add column reply_generation_completed_at  timestamptz;

create index if not exists x_posts_project_id_reply_generation_status_idx
  on public.x_posts(project_id, reply_generation_status);

create table if not exists public.x_post_replies (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  x_post_id   uuid not null references public.x_posts(id)  on delete cascade,
  created_by  uuid references auth.users(id) on delete set null,
  style       text not null,
  content     text not null,
  prompt_version text,
  model       text,
  input_tokens  integer,
  output_tokens integer,
  was_used    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists x_post_replies_x_post_id_idx
  on public.x_post_replies(x_post_id);

create index if not exists x_post_replies_project_id_idx
  on public.x_post_replies(project_id);

alter table public.x_post_replies enable row level security;

drop policy if exists "members can read x_post_replies" on public.x_post_replies;
create policy "members can read x_post_replies"
on public.x_post_replies for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "service role can manage x_post_replies" on public.x_post_replies;
create policy "service role can manage x_post_replies"
on public.x_post_replies for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "members can insert x_post_replies" on public.x_post_replies;
create policy "members can insert x_post_replies"
on public.x_post_replies for insert
to authenticated
with check (public.is_project_member(project_id));

drop policy if exists "members can update own x_post_replies" on public.x_post_replies;
create policy "members can update own x_post_replies"
on public.x_post_replies for update
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));
