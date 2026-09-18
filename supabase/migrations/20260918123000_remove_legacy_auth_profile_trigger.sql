-- AARTH creates public.profiles explicitly in backend/auth/service.py after
-- Supabase Auth creates auth.users.  Remove only legacy custom auth.users
-- triggers that also attempt to create AARTH profile/role rows in the same
-- Auth transaction; those stale triggers produce "Database error creating new
-- user" when their old schema assumptions no longer match this project.
-- Supabase's internal triggers are excluded, as are unrelated custom hooks.

do $$
declare
  trigger_row record;
begin
  for trigger_row in
    select
      trigger_item.tgname,
      pg_get_functiondef(function_item.oid) as function_definition
    from pg_trigger trigger_item
    join pg_class table_item on table_item.oid = trigger_item.tgrelid
    join pg_namespace schema_item on schema_item.oid = table_item.relnamespace
    join pg_proc function_item on function_item.oid = trigger_item.tgfoid
    where schema_item.nspname = 'auth'
      and table_item.relname = 'users'
      and not trigger_item.tgisinternal
  loop
    if trigger_row.function_definition ~* 'public\.(profiles|farmers|fpos|buyers|logistics_partners|storage_partners)' then
      execute format('drop trigger if exists %I on auth.users', trigger_row.tgname);
    end if;
  end loop;
end
$$;
