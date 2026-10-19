create table public.vorlagen (email text primary key, data jsonb not null);
alter table public.vorlagen enable row level security;
revoke all on public.vorlagen from anon, authenticated;
create or replace function public.vorlage_uebernehmen() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  select data into v from public.vorlagen where lower(email) = lower(new.email);
  if v is not null then
    insert into public.faelle(user_id, data) values (new.id, v) on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function public.vorlage_uebernehmen() from public, anon, authenticated;
create trigger vorlage_nach_registrierung after insert on auth.users
  for each row execute function public.vorlage_uebernehmen();
