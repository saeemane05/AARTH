create table if not exists public.logistics_vehicles (
    id uuid primary key default gen_random_uuid(),
    logistics_partner_id uuid not null references public.logistics_partners(id) on delete cascade,
    registration_number text not null,
    vehicle_type text not null,
    capacity_value numeric(12,3) not null check (capacity_value > 0),
    capacity_unit text not null check (capacity_unit in ('kg','quintal','ton')),
    rc_document_path text,
    insurance_document_path text,
    fitness_document_path text,
    document_status text not null default 'NOT_SUBMITTED' check (document_status in ('NOT_SUBMITTED','SUBMITTED','PARTIALLY_VERIFIED','VERIFIED')),
    created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
    unique (logistics_partner_id, registration_number)
);
create index if not exists logistics_vehicles_owner_idx on public.logistics_vehicles(logistics_partner_id);
alter table public.logistics_vehicles enable row level security;
drop policy if exists logistics_vehicles_own on public.logistics_vehicles;
create policy logistics_vehicles_own on public.logistics_vehicles for all to authenticated using (exists (select 1 from public.logistics_partners p where p.id=logistics_vehicles.logistics_partner_id and p.user_id=auth.uid())) with check (exists (select 1 from public.logistics_partners p where p.id=logistics_vehicles.logistics_partner_id and p.user_id=auth.uid()));
