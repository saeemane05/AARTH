alter table public.logistics_vehicles
  add column if not exists puc_document_path text,
  add column if not exists goods_carriage_permit_document_path text,
  add column if not exists rc_document_status text not null default 'NOT_SUBMITTED',
  add column if not exists insurance_document_status text not null default 'NOT_SUBMITTED',
  add column if not exists fitness_document_status text not null default 'NOT_SUBMITTED',
  add column if not exists puc_document_status text not null default 'NOT_SUBMITTED',
  add column if not exists goods_carriage_permit_document_status text not null default 'NOT_SUBMITTED';

alter table public.logistics_vehicles
  add constraint logistics_vehicle_document_status_check check (
    rc_document_status in ('NOT_SUBMITTED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED') and
    insurance_document_status in ('NOT_SUBMITTED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED') and
    fitness_document_status in ('NOT_SUBMITTED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED') and
    puc_document_status in ('NOT_SUBMITTED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED') and
    goods_carriage_permit_document_status in ('NOT_SUBMITTED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','EXPIRED')
  ) not valid;
