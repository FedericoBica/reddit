alter table public.users
  add column is_admin boolean not null default false;

-- Set initial admin
update public.users
set is_admin = true
where email = 'fedebicasua@gmail.com';
