-- AARTH: buyer requirement fields required by the matching engine.

-- Additive migration: no existing data is deleted.



alter table public.buyer_requirements

    add column if not exists target_price_min numeric(14,2),

    add column if not exists target_price_max numeric(14,2),

    add column if not exists price_mode text not null default 'PREFERRED_RANGE';



update public.buyer_requirements

set target_price_min = coalesce(target_price_min, target_price),

    target_price_max = coalesce(target_price_max, target_price)

where target_price is not null;



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