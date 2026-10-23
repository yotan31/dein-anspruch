-- Rückmeldungen für die monatliche Auswertung: Art, Bereich der App, Stand der Bearbeitung
alter table public.rueckmeldung
  add column if not exists art text not null default 'idee' check (art in ('idee','fehler','lob','sonstiges')),
  add column if not exists bereich text check (char_length(bereich) <= 40),
  add column if not exists stand text not null default 'neu' check (stand in ('neu','geplant','erledigt','abgelehnt')),
  add column if not exists notiz text check (char_length(notiz) <= 2000),
  add column if not exists bewertet_am timestamptz;

-- Nutzerinnen und Nutzer dürfen nur ihre Nachricht senden, Stand und Notiz setzt nur die Auswertung
revoke insert on public.rueckmeldung from anon, authenticated;
grant insert (user_id, text, kontakt, version, art, bereich) on public.rueckmeldung to anon, authenticated;

create index if not exists rueckmeldung_created_idx on public.rueckmeldung(created_at);
