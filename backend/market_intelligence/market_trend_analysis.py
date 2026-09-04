import requests
from bs4 import BeautifulSoup
import pandas as pd
import math
import numpy as np
from sklearn.linear_model import LinearRegression

BASE = "https://www.msamb.com/ApmcDetail"
MAIN_PAGE = f"{BASE}/APMCPriceInformation"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": MAIN_PAGE
}

# =========================================
# 1️⃣ Haversine Distance
# =========================================
def calculate_distance(lat1, lon1, lat2, lon2):

    R = 6371

    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


# =========================================
# 2️⃣ Get Commodity Code
# =========================================
def get_commodity_code(name_mr):

    url = f"{BASE}/GetCommoditiesDistrictWisePriceInfo"

    r = requests.get(url, headers=HEADERS)

    for item in r.json():

        if item["CommodityNameM"].strip() == name_mr.strip():
            return item["CommodityCode"]

    raise ValueError("Commodity not found")


# =========================================
# 3️⃣ Fetch Price For One APMC
# =========================================
def fetch_apmc_price(session, commodity_code, apmc_code):

    url = (
        f"{BASE}/GetArrivalPriceInfoByDistrictWise"
        f"?commodityCode={commodity_code}&apmcCode={apmc_code}"
    )

    r = session.get(url, headers=HEADERS)

    soup = BeautifulSoup(r.text, "html.parser")

    rows = soup.find_all("tr")

    data = []
    current_date = None

    for row in rows:

        cells = row.find_all("td")
        values = [c.get_text(strip=True) for c in cells]

        # Date row
        if len(values) == 1 and "/" in values[0]:
            current_date = values[0]
            continue

        # Data rows
        if len(values) >= 7:

            market = values[0]
            variety = values[1]
            unit = values[2]
            arrival = values[3]
            min_price = values[4]
            max_price = values[5]
            modal_price = values[6]

            data.append([
                market,
                variety,
                unit,
                arrival,
                min_price,
                max_price,
                modal_price,
                current_date
            ])

    return data


# =========================================
# 4️⃣ Get Nearby APMCs
# =========================================
def get_nearby_apmcs(farmer_lat, farmer_lon, radius=30):

    geo_df = pd.read_csv("../where/apmc_locations_final.csv")

    geo_df.columns = geo_df.columns.str.strip().str.lower()

    lat_col = next((c for c in geo_df.columns if "lat" in c), None)
    lon_col = next((c for c in geo_df.columns if "lon" in c or "lng" in c), None)
    code_col = next((c for c in geo_df.columns if "code" in c), None)
    name_col = next((c for c in geo_df.columns if "name" in c), None)

    nearby_apmcs = []

    for _, row in geo_df.iterrows():

        try:
            apmc_lat = float(row[lat_col])
            apmc_lon = float(row[lon_col])
        except:
            continue

        distance = calculate_distance(
            farmer_lat,
            farmer_lon,
            apmc_lat,
            apmc_lon
        )

        if distance <= radius:

            nearby_apmcs.append({
                "ApmcCode": str(row[code_col]),
                "ApmcNameM": str(row[name_col]),
                "Distance": round(distance, 2)
            })

    return nearby_apmcs


# =========================================
# 5️⃣ Fetch Nearby Market Data
# =========================================
def fetch_nearby_market_data(commodity_mr, farmer_lat, farmer_lon):

    print("🔄 Getting Commodity Code...")
    commodity_code = get_commodity_code(commodity_mr)

    print("🔄 Finding APMCs within 30 km radius...")
    nearby_apmcs = get_nearby_apmcs(farmer_lat, farmer_lon)

    print(f"📍 Found {len(nearby_apmcs)} APMCs inside 30 km radius\n")

    session = requests.Session()
    session.get(MAIN_PAGE)

    all_rows = []

    print("🔄 Fetching Prices From Nearby APMCs...\n")

    for apmc in nearby_apmcs:

        apmc_code = apmc["ApmcCode"]
        apmc_name = apmc["ApmcNameM"]
        distance = apmc["Distance"]

        try:

            rows = fetch_apmc_price(session, commodity_code, apmc_code)

            for row in rows:

                row.insert(0, distance)
                row.insert(0, apmc_name)

                all_rows.append(row)

        except:
            continue

    columns = [
        "APMC Name",
        "Distance (km)",
        "Market",
        "Variety",
        "Unit",
        "Arrival",
        "Min Price",
        "Max Price",
        "Modal Price",
        "Date"
    ]

    df = pd.DataFrame(all_rows, columns=columns)

    # Clean Modal Price
    df["Modal Price"] = (
        df["Modal Price"]
        .astype(str)
        .str.replace(",", "", regex=False)
    )

    df["Modal Price"] = pd.to_numeric(df["Modal Price"], errors="coerce")

    # Clean Arrival
    df["Arrival"] = (
        df["Arrival"]
        .astype(str)
        .str.replace(",", "", regex=False)
    )

    df["Arrival"] = pd.to_numeric(df["Arrival"], errors="coerce")

    # Clean Date
    df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, errors="coerce")

    df = df.dropna(subset=["Modal Price", "Date"])

    df["Arrival"] = df["Arrival"].fillna(0)

    return df


# =========================================
# 6️⃣ Advanced Trend Analysis
# =========================================
def advanced_trend_analysis(df_last7):

    print("\n📊 Advanced 7-Day Market Analysis:\n")

    if df_last7.empty:
        print("\n⚠ No valid market data available for analysis.")
        return

    daily = (
        df_last7
        .groupby("Date")
        .agg({
            "Modal Price": "median",
            "Arrival": "sum"
        })
        .reset_index()
        .sort_values("Date")
    )

    print(daily)

    prices = daily["Modal Price"].values.reshape(-1, 1)
    arrivals = daily["Arrival"].values.reshape(-1, 1)

    X = np.arange(len(prices)).reshape(-1, 1)

    price_model = LinearRegression().fit(X, prices)
    arrival_model = LinearRegression().fit(X, arrivals)

    price_slope = price_model.coef_[0][0]
    arrival_slope = arrival_model.coef_[0][0]

    volatility = np.std(prices)

    if price_slope > 5 and arrival_slope < 0:
        decision = "WAIT"
        signal = "PRICE RISING, ARRIVAL FALLING"
    elif price_slope < -5 and arrival_slope > 0:
        decision = "SELL NOW"
        signal = "PRICE FALLING, ARRIVAL RISING"
    else:
        decision = "HOLD / MONITOR"
        signal = "UNCERTAIN MARKET"

    confidence = min(int((abs(price_slope) / 20) * 100), 95)

    risk_score = min(
        int((volatility / prices.mean()) * 100),
        100
    )

    print("\nTrend Direction:", signal)
    print("Price Slope:", round(price_slope, 2))
    print("Arrival Slope:", round(arrival_slope, 2))
    print("Volatility:", round(volatility, 2))
    print("Confidence Score:", confidence, "%")
    print("Market Risk Score:", risk_score, "/100")

    print("\n📌 Recommendation:", decision)


# =========================================
# MAIN
# =========================================
def main():

    commodity = input("Enter crop (Marathi): ").strip()

    farmer_lat = float(input("Enter farmer latitude: "))
    farmer_lon = float(input("Enter farmer longitude: "))

    df = fetch_nearby_market_data(
        commodity,
        farmer_lat,
        farmer_lon
    )

    print("\n✅ Total Records Collected:", len(df))

    today = pd.Timestamp.today().normalize()
    seven_days_ago = today - pd.Timedelta(days=7)

    df_last7 = df[
        (df["Date"] >= seven_days_ago) &
        (df["Date"] <= today)
    ]

    print("\n📅 Records from Last 7 Days:", len(df_last7))

    advanced_trend_analysis(df_last7)


if __name__ == "__main__":
    main()