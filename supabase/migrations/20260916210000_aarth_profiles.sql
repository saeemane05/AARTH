-- =========================================================
-- AARTH S1
-- COMMON PROFILE TABLE
-- =========================================================

create extension if not exists pgcrypto;


create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        unique
        references auth.users(id)
        on delete cascade,

    username text not null unique,

    role text not null,

    farmer_id text,

    aarth_id text unique,

    profile_data jsonb not null
        default '{}'::jsonb,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);


-- =========================================================
-- ADDITIVE COLUMNS
-- =========================================================

alter table public.profiles
add column if not exists farmer_id text;

alter table public.profiles
add column if not exists aarth_id text;

alter table public.profiles
add column if not exists profile_data jsonb
not null default '{}'::jsonb;

alter table public.profiles
add column if not exists status text
not null default 'ACTIVE';

alter table public.profiles
add column if not exists created_at timestamptz
not null default now();

alter table public.profiles
add column if not exists updated_at timestamptz
not null default now();


-- =========================================================
-- INDEXES
-- =========================================================

create unique index if not exists
profiles_aarth_id_key
on public.profiles(aarth_id)
where aarth_id is not null;


create unique index if not exists
profiles_username_lower_key
on public.profiles(lower(username));


create unique index if not exists
profiles_farmer_id_key
on public.profiles(farmer_id)
where farmer_id is not null;


create index if not exists
profiles_user_id_idx
on public.profiles(user_id);


create index if not exists
profiles_role_idx
on public.profiles(role);


-- =========================================================
-- ROLE VALIDATION
-- =========================================================

alter table public.profiles
drop constraint if exists profiles_role_check;


alter table public.profiles
add constraint profiles_role_check
check (
    role in (
        'FARMER',
        'FPO',
        'BUYER',
        'LOGISTICS_PARTNER',
        'STORAGE_PARTNER',
        'ADMIN'
    )
);


-- =========================================================
-- STATUS VALIDATION
-- =========================================================

alter table public.profiles
drop constraint if exists profiles_status_check;


alter table public.profiles
add constraint profiles_status_check
check (
    status in (
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED'
    )
);


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles
enable row level security;


drop policy if exists
"profiles_select_own"
on public.profiles;


create policy
"profiles_select_own"
on public.profiles
for select
to authenticated
using (
    auth.uid() = user_id
);


-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function
public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();

    return new;
end;
$$;


drop trigger if exists
profiles_updated_at
on public.profiles;


create trigger
profiles_updated_at
before update
on public.profiles
for each row
execute function
public.set_profiles_updated_at();