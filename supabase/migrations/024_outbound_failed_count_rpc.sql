create or replace function public.increment_campaign_failed_count(
  _campaign_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update dm_campaigns
  set failed_count = failed_count + 1
  where id = _campaign_id;
$$;
