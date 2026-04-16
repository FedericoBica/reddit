alter table public.users
  add column billing_plan text not null default 'starter'
    check (billing_plan in ('starter', 'growth', 'enterprise'));
