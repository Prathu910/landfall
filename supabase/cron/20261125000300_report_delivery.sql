-- Paid reports: the delivery job every 5 minutes and the daily retention at
-- 03:10 UTC. Apply by hand, like 20261120000200_retention_schedule.sql, after
-- the paid-report migrations, pg_cron and pg_net are enabled (Supabase
-- Integrations) and both Vault secrets exist; docs/OPERATIONS-BACKEND.md,
-- "Paid reports", has the exact steps. Run as the project owner (postgres).
--
-- The deliver secret never sits in this file or in cron.job: the job reads it
-- from Vault each time it runs, as does the Function URL.
--   select vault.create_secret('<REPORT_DELIVER_SECRET value>', 'report_deliver_secret');
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/report-deliver', 'report_deliver_url');
begin;
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable pg_cron in Supabase Integrations before installing report delivery';
  end if;
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'Enable pg_net in Supabase Integrations before installing report delivery';
  end if;
  if coalesce(current_setting('cron.timezone', true), 'GMT') not in ('GMT', 'UTC', 'Etc/UTC') then
    raise exception 'Cron must run in UTC/GMT for the documented 03:10 UTC schedule';
  end if;
  if (select count(*) from vault.decrypted_secrets
      where name in ('report_deliver_secret', 'report_deliver_url')) <> 2 then
    raise exception 'Create the report_deliver_secret and report_deliver_url Vault secrets first';
  end if;
end;
$$;
select cron.schedule(
  'migratelens-report-delivery',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'report_deliver_url'),
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-deliver-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'report_deliver_secret')
    ),
    timeout_milliseconds := 150000
  );
  $job$
);
select cron.schedule(
  'migratelens-report-retention',
  '10 3 * * *',
  'select public.purge_expired_reports();'
);
commit;
