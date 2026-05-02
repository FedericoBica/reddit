alter table public.users
  add column lemonsqueezy_customer_id text,
  add column lemonsqueezy_subscription_id text,
  add column lemonsqueezy_order_id text,
  add column lemonsqueezy_product_id text,
  add column lemonsqueezy_variant_id text,
  add column lemonsqueezy_subscription_status text,
  add column lemonsqueezy_subscription_item_id text,
  add column lemonsqueezy_subscription_renews_at timestamptz,
  add column lemonsqueezy_subscription_ends_at timestamptz,
  add column lemonsqueezy_trial_ends_at timestamptz;

create index users_lemonsqueezy_customer_id_idx
on public.users (lemonsqueezy_customer_id)
where lemonsqueezy_customer_id is not null;

create unique index users_lemonsqueezy_subscription_id_idx
on public.users (lemonsqueezy_subscription_id)
where lemonsqueezy_subscription_id is not null;

create table public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  resource_type text not null,
  resource_id text not null,
  payload_hash text not null unique,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index billing_webhook_events_resource_idx
on public.billing_webhook_events (resource_type, resource_id, created_at desc);

alter table public.billing_webhook_events enable row level security;

create policy "admins can read billing webhook events"
on public.billing_webhook_events for select
using (
  exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.is_admin = true
  )
);
