alter table public.brand_mentions enable row level security;

drop policy if exists "Users can read their own brand_mentions" on public.brand_mentions;
drop policy if exists "members can read brand_mentions" on public.brand_mentions;

create policy "members can read brand_mentions"
on public.brand_mentions for select
to authenticated
using (public.is_project_member(project_id));
