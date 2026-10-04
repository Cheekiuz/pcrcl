-- Owner profiles for Poodle Circle.
-- Run this once in the Supabase SQL editor for project uhcpystrtskoxwyzxyfn.
-- Emails also live in Authentication. This table keeps the profile next to the email.
-- Each owner can read and update only their own row.

create table if not exists public.owners (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  owner_name text not null,
  puppy_name text,
  color text,
  city text,
  about text,
  created_at timestamptz not null default now()
);

alter table public.owners enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on table public.owners to authenticated;

drop policy if exists "owners read own row" on public.owners;
create policy "owners read own row"
  on public.owners
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "owners insert own row" on public.owners;
create policy "owners insert own row"
  on public.owners
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "owners update own row" on public.owners;
create policy "owners update own row"
  on public.owners
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.owners (id, email, owner_name, puppy_name, color, city, about)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'owner_name', ''), 'Owner'),
    nullif(new.raw_user_meta_data->>'puppy_name', ''),
    nullif(new.raw_user_meta_data->>'color', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'about', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        owner_name = excluded.owner_name,
        puppy_name = excluded.puppy_name,
        color = excluded.color,
        city = excluded.city,
        about = excluded.about;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_owner();
