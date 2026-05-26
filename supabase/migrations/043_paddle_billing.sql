-- Migrate billing columns from Lemon Squeezy to Paddle

alter table public.users
  rename column lemonsqueezy_customer_id to paddle_customer_id;

alter table public.users
  rename column lemonsqueezy_subscription_id to paddle_subscription_id;

alter table public.users
  rename column lemonsqueezy_subscription_status to paddle_subscription_status;

alter table public.users
  rename column lemonsqueezy_subscription_renews_at to paddle_subscription_renews_at;

alter table public.users
  rename column lemonsqueezy_subscription_ends_at to paddle_subscription_ends_at;

alter table public.users
  rename column lemonsqueezy_trial_ends_at to paddle_trial_ends_at;

alter table public.users
  drop column lemonsqueezy_order_id,
  drop column lemonsqueezy_product_id,
  drop column lemonsqueezy_variant_id,
  drop column lemonsqueezy_subscription_item_id;

alter table public.users
  add column paddle_price_id text;

drop index if exists users_lemonsqueezy_customer_id_idx;
drop index if exists users_lemonsqueezy_subscription_id_idx;

create index users_paddle_customer_id_idx
  on public.users (paddle_customer_id)
  where paddle_customer_id is not null;

create unique index users_paddle_subscription_id_idx
  on public.users (paddle_subscription_id)
  where paddle_subscription_id is not null;
