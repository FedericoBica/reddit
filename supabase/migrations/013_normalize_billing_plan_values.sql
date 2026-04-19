alter table public.users
  drop constraint if exists users_billing_plan_check;

alter table public.users
  alter column billing_plan set default 'startup';

update public.users
set billing_plan = case billing_plan
  when 'starter' then 'startup'
  when 'enterprise' then 'professional'
  else billing_plan
end;

alter table public.users
  add constraint users_billing_plan_check
  check (billing_plan in ('startup', 'growth', 'professional'));
