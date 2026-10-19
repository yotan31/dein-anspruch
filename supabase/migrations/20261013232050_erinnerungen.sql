create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists intern;
revoke all on schema intern from anon, authenticated;
create table intern.konfig (k text primary key, v text not null);
insert into intern.konfig values ('cron_secret', encode(extensions.gen_random_bytes(24),'hex'));

create table public.erinnerung (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  aktiv boolean not null default true,
  email text not null,
  updated_at timestamptz not null default now()
);
alter table public.erinnerung enable row level security;
create policy "erinnerung eigene" on public.erinnerung for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.erinnerung to authenticated;
revoke all on public.erinnerung from anon;

create table intern.erinnerung_log (
  user_id uuid not null, fall_id uuid not null, schluessel text not null,
  gesendet_am timestamptz not null default now(),
  primary key (user_id, fall_id, schluessel)
);

create or replace function public.cron_secret_pruefen(s text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from intern.konfig where k='cron_secret' and v = s);
$$;
create or replace function public.erinnerung_log_neu(u uuid, f uuid, key text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  insert into intern.erinnerung_log(user_id, fall_id, schluessel) values (u, f, key);
  return true;
exception when unique_violation then return false;
end $$;
revoke all on function public.cron_secret_pruefen(text), public.erinnerung_log_neu(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.cron_secret_pruefen(text), public.erinnerung_log_neu(uuid,uuid,text) to service_role;

-- täglich 06:15 UTC die Edge Function "erinnerungen" aufrufen (mit geheimem Header)
select cron.schedule('erinnerungen-taeglich', '15 6 * * *', $cron$
  select net.http_post(
    url := 'https://ssamgluufgwsxvkyvaob.supabase.co/functions/v1/erinnerungen',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select v from intern.konfig where k='cron_secret')),
    body := '{}'::jsonb);
$cron$);
