create or replace function public.create_project_with_owner(
  _name text,
  _website_url text default null,
  _value_proposition text default null,
  _tone text default null,
  _region text default null,
  _currency_code char(3) default 'USD',
  _primary_language text default 'en',
  _secondary_language text default null
)
returns public.projects
language plpgsql
security invoker
set search_path = public
as $$
declare
  _project public.projects;
  _normalized_name text;
  _normalized_website text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  _normalized_name := lower(trim(_name));
  _normalized_website := nullif(lower(trim(coalesce(_website_url, ''))), '');

  perform pg_advisory_xact_lock(
    hashtext(auth.uid()::text),
    hashtext(_normalized_name || '|' || coalesce(_normalized_website, ''))
  );

  select p.*
  into _project
  from public.projects p
  where p.owner_id = auth.uid()
    and lower(trim(p.name)) = _normalized_name
    and nullif(lower(trim(coalesce(p.website_url, ''))), '') is not distinct from _normalized_website
    and p.status = 'active'
  order by p.created_at desc
  limit 1;

  if found then
    return _project;
  end if;

  insert into public.projects (
    owner_id,
    name,
    website_url,
    value_proposition,
    tone,
    region,
    currency_code,
    primary_language,
    secondary_language
  )
  values (
    auth.uid(),
    _name,
    _website_url,
    _value_proposition,
    _tone,
    _region,
    upper(_currency_code),
    _primary_language,
    _secondary_language
  )
  returning * into _project;

  insert into public.project_members (project_id, user_id, role)
  values (_project.id, auth.uid(), 'owner')
  on conflict (project_id, user_id) do nothing;

  return _project;
end;
$$;
