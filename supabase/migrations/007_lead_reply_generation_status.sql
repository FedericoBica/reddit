create type public.reply_generation_status as enum (
  'idle',
  'generating',
  'ready',
  'failed'
);

alter table public.leads
  add column reply_generation_status public.reply_generation_status not null default 'idle',
  add column reply_generation_error text,
  add column reply_generation_requested_at timestamptz,
  add column reply_generation_completed_at timestamptz;

create index leads_project_id_reply_generation_status_idx
on public.leads(project_id, reply_generation_status);
