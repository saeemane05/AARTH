from __future__ import annotations

from datetime import date

import pandas as pd

from backend.market_intelligence.market_rates import fetch_msamb_data
from backend.market_intelligence.travel_expense import haversine, load_apmc_data


def live_market_prices(crop_key: str, latitude: float | None, longitude: float | None, top_n: int = 8) -> dict:
    """
    Adapter for the existing MSAMB/APMC implementation.

    It deliberately supplies an APMC dataframe directly so the price lookup
    does not depend on a logistics vehicle configuration. Buyer requirement
    creation must not require a vehicle to be configured first.
    """
    crop_key = (crop_key or "").strip().lower()
    if not crop_key:
        raise ValueError("Crop key is required.")

    apmc_df = load_apmc_data()

    if latitude is not None and longitude is not None:
        apmc_df = apmc_df.copy()
        apmc_df["distance_km"] = apmc_df.apply(
            lambda row: haversine(
                float(latitude),
                float(longitude),
                float(row["latitude"]),
                float(row["longitude"]),
            ),
            axis=1,
        )
        apmc_df = apmc_df.sort_values("distance_km").head(max(top_n * 2, top_n))
    else:
        apmc_df = apmc_df.head(max(top_n * 2, top_n)).copy()
        apmc_df["distance_km"] = None

    result_df = fetch_msamb_data(
        crop_en=crop_key,
        apmc_df=apmc_df,
        top_n=top_n,
    )

    if result_df.empty:
        raise RuntimeError("No recent APMC observations were returned for this crop.")

    # Restore the distance information by APMC code where available.
    if "distance_km" in apmc_df.columns:
        distances = {
            str(row["msamb_code"]): float(row["distance_km"])
            for _, row in apmc_df.iterrows()
            if pd.notna(row.get("distance_km"))
        }
    else:
        distances = {}

    rows = []
    for _, row in result_df.head(top_n).iterrows():
        code = str(row.get("apmc_code", ""))
        rows.append(
            {
                "apmc_code": code,
                "apmc_name": str(row.get("apmc_name", "")),
                "min_price": float(row["Min Price"]),
                "max_price": float(row["Max Price"]),
                "modal_price": float(row["Modal Price"]),
                "distance_km": distances.get(code),
                "reported_date": str(row.get("Date", "")),
            }
        )

    if not rows:
        raise RuntimeError("No usable APMC price observations were returned.")

    mins = [row["min_price"] for row in rows]
    maxs = [row["max_price"] for row in rows]
    modals = [row["modal_price"] for row in rows]

    return {
        "available": True,
        "crop_key": crop_key,
        "crop_name": str(result_df.iloc[0].get("crop", crop_key)),
        "as_of": date.today().isoformat(),
        "summary": {
            "min_price_per_quintal": min(mins),
            "max_price_per_quintal": max(maxs),
            "representative_modal_per_quintal": sorted(modals)[len(modals) // 2],
        },
        "apmcs": [
            {
                "apmc_code": row["apmc_code"],
                "apmc_name": row["apmc_name"],
                "min_price": row["min_price"],
                "max_price": row["max_price"],
                "modal_price": row["modal_price"],
                "distance_km": row["distance_km"],
                "reported_date": row["reported_date"],
            }
            for row in rows
        ],
    }
