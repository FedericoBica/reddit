-- Atomic counter increments used by the queue result handler.
-- Both run as security definer so the admin client can call them
-- without needing direct UPDATE on users/dm_campaigns.

create or replace function public.increment_campaign_sent_count(
  _campaign_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update dm_campaigns
  set sent_count = sent_count + 1
  where id = _campaign_id;
$$;

create or replace function public.increment_user_dm_monthly_used(
  _user_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update users
  set dm_monthly_used = dm_monthly_used + 1
  where id = _user_id;
$$;
