create table if not exists public.assisted_onboarding (
    id uuid primary key default gen_random_uuid(),
    local_id text not null unique,
    farmer_id text not null references public.farmers(farmer_id),
    operator_user_id uuid not null references auth.users(id),
    onboarding_data jsonb not null default '{}'::jsonb,
    status text not null default 'SYNCED',
    created_at timestamptz not null default now(),
    synced_at timestamptz not null default now()
);

create index if not exists assisted_onboarding_farmer_idx
on public.assisted_onboarding(farmer_id);