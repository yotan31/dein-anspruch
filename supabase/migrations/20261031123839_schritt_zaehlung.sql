-- Anonyme Schritt-Zählung: nur Monat, Schritt, Antrag-Art und Anzahl.
-- Keine Personen-Kennung, keine Uhrzeit, keine Gesundheitsangaben. Lesen nur über die Auswertung (service_role).
create table if not exists public.zaehler (
  monat date not null,
  schritt text not null check (schritt in ('start','fragebogen_begonnen','fragebogen_fertig','antrag_geoeffnet','antrag_fertig','antrag_abgeschickt')),
  art text not null default '' check (art ~ '^[a-z0-9_]{0,30}$'),
  anzahl integer not null default 0,
  primary key (monat, schritt, art)
);
alter table public.zaehler enable row level security;
revoke all on public.zaehler from anon, authenticated;

-- Zählt einen Schritt im laufenden Monat hoch. Unbekannte Schritte oder Arten werden ignoriert.
create or replace function public.zaehlen(schritt text, art text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if schritt not in ('start','fragebogen_begonnen','fragebogen_fertig','antrag_geoeffnet','antrag_fertig','antrag_abgeschickt')
     or coalesce(art,'') !~ '^[a-z0-9_]{0,30}$' then return; end if;
  insert into public.zaehler(monat, schritt, art, anzahl)
  values (date_trunc('month', now() at time zone 'Europe/Berlin')::date, schritt, coalesce(art,''), 1)
  on conflict (monat, schritt, art) do update set anzahl = public.zaehler.anzahl + 1;
end $$;
revoke all on function public.zaehlen(text, text) from public;
grant execute on function public.zaehlen(text, text) to anon, authenticated;
