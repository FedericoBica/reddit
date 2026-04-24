create or replace function public.increment_campaign_reply_count(
  _campaign_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update dm_campaigns
  set reply_count = reply_count + 1
  where id = _campaign_id;
$$;
