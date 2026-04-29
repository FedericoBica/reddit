-- Add category and hook_explanation to x_scheduled_posts for Inspiration features
alter table public.x_scheduled_posts
  add column if not exists category       text,
  add column if not exists hook_explanation text;

-- Allow project members to read their project's connected X account metadata.
-- Tokens are readable server-side only (server-only modules + requireUser gate).
-- Column-level security is not available in Postgres RLS; the server layer enforces
-- that tokens are never surfaced to the client.
create policy "members read x_connected_accounts" on public.x_connected_accounts
  for select using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );

-- Members can manage their own project's connected account row
create policy "members manage x_connected_accounts" on public.x_connected_accounts
  for all using (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  )
  with check (
    project_id in (select project_id from public.project_members where user_id = auth.uid())
  );
