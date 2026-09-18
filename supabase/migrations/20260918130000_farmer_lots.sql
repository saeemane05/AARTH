create extension if not exists pgcrypto;

create table if not exists public.farmer_lots (
    id uuid primary key default gen_random_uuid(),
    lot_id text not null unique,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    commodity_key text not null,
    commodity_name text not null,
    variety text,
    produce_form text not null default 'Fresh',
    quantity numeric(14,3) not null check (quantity > 0),
    quantity_unit text not null check (quantity_unit in ('kg','quintal','ton')),
    quantity_kg numeric(16,3) not null check (quantity_kg > 0),
    partial_sale_allowed boolean not null default false,
    minimum_sale_quantity_kg numeric(16,3),
    harvest_date date not null,
    grade text,
    size_calibre text,
    quality_measurements jsonb not null default '{}'::jsonb,
    pickup_district text not null,
    pickup_taluka text,
    pickup_village text not null,
    pickup_location_text text not null,
    pickup_latitude double precision,
    pickup_longitude double precision,
    location_source text not null default 'MANUAL_SEARCH',
    location_verified boolean not null default false,
    location_verified_at timestamptz,
    location_accuracy_m double precision,
    available_from date not null,
    pickup_until date not null,
    expected_price numeric(14,2) not null check (expected_price >= 0),
    expected_price_unit text not null default 'INR_PER_QUINTAL',
    price_negotiable boolean not null default true,
    payment_needed_by date not null,
    open_to_aggregation boolean not null default false,
    evidence jsonb not null default '[]'::jsonb,
    status text not null default 'ACTIVE' check (status in ('DRAFT','ACTIVE','RESERVED','PARTIALLY_SOLD','SOLD','CANCELLED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists farmer_lots_user_idx on public.farmer_lots(user_id, status);
create index if not exists farmer_lots_commodity_idx on public.farmer_lots(commodity_key, status);
create index if not exists farmer_lots_location_idx on public.farmer_lots(pickup_district, pickup_taluka, pickup_village);
create index if not exists farmer_lots_quantity_idx on public.farmer_lots(quantity_kg);
create index if not exists farmer_lots_availability_idx on public.farmer_lots(available_from, pickup_until);
create index if not exists farmer_lots_quality_gin_idx on public.farmer_lots using gin (quality_measurements);

create or replace function public.set_farmer_lot_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists farmer_lots_updated_at on public.farmer_lots;
create trigger farmer_lots_updated_at before update on public.farmer_lots for each row execute function public.set_farmer_lot_updated_at();

create or replace function public.new_farmer_lot_id()
returns text language plpgsql as $$
declare candidate text;
begin
    loop
        candidate := 'LOT-MH-' || lpad((floor(random() * 900000) + 100000)::text, 6, '0');
        exit when not exists (select 1 from public.farmer_lots where lot_id = candidate);
    end loop;
    return candidate;
end;
$$;

alter table public.farmer_lots enable row level security;
