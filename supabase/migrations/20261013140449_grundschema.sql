create table public.faelle (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.belege (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kat text not null default 'sonst', datum date, jahr int, betrag numeric(10,2),
  titel text not null default '', pfad text not null default '', ctype text not null default '',
  eingereicht boolean not null default false, created_at timestamptz not null default now()
);
create index belege_user_idx on public.belege(user_id, jahr);
alter table public.faelle enable row level security;
alter table public.belege enable row level security;
create policy "faelle eigene" on public.faelle for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "belege eigene" on public.belege for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.faelle, public.belege from anon;
grant select, insert, update, delete on public.faelle, public.belege to authenticated;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('belege','belege', false, 20971520, array['image/jpeg','image/png','image/webp','image/gif','application/pdf']);
create policy "belege lesen" on storage.objects for select to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "belege hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'belege' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "belege aendern" on storage.objects for update to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "belege loeschen" on storage.objects for delete to authenticated
  using (bucket_id = 'belege' and (storage.foldername(name))[1] = (select auth.uid())::text);
create or replace function public.ping() returns text language sql stable as $$ select 'ok' $$;
grant execute on function public.ping() to anon, authenticated;
