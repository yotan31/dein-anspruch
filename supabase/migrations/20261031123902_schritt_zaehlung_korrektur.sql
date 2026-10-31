-- Korrektur: Parameter und Spalten heißen gleich (schritt, art); Variablen haben Vorrang, Konflikt über den Primärschlüssel
create or replace function public.zaehlen(schritt text, art text default '')
returns void language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
begin
  if schritt not in ('start','fragebogen_begonnen','fragebogen_fertig','antrag_geoeffnet','antrag_fertig','antrag_abgeschickt')
     or coalesce(art,'') !~ '^[a-z0-9_]{0,30}$' then return; end if;
  insert into public.zaehler as z (monat, schritt, art, anzahl)
  values (date_trunc('month', now() at time zone 'Europe/Berlin')::date, schritt, coalesce(art,''), 1)
  on conflict on constraint zaehler_pkey do update set anzahl = z.anzahl + 1;
end $$;
revoke all on function public.zaehlen(text, text) from public;
grant execute on function public.zaehlen(text, text) to anon, authenticated;
