-- Sicherheitsprüfung November 2026
--
-- 1. Belege: Zugriff nur noch über den Fall.
--    Die alte Regel „belege eigene“ (user_id = angemeldete Person) stammt aus der Zeit vor den gemeinsamen Fällen.
--    Sie hatte zwei Folgen: Wer aus einer Familie entfernt wurde, sah die selbst angelegten Belege dieses Falls weiter,
--    und man konnte eigene Belege an einen fremden Fall hängen (fall_id frei wählbar). Alle Belege haben einen Fall.
drop policy if exists "belege eigene" on public.belege;

-- 2. Fotospeicher: Ordner sind Fälle. Die alten Regeln für Ordner = Nutzer-ID werden nicht mehr gebraucht
--    (es liegt keine Datei mehr darin) und erlaubten unnötig das Hochladen außerhalb eines Falls.
drop policy if exists "belege lesen" on storage.objects;
drop policy if exists "belege hochladen" on storage.objects;
drop policy if exists "belege aendern" on storage.objects;
drop policy if exists "belege loeschen" on storage.objects;

-- 3. Vorlagen erst nach bestätigter E-Mail übernehmen.
--    Bisher wurde eine vorbereitete Vorlage schon beim Registrieren in das neue Konto kopiert. Wer die E-Mail-Adresse
--    einer Familie kennt, hätte so ein unbestätigtes Konto mit deren Daten anlegen können. Jetzt erst, wenn die
--    Adresse bestätigt ist (beim Registrieren schon bestätigt, z. B. über Google, oder später per Bestätigungslink).
create or replace function public.vorlage_uebernehmen() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then return new; end if;
  select data into v from public.vorlagen where lower(email) = lower(new.email);
  if v is not null then insert into public.fall(data, created_by) values (v, new.id); end if;
  return new;
end $$;
revoke all on function public.vorlage_uebernehmen() from public, anon, authenticated;

drop trigger if exists vorlage_nach_registrierung on auth.users;
create trigger vorlage_nach_registrierung after insert on auth.users
  for each row execute function public.vorlage_uebernehmen();
drop trigger if exists vorlage_nach_bestaetigung on auth.users;
create trigger vorlage_nach_bestaetigung after update of email_confirmed_at on auth.users
  for each row execute function public.vorlage_uebernehmen();
