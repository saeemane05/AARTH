-- AARTH FPO foundation: public.fpos remains the ONE FPO organisation table.

-- Existing role-identity rows are retained and extended; no fpo_* tables are added.



alter table public.fpos

  add column if not exists fpo_name text,

  add column if not exists organisation_type text,

  add column if not exists registration_number text,

  add column if not exists state text not null default 'Maharashtra',

  add column if not exists district text,

  add column if not exists taluka text,

  add column if not exists village text,

  add column if not exists address text,

  add column if not exists crops jsonb not null default '[]'::jsonb,

  add column if not exists source_data jsonb not null default '{}'::jsonb,

  add column if not exists verification_data jsonb not null default '{}'::jsonb,

  add column if not exists claim_data jsonb not null default '{}'::jsonb,

  add column if not exists staff_data jsonb not null default '[]'::jsonb,

  add column if not exists membership_data jsonb not null default '[]'::jsonb,

  add column if not exists invite_data jsonb not null default '[]'::jsonb,

  add column if not exists primary_admin_user_id uuid references auth.users(id) on delete set null,

  add column if not exists activation_status text not null default 'GOVERNMENT_LISTED',

  add column if not exists claim_status text not null default 'UNCLAIMED',

  add column if not exists verification_status text not null default 'SOURCE_LISTED';



-- Master records may be ingested before an AARTH user claims them.

alter table public.fpos alter column profile_id drop not null;

alter table public.fpos alter column user_id drop not null;

alter table public.fpos alter column username drop not null;



do $$ begin

  if not exists (select 1 from pg_constraint where conname = 'fpos_activation_status_check') then

    alter table public.fpos add constraint fpos_activation_status_check check (activation_status in ('GOVERNMENT_LISTED','PENDING_VERIFICATION','ACTIVATED','SUSPENDED')) not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_claim_status_check') then

    alter table public.fpos add constraint fpos_claim_status_check check (claim_status in ('UNCLAIMED','PENDING','APPROVED','REJECTED')) not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_verification_status_check') then

    alter table public.fpos add constraint fpos_verification_status_check check (verification_status in ('SOURCE_LISTED','RECORD_MATCHED','AARTH_VERIFIED','REJECTED')) not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_crops_array_check') then

    alter table public.fpos add constraint fpos_crops_array_check check (jsonb_typeof(crops) = 'array') not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_staff_array_check') then

    alter table public.fpos add constraint fpos_staff_array_check check (jsonb_typeof(staff_data) = 'array') not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_memberships_array_check') then

    alter table public.fpos add constraint fpos_memberships_array_check check (jsonb_typeof(membership_data) = 'array') not valid;

  end if;

  if not exists (select 1 from pg_constraint where conname = 'fpos_invites_array_check') then

    alter table public.fpos add constraint fpos_invites_array_check check (jsonb_typeof(invite_data) = 'array') not valid;

  end if;

end $$;



create index if not exists fpos_discovery_idx on public.fpos (district, taluka, activation_status);

create index if not exists fpos_name_idx on public.fpos (lower(fpo_name));

create index if not exists fpos_crops_gin_idx on public.fpos using gin (crops);