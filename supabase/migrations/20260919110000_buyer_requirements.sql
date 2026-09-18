create extension if not exists pgcrypto;

create table if not exists public.buyer_requirements (
    id uuid primary key default gen_random_uuid(),
    requirement_id text not null unique,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    buyer_id text,
    commodity_key text,
    commodity_name text,
    variety text,
    quantity numeric(14,3) check (quantity > 0),
    quantity_unit text check (quantity_unit in ('kg', 'quintal', 'ton')),
    quantity_kg numeric(16,3) check (quantity_kg > 0),
    quality_grade text,
    size_calibre text,
    quality_requirements text,
    delivery_location text,
    delivery_district text,
    delivery_taluka text,
    delivery_city text,
    delivery_latitude double precision,
    delivery_longitude double precision,
    delivery_start_date date,
    delivery_end_date date,
    packaging_requirement text default 'No specific requirement',
    target_price numeric(14,2) check (target_price >= 0),
    target_price_unit text check (target_price_unit in ('INR_PER_KG', 'INR_PER_QUINTAL', 'INR_PER_TON')),
    open_to_market_pricing boolean not null default false,
    additional_requirements text,
    status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'PAUSED', 'FULFILLED', 'CANCELLED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (delivery_end_date is null or delivery_start_date is null or delivery_start_date <= delivery_end_date)
);

create index if not exists buyer_requirements_user_status_idx on public.buyer_requirements(user_id, status);
create index if not exists buyer_requirements_commodity_idx on public.buyer_requirements(commodity_key, status);
create index if not exists buyer_requirements_delivery_idx on public.buyer_requirements(delivery_district, delivery_taluka, delivery_city);
create index if not exists buyer_requirements_dates_idx on public.buyer_requirements(delivery_start_date, delivery_end_date);

create or replace function public.new_buyer_requirement_id()
returns text language plpgsql as $$
declare candidate text;
begin
    loop
        candidate := 'BR-MH-' || lpad((floor(random() * 1000000))::text, 6, '0');
        exit when not exists (select 1 from public.buyer_requirements where requirement_id = candidate);
    end loop;
    return candidate;
end;
$$;

create or replace function public.set_buyer_requirement_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists buyer_requirements_updated_at on public.buyer_requirements;
create trigger buyer_requirements_updated_at before update on public.buyer_requirements for each row execute function public.set_buyer_requirement_updated_at();

alter table public.buyer_requirements enable row level security;
drop policy if exists "buyers_select_own_requirements" on public.buyer_requirements;
create policy "buyers_select_own_requirements" on public.buyer_requirements for select to authenticated using (auth.uid() = user_id);
drop policy if exists "buyers_insert_own_requirements" on public.buyer_requirements;
create policy "buyers_insert_own_requirements" on public.buyer_requirements for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "buyers_update_own_requirements" on public.buyer_requirements;
create policy "buyers_update_own_requirements" on public.buyer_requirements for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "buyers_delete_own_requirements" on public.buyer_requirements;
create policy "buyers_delete_own_requirements" on public.buyer_requirements for delete to authenticated using (auth.uid() = user_id);
