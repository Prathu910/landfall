-- Apply separately after enabling pg_cron in the target project. Intentionally
-- excluded from portable migrations: vanilla local Postgres has no pg_cron.
-- The SQL Editor/psql connection must use the project owner (normally postgres).
begin;
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable pg_cron in Supabase Integrations before installing retention';
  end if;
  if coalesce(current_setting('cron.timezone', true), 'GMT') not in ('GMT', 'UTC', 'Etc/UTC') then
    raise exception 'Cron must run in UTC/GMT for the documented 03:00 UTC schedule';
  end if;
end;
$$;
select cron.schedule(
  'migratelens-retention',
  '0 3 * * *',
  'select public.purge_expired_submissions();'
);
commit;
