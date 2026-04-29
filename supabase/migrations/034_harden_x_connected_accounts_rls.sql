-- Corrective migration for environments where 032_x_accounts_and_posts.sql
-- already granted project members direct access to raw X OAuth tokens.

alter table public.x_connected_accounts enable row level security;

drop policy if exists "members read x_connected_accounts" on public.x_connected_accounts;
drop policy if exists "members manage x_connected_accounts" on public.x_connected_accounts;
drop policy if exists "service role manage x_connected_accounts" on public.x_connected_accounts;

create policy "service role manage x_connected_accounts"
on public.x_connected_accounts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
