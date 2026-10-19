-- Fehlerprotokoll: nur schreiben, nie lesen (über die API). Keine personenbezogenen Daten.
create table if not exists public.fehler (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  meldung text not null check (char_length(meldung) <= 500),
  stelle text check (char_length(stelle) <= 1500),
  seite text check (char_length(seite) <= 100),
  version text check (char_length(version) <= 20),
  geraet text check (char_length(geraet) <= 200)
);
alter table public.fehler enable row level security;
create policy "fehler melden" on public.fehler for insert to anon, authenticated with check (true);
grant insert on public.fehler to anon, authenticated;

-- Rückmeldungen der Nutzer
create table if not exists public.rueckmeldung (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid() references auth.users(id) on delete set null,
  text text not null check (char_length(text) between 2 and 3000),
  kontakt text check (char_length(kontakt) <= 200),
  version text check (char_length(version) <= 20)
);
alter table public.rueckmeldung enable row level security;
create policy "rueckmeldung senden" on public.rueckmeldung for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
grant insert on public.rueckmeldung to anon, authenticated;
create index if not exists rueckmeldung_user_idx on public.rueckmeldung(user_id);

-- Indizes für Fremdschlüssel (Hinweise des Supabase-Prüfers)
create index if not exists einladung_created_by_idx on public.einladung(created_by);
create index if not exists einladung_fall_idx on public.einladung(fall_id);
create index if not exists einladung_used_by_idx on public.einladung(used_by);
create index if not exists fall_created_by_idx on public.fall(created_by);

-- Fehlerprotokoll nach 90 Tagen automatisch löschen
select cron.schedule('fehler-aufraeumen', '30 3 * * *', $$delete from public.fehler where created_at < now() - interval '90 days'$$);
