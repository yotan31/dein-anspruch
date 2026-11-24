-- Erinnerungen zuverlässiger machen
-- 1) Der tägliche Aufruf wartete nur 5 Sekunden auf die Funktion (Standard von pg_net). Am 23.11.2026 brauchte sie
--    4,8 Sekunden, mit E-Mail-Versand an mehrere Familien reicht das nicht. Jetzt 60 Sekunden.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'erinnerungen-taeglich'),
  command := $cron$
  select net.http_post(
    url := 'https://ssamgluufgwsxvkyvaob.supabase.co/functions/v1/erinnerungen',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select v from intern.konfig where k='cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000);
$cron$);

-- 2) Ging eine E-Mail nicht raus, stand die Erinnerung trotzdem als „gesendet“ im Protokoll und kam nie.
--    Die Funktion nimmt den Eintrag jetzt damit zurück. Nur für die Funktion selbst (service_role).
create or replace function public.erinnerung_log_zurueck(u uuid, f uuid, key text) returns void
language sql security definer set search_path = '' as $$
  delete from intern.erinnerung_log where user_id = u and fall_id = f and schluessel = key;
$$;
revoke all on function public.erinnerung_log_zurueck(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.erinnerung_log_zurueck(uuid, uuid, text) to service_role;
