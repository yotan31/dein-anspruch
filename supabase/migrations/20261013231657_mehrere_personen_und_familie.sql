create table public.fall (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.mitglied (
  fall_id uuid not null references public.fall(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rolle text not null default 'mitglied' check (rolle in ('besitzer','mitglied')),
  email text,
  created_at timestamptz not null default now(),
  primary key (fall_id, user_id)
);
create index mitglied_user_idx on public.mitglied(user_id);
create table public.einladung (
  code text primary key default encode(extensions.gen_random_bytes(9),'hex'),
  fall_id uuid not null references public.fall(id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days',
  used_by uuid references auth.users(id) on delete set null
);
alter table public.belege add column fall_id uuid references public.fall(id) on delete cascade;
create index belege_fall_idx on public.belege(fall_id, jahr);

create or replace function public.ist_mitglied(f uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.mitglied m where m.fall_id = f and m.user_id = auth.uid());
$$;
create or replace function public.ist_besitzer(f uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.mitglied m where m.fall_id = f and m.user_id = auth.uid() and m.rolle = 'besitzer');
$$;
create or replace function public.ist_mitglied_pfad(p text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.mitglied m where m.fall_id::text = p and m.user_id = auth.uid());
$$;
revoke all on function public.ist_mitglied(uuid), public.ist_besitzer(uuid), public.ist_mitglied_pfad(text) from public, anon;
grant execute on function public.ist_mitglied(uuid), public.ist_besitzer(uuid), public.ist_mitglied_pfad(text) to authenticated;

create or replace function public.fall_besitzer_eintragen() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.mitglied(fall_id, user_id, rolle, email)
  values (new.id, new.created_by, 'besitzer', (select email from auth.users where id = new.created_by));
  return new;
end $$;
revoke all on function public.fall_besitzer_eintragen() from public, anon, authenticated;
create trigger fall_nach_anlegen after insert on public.fall for each row execute function public.fall_besitzer_eintragen();

alter table public.fall enable row level security;
alter table public.mitglied enable row level security;
alter table public.einladung enable row level security;
create policy "fall lesen" on public.fall for select to authenticated using (public.ist_mitglied(id) or created_by = (select auth.uid()));
create policy "fall anlegen" on public.fall for insert to authenticated with check (created_by = (select auth.uid()));
create policy "fall aendern" on public.fall for update to authenticated using (public.ist_mitglied(id)) with check (public.ist_mitglied(id));
create policy "fall loeschen" on public.fall for delete to authenticated using (public.ist_besitzer(id));
create policy "mitglieder sehen" on public.mitglied for select to authenticated using (public.ist_mitglied(fall_id));
create policy "mitglied entfernen" on public.mitglied for delete to authenticated using (user_id = (select auth.uid()) or public.ist_besitzer(fall_id));
grant select, insert, update, delete on public.fall to authenticated;
grant select, delete on public.mitglied to authenticated;
revoke all on public.fall, public.mitglied, public.einladung from anon;

create policy "belege des falls" on public.belege for all to authenticated
  using (public.ist_mitglied(fall_id)) with check (public.ist_mitglied(fall_id));

create policy "fallbelege lesen" on storage.objects for select to authenticated
  using (bucket_id = 'belege' and public.ist_mitglied_pfad((storage.foldername(name))[1]));
create policy "fallbelege hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'belege' and public.ist_mitglied_pfad((storage.foldername(name))[1]));
create policy "fallbelege aendern" on storage.objects for update to authenticated
  using (bucket_id = 'belege' and public.ist_mitglied_pfad((storage.foldername(name))[1]));
create policy "fallbelege loeschen" on storage.objects for delete to authenticated
  using (bucket_id = 'belege' and public.ist_mitglied_pfad((storage.foldername(name))[1]));

create or replace function public.einladung_erstellen(f uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if not public.ist_mitglied(f) then raise exception 'kein Zugriff'; end if;
  insert into public.einladung(fall_id, created_by) values (f, auth.uid()) returning code into c;
  return c;
end $$;
create or replace function public.einladung_annehmen(c text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare e public.einladung;
begin
  if auth.uid() is null then raise exception 'nicht angemeldet'; end if;
  select * into e from public.einladung where code = c;
  if e.code is null or e.expires_at < now() or (e.used_by is not null and e.used_by <> auth.uid()) then raise exception 'ungueltig'; end if;
  insert into public.mitglied(fall_id, user_id, rolle, email)
    values (e.fall_id, auth.uid(), 'mitglied', (select email from auth.users where id = auth.uid()))
    on conflict do nothing;
  update public.einladung set used_by = auth.uid() where code = c;
  return e.fall_id;
end $$;
revoke all on function public.einladung_erstellen(uuid), public.einladung_annehmen(text) from public, anon;
grant execute on function public.einladung_erstellen(uuid), public.einladung_annehmen(text) to authenticated;

-- Übernahme der Daten aus der ersten Version (eine Zeile pro Nutzer) in Fälle
insert into public.fall(data, created_by, updated_at)
  select f.data, f.user_id, f.updated_at from public.faelle f;

create or replace function public.vorlage_uebernehmen() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  select data into v from public.vorlagen where lower(email) = lower(new.email);
  if v is not null then
    insert into public.fall(data, created_by) values (v, new.id);
  end if;
  return new;
end $$;
