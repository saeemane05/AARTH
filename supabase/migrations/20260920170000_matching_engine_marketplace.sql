-- AARTH S5 — additive matching + price-range support.
-- No existing table is dropped or renamed.

alter table public.buyer_requirements
    add column if not exists target_price_min numeric(14,2),
    add column if not exists target_price_max numeric(14,2),
    add column if not exists price_mode text default 'PREFERRED_RANGE';

update public.buyer_requirements
set target_price_min = target_price,
    target_price_max = target_price
where target_price is not null
  and target_price_min is null
  and target_price_max is null;

alter table public.buyer_requirements
    drop constraint if exists buyer_requirements_price_mode_check;
alter table public.buyer_requirements
    add constraint buyer_requirements_price_mode_check
    check (price_mode in ('PREFERRED_RANGE','MAXIMUM','MARKET_LINKED'));

alter table public.buyer_requirements
    drop constraint if exists buyer_requirements_price_range_check;
alter table public.buyer_requirements
    add constraint buyer_requirements_price_range_check
    check (
        (target_price_min is null and target_price_max is null)
        or (target_price_min >= 0 and target_price_max >= target_price_min)
    );

create index if not exists buyer_requirements_matching_idx
    on public.buyer_requirements(commodity_key, status, delivery_start_date, delivery_end_date);

create index if not exists farmer_lots_matching_idx
    on public.farmer_lots(commodity_key, status, available_from, pickup_until, quantity_kg);

-- Keep matching reads server-side through the FastAPI service-role client.
-- Exact farmer/buyer coordinates and contact data are intentionally not exposed
-- by the matching discovery endpoints.
