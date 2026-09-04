import pandas as pd

try:
    from .market_rates import fetch_msamb_data, crop_master
    from .travel_expense import nearby_apmcs_with_transport_cost
except ImportError:
    from market_rates import fetch_msamb_data, crop_master
    from travel_expense import nearby_apmcs_with_transport_cost


# -------------------------------------------------
# Helper: Menu Input
# -------------------------------------------------
def choose_option(prompt, options):
    print(f"\n{prompt}")
    for i, opt in enumerate(options, 1):
        print(f"{i}. {opt}")

    while True:
        choice = input("Enter choice number: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(options):
            return options[int(choice) - 1]
        print("❌ Invalid choice, try again.")


# -------------------------------------------------
# Core Net Profit Engine
# -------------------------------------------------
def calculate_net_profit(
    crop_en,
    quantity_quintal,
    farmer_lat,
    farmer_lon,
    vehicle_type,
    ownership,
    mileage_kmpl=None,
    fuel_type=None,
    rent_per_km=None
):
    crop_en = crop_en.lower().strip()

    if crop_en not in crop_master:
        raise ValueError("Crop not supported")

    # -----------------------------------------
    # 1️⃣ Nearby APMCs + transport cost range
    #    travel_expense already computes:
    #      transport_cost_min_rs  ← road_km - error (high=1-3km, low=3-5km) × 2 (round trip)
    #      transport_cost_max_rs  ← road_km + error × 2
    # -----------------------------------------
    apmc_df = pd.DataFrame()
    price_df = pd.DataFrame()
    merged = pd.DataFrame()
    last_error = None

    for top_n, max_radius_km in ((20, 120), (35, 150), (50, 180)):
        apmc_candidate_df = nearby_apmcs_with_transport_cost(
            farmer_lat=farmer_lat,
            farmer_lon=farmer_lon,
            vehicle_type=vehicle_type,
            ownership=ownership,
            mileage_kmpl=mileage_kmpl,
            fuel_type=fuel_type,
            rent_per_km=rent_per_km,
            top_n=top_n,
            max_radius_km=max_radius_km,
        )
        if apmc_candidate_df.empty:
            continue

        try:
            price_candidate_df = fetch_msamb_data(crop_en, apmc_candidate_df)
        except RuntimeError as exc:
            last_error = exc
            continue

        merged_candidate = apmc_candidate_df.merge(price_candidate_df, on="apmc_code", how="left")
        if "apmc_name_x" in merged_candidate.columns:
            merged_candidate["apmc_name"] = merged_candidate["apmc_name_x"]

        merged_candidate["Modal Price"] = pd.to_numeric(
            merged_candidate["Modal Price"].astype(str).str.replace(",", "", regex=False),
            errors="coerce"
        )
        priced_candidate = merged_candidate.dropna(subset=["Modal Price"])
        if priced_candidate.empty:
            last_error = RuntimeError("No price data for nearby APMCs")
            continue

        apmc_df = apmc_candidate_df
        price_df = price_candidate_df
        merged = priced_candidate
        break

    # -----------------------------------------
    # 2️⃣ Stop if no priced markets were found even after widening the search
    # -----------------------------------------
    if merged.empty:
        raise RuntimeError(str(last_error or "No price data for nearby APMCs"))

    # -----------------------------------------
    # 3️⃣ Display nearby markets with price
    # -----------------------------------------
    print("\n📍 Nearby Markets:\n")

    for _, row in apmc_df.iterrows():
        market = row["apmc_name"]
        dist   = row["distance_km"]
        conf   = str(row["confidence"]).strip().lower()
        tag    = "📍" if conf == "high" else "📌"

        price_row = price_df[price_df["apmc_code"] == row["apmc_code"]]

        if price_row.empty or pd.isna(price_row["Modal Price"].values[0]):
            print(f"{tag} {market:<24} | {dist:>6.1f} km | ⚠ No price data")
        else:
            price = int(price_row["Modal Price"].values[0])
            price_date = price_row["Date"].values[0] if "Date" in price_row.columns else ""
            print(f"{tag} {market:<24} | {dist:>6.1f} km | ₹{price}/qtl | {price_date}")

    # -----------------------------------------
    # 4️⃣ Profit RANGE using min/max transport cost
    #
    #   net_profit_max = revenue - transport_cost_MIN
    #     (best case: actual road is shorter than estimated)
    #
    #   net_profit_min = revenue - transport_cost_MAX
    #     (worst case: actual road is longer than estimated)
    #
    #   net_profit_avg = revenue - transport_cost_avg
    #     (midpoint estimate shown as the primary figure)
    #
    # Error margins applied in travel_expense.py:
    #   HIGH confidence location: ±1–3 km road error
    #   LOW  confidence location: ±3–5 km road error
    # -----------------------------------------
    revenue = merged["Modal Price"] * quantity_quintal

    merged["transport_cost_avg_rs"] = (
        merged["transport_cost_min_rs"] + merged["transport_cost_max_rs"]
    ) / 2

    merged["net_profit_max_rs"] = revenue - merged["transport_cost_min_rs"]  # low cost → high profit
    merged["net_profit_min_rs"] = revenue - merged["transport_cost_max_rs"]  # high cost → low profit
    merged["net_profit_avg_rs"] = revenue - merged["transport_cost_avg_rs"]

    # -----------------------------------------
    # 5️⃣ Sort by average profit (best first)
    # -----------------------------------------
    final = merged.sort_values("net_profit_avg_rs", ascending=False)

    # -----------------------------------------
    # 6️⃣ Select and rename columns
    # -----------------------------------------
    final = final[[
        "apmc_name",
        "apmc_code",
        "district",
        "latitude",
        "longitude",
        "distance_km",
        "route_duration_min",
        "route_path",
        "route_stops",
        "confidence",
        "Modal Price",
        "transport_cost_min_rs",
        "transport_cost_max_rs",
        "transport_cost_avg_rs",
        "net_profit_min_rs",
        "net_profit_avg_rs",
        "net_profit_max_rs",
    ]].rename(columns={"Modal Price": "price_per_quintal_rs"})

    return final.reset_index(drop=True)


# -------------------------------------------------
# Pretty print profit range table
# -------------------------------------------------
def print_profit_table(result):
    print("\n📊 Top 5 Best Markets — Profit Range:\n")

    header = (
        f"{'Market':<24}  {'Dist':>6}  {'Conf':<5}  "
        f"{'Price/qtl':>9}  {'Transport (Min–Max)':^22}  "
        f"{'Net Profit Range':^30}"
    )
    print(header)
    print("─" * len(header))

    for _, row in result.iterrows():
        conf_tag = "HIGH" if str(row["confidence"]).lower() == "high" else "LOW "
        transport_range = f"₹{int(row['transport_cost_min_rs']):,} – ₹{int(row['transport_cost_max_rs']):,}"
        profit_range    = f"₹{int(row['net_profit_min_rs']):,} – ₹{int(row['net_profit_max_rs']):,}"
        avg_profit      = f"(avg ₹{int(row['net_profit_avg_rs']):,})"

        print(
            f"{row['apmc_name']:<24}  "
            f"{row['distance_km']:>5.1f}km  "
            f"{conf_tag:<5}  "
            f"₹{int(row['price_per_quintal_rs']):>8,}  "
            f"{transport_range:^22}  "
            f"{profit_range}  {avg_profit}"
        )


# -------------------------------------------------
# CLI
# -------------------------------------------------
if __name__ == "__main__":

    print("\n🌾 SEVA – Net Profit Calculator\n")

    try:
        crop_list = list(crop_master.keys())
        crop_en   = choose_option("Select Crop:", crop_list)

        quantity_quintal = float(input("\nEnter quantity (quintal): "))
        farmer_lat       = float(input("Enter latitude: "))
        farmer_lon       = float(input("Enter longitude: "))

        vehicle_type = choose_option(
            "Select Vehicle Type:",
            ["tractor", "pickup", "tempo", "truck"]
        )

        ownership = choose_option("Ownership:", ["own", "rented"])

        mileage_kmpl = None
        fuel_type    = None
        rent_per_km  = None

        if ownership == "own":
            if vehicle_type != "tractor":
                fuel_type = choose_option("Fuel Type:", ["diesel", "cng"])
            else:
                fuel_type = "diesel"
            mileage_kmpl = float(input("Enter mileage: "))
        else:
            rent_per_km = float(input("Enter rent per km: "))

        print("\n🔄 Processing...\n")

        result = calculate_net_profit(
            crop_en=crop_en,
            quantity_quintal=quantity_quintal,
            farmer_lat=farmer_lat,
            farmer_lon=farmer_lon,
            vehicle_type=vehicle_type,
            ownership=ownership,
            mileage_kmpl=mileage_kmpl,
            fuel_type=fuel_type,
            rent_per_km=rent_per_km
        )

        print_profit_table(result)

    except Exception as e:
        print(f"\n❌ Error: {e}")
