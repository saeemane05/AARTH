create extension if not exists pgcrypto;

alter table public.farmer_lots
    add column if not exists evidence_status text not null default 'PENDING'
        check (evidence_status in ('PENDING', 'SUBMITTED', 'FAILED'));

alter table public.farmer_lots
    add column if not exists verification_status text not null default 'NOT_VERIFIED'
        check (verification_status in ('DRAFT', 'EVIDENCE_REQUIRED', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'NOT_VERIFIED'));

create table if not exists public.lot_evidence (
    id uuid primary key default gen_random_uuid(),
    lot_id uuid not null references public.farmer_lots(id) on delete cascade,
    sequence_number integer not null check (sequence_number between 1 and 5),
    storage_path text not null,
    captured_at_client timestamptz not null,
    uploaded_at_server timestamptz not null default now(),
    latitude double precision not null check (latitude between -90 and 90),
    longitude double precision not null check (longitude between -180 and 180),
    gps_accuracy double precision not null check (gps_accuracy >= 0),
    capture_source text not null default 'aarth_camera' check (capture_source = 'aarth_camera'),
    status text not null default 'SUBMITTED' check (status in ('PENDING', 'UPLOADING', 'SUBMITTED', 'FAILED')),
    created_at timestamptz not null default now(),
    unique (lot_id, sequence_number)
);

create index if not exists lot_evidence_lot_idx on public.lot_evidence(lot_id);

insert into storage.buckets (id, name, public)
values ('lot-evidence', 'lot-evidence', false)
on conflict (id) do nothing;

alter table public.lot_evidence enable row level security;

create policy "Farmers read own lot evidence"
on public.lot_evidence for select
using (
    exists (
        select 1 from public.farmer_lots
        where farmer_lots.id = lot_evidence.lot_id
          and farmer_lots.user_id = auth.uid()
    )
);