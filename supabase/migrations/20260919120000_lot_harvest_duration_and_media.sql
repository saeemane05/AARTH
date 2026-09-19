-- Keep legacy harvest_date data intact while new lots use an explicit duration.
alter table public.farmer_lots
    add column if not exists harvest_duration_min_days integer,
    add column if not exists harvest_duration_max_days integer;

alter table public.farmer_lots
    alter column harvest_date drop not null;

alter table public.farmer_lots
    drop constraint if exists farmer_lots_harvest_duration_range_check;
alter table public.farmer_lots
    add constraint farmer_lots_harvest_duration_range_check check (
        (harvest_duration_min_days is null and harvest_duration_max_days is null)
        or (harvest_duration_min_days between 1 and 365
            and harvest_duration_max_days between harvest_duration_min_days and 365)
    );

alter table public.lot_evidence
    add column if not exists media_type text not null default 'PHOTO'
        check (media_type in ('PHOTO', 'VIDEO'));

alter table public.lot_evidence
    drop constraint if exists lot_evidence_sequence_number_check;
alter table public.lot_evidence
    add constraint lot_evidence_sequence_number_check check (sequence_number between 1 and 6);
