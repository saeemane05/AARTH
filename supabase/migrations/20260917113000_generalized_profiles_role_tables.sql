-- =========================================================
-- AARTH S1 — GENERALIZED PROFILE + ROLE IDENTITY TABLES
-- SAFE MIGRATION
-- =========================================================
-- public.profiles = generalized identity/auth mapping.
-- Role tables = role-specific identity records.
-- Supabase Auth remains the source of truth for credentials.
--
-- IMPORTANT:
-- This migration preserves the OLD profiles.farmer_id value by
-- copying it into public.farmers BEFORE removing the old column.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1. Generalized AARTH identity
-- ---------------------------------------------------------

alter table public.profiles
    add column if not exists aarth_id text;

create index if not exists profiles_user_id_idx
    on public.profiles(user_id);

create index if not exists profiles_role_idx
    on public.profiles(role);

create or replace function public.new_aarth_id()
returns text
language plpgsql
as $$
declare
    candidate text;
begin
    loop
        candidate := 'AAR-MH-' ||
            lpad((floor(random() * 90000) + 10000)::text, 5, '0');

        exit when not exists (
            select 1
            from public.profiles
            where aarth_id = candidate
        );
    end loop;

    return candidate;
end;
$$;

create or replace function public.set_profile_aarth_id()
returns trigger
language plpgsql
as $$
begin
    if new.aarth_id is null
       or btrim(new.aarth_id) = '' then

        new.aarth_id := public.new_aarth_id();

    end if;

    return new;
end;
$$;

drop trigger if exists
profiles_aarth_id_before_insert
on public.profiles;

create trigger
profiles_aarth_id_before_insert
before insert on public.profiles
for each row
execute function public.set_profile_aarth_id();


-- ---------------------------------------------------------
-- 2. Create role-specific identity tables
-- ---------------------------------------------------------

create table if not exists public.farmers (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    farmer_id text not null unique,

    username text not null,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create table if not exists public.fpos (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    fpo_id text not null unique,

    username text not null,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create table if not exists public.buyers (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    buyer_id text not null unique,

    username text not null,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create table if not exists public.logistics_partners (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    logistics_partner_id text not null unique,

    username text not null,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);

create table if not exists public.storage_partners (
    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null unique
        references public.profiles(id)
        on delete cascade,

    user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    storage_partner_id text not null unique,

    username text not null,

    status text not null
        default 'ACTIVE',

    created_at timestamptz not null
        default now(),

    updated_at timestamptz not null
        default now()
);


-- ---------------------------------------------------------
-- 3. Role ID generator
-- ---------------------------------------------------------

create or replace function public.new_role_id(prefix text)
returns text
language plpgsql
as $$
declare
    candidate text;
begin
    loop
        candidate :=
            prefix ||
            '-MH-' ||
            lpad(
                (floor(random() * 90000) + 10000)::text,
                5,
                '0'
            );

        exit when not exists (
            select 1
            from public.farmers
            where farmer_id = candidate

            union all

            select 1
            from public.fpos
            where fpo_id = candidate

            union all

            select 1
            from public.buyers
            where buyer_id = candidate

            union all

            select 1
            from public.logistics_partners
            where logistics_partner_id = candidate

            union all

            select 1
            from public.storage_partners
            where storage_partner_id = candidate
        );
    end loop;

    return candidate;
end;
$$;


-- ---------------------------------------------------------
-- 4. BACKFILL EXISTING USERS
-- ---------------------------------------------------------
-- This section runs BEFORE profiles.farmer_id is removed.
--
-- Existing farmer_id is preserved when present.
-- Existing role-prefixed aarth_id values are also preserved
-- as role IDs when appropriate.
-- ---------------------------------------------------------

insert into public.farmers (
    profile_id,
    user_id,
    farmer_id,
    username,
    status
)
select
    p.id,
    p.user_id,

    case
        when p.farmer_id is not null
             and btrim(p.farmer_id) <> ''
            then p.farmer_id

        when p.aarth_id like 'FRM-MH-%'
            then p.aarth_id

        else public.new_role_id('FRM')
    end,

    p.username,
    p.status

from public.profiles p
where p.role = 'FARMER'

on conflict (profile_id) do nothing;


insert into public.fpos (
    profile_id,
    user_id,
    fpo_id,
    username,
    status
)
select
    p.id,
    p.user_id,

    case
        when p.aarth_id like 'FPO-MH-%'
            then p.aarth_id
        else public.new_role_id('FPO')
    end,

    p.username,
    p.status

from public.profiles p
where p.role = 'FPO'

on conflict (profile_id) do nothing;


insert into public.buyers (
    profile_id,
    user_id,
    buyer_id,
    username,
    status
)
select
    p.id,
    p.user_id,

    case
        when p.aarth_id like 'BUY-MH-%'
            then p.aarth_id
        else public.new_role_id('BUY')
    end,

    p.username,
    p.status

from public.profiles p
where p.role = 'BUYER'

on conflict (profile_id) do nothing;


insert into public.logistics_partners (
    profile_id,
    user_id,
    logistics_partner_id,
    username,
    status
)
select
    p.id,
    p.user_id,

    case
        when p.aarth_id like 'LOG-MH-%'
            then p.aarth_id
        else public.new_role_id('LOG')
    end,

    p.username,
    p.status

from public.profiles p
where p.role = 'LOGISTICS_PARTNER'

on conflict (profile_id) do nothing;


insert into public.storage_partners (
    profile_id,
    user_id,
    storage_partner_id,
    username,
    status
)
select
    p.id,
    p.user_id,

    case
        when p.aarth_id like 'STR-MH-%'
            then p.aarth_id
        else public.new_role_id('STR')
    end,

    p.username,
    p.status

from public.profiles p
where p.role = 'STORAGE_PARTNER'

on conflict (profile_id) do nothing;


-- ---------------------------------------------------------
-- 5. Normalize common profile identity
-- ---------------------------------------------------------
-- profiles.aarth_id is GENERALIZED.
-- It must not contain FRM-/BUY-/FPO-/LOG-/STR- IDs.

update public.profiles
set aarth_id = public.new_aarth_id()
where aarth_id is null
   or aarth_id !~ '^AAR-MH-[0-9]{5}$';


create unique index if not exists
profiles_aarth_id_key
on public.profiles(aarth_id)
where aarth_id is not null;


-- ---------------------------------------------------------
-- 6. Remove obsolete farmer-specific column
-- ---------------------------------------------------------

alter table public.profiles
    drop constraint if exists profiles_farmer_id_key;

drop index if exists profiles_farmer_id_key;

alter table public.profiles
    drop column if exists farmer_id;


-- ---------------------------------------------------------
-- 7. Automatically create role identity for NEW profiles
-- ---------------------------------------------------------

create or replace function
public.create_role_identity_from_profile()
returns trigger
language plpgsql
as $$
begin

    if new.role = 'FARMER' then

        insert into public.farmers (
            profile_id,
            user_id,
            farmer_id,
            username,
            status
        )
        values (
            new.id,
            new.user_id,
            public.new_role_id('FRM'),
            new.username,
            new.status
        )
        on conflict (profile_id) do nothing;


    elsif new.role = 'FPO' then

        insert into public.fpos (
            profile_id,
            user_id,
            fpo_id,
            username,
            status
        )
        values (
            new.id,
            new.user_id,
            public.new_role_id('FPO'),
            new.username,
            new.status
        )
        on conflict (profile_id) do nothing;


    elsif new.role = 'BUYER' then

        insert into public.buyers (
            profile_id,
            user_id,
            buyer_id,
            username,
            status
        )
        values (
            new.id,
            new.user_id,
            public.new_role_id('BUY'),
            new.username,
            new.status
        )
        on conflict (profile_id) do nothing;


    elsif new.role = 'LOGISTICS_PARTNER' then

        insert into public.logistics_partners (
            profile_id,
            user_id,
            logistics_partner_id,
            username,
            status
        )
        values (
            new.id,
            new.user_id,
            public.new_role_id('LOG'),
            new.username,
            new.status
        )
        on conflict (profile_id) do nothing;


    elsif new.role = 'STORAGE_PARTNER' then

        insert into public.storage_partners (
            profile_id,
            user_id,
            storage_partner_id,
            username,
            status
        )
        values (
            new.id,
            new.user_id,
            public.new_role_id('STR'),
            new.username,
            new.status
        )
        on conflict (profile_id) do nothing;

    end if;

    return new;

end;
$$;


drop trigger if exists
profiles_role_identity_after_insert
on public.profiles;

create trigger
profiles_role_identity_after_insert
after insert on public.profiles
for each row
execute function
public.create_role_identity_from_profile();


-- ---------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------

alter table public.farmers enable row level security;
alter table public.fpos enable row level security;
alter table public.buyers enable row level security;
alter table public.logistics_partners enable row level security;
alter table public.storage_partners enable row level security;


drop policy if exists
"farmers_select_own"
on public.farmers;

create policy
"farmers_select_own"
on public.farmers
for select
to authenticated
using (
    auth.uid() = user_id
);


drop policy if exists
"fpos_select_own"
on public.fpos;

create policy
"fpos_select_own"
on public.fpos
for select
to authenticated
using (
    auth.uid() = user_id
);


drop policy if exists
"buyers_select_own"
on public.buyers;

create policy
"buyers_select_own"
on public.buyers
for select
to authenticated
using (
    auth.uid() = user_id
);


drop policy if exists
"logistics_select_own"
on public.logistics_partners;

create policy
"logistics_select_own"
on public.logistics_partners
for select
to authenticated
using (
    auth.uid() = user_id
);


drop policy if exists
"storage_select_own"
on public.storage_partners;

create policy
"storage_select_own"
on public.storage_partners
for select
to authenticated
using (
    auth.uid() = user_id
);


-- ---------------------------------------------------------
-- 9. Updated-at triggers
-- ---------------------------------------------------------

create or replace function
public.set_role_identity_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists farmers_updated_at
on public.farmers;

create trigger farmers_updated_at
before update on public.farmers
for each row
execute function public.set_role_identity_updated_at();


drop trigger if exists fpos_updated_at
on public.fpos;

create trigger fpos_updated_at
before update on public.fpos
for each row
execute function public.set_role_identity_updated_at();


drop trigger if exists buyers_updated_at
on public.buyers;

create trigger buyers_updated_at
before update on public.buyers
for each row
execute function public.set_role_identity_updated_at();


drop trigger if exists logistics_partners_updated_at
on public.logistics_partners;

create trigger logistics_partners_updated_at
before update on public.logistics_partners
for each row
execute function public.set_role_identity_updated_at();


drop trigger if exists storage_partners_updated_at
on public.storage_partners;

create trigger storage_partners_updated_at
before update on public.storage_partners
for each row
execute function public.set_role_identity_updated_at();
