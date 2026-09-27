import pandas as pd
import math
import requests
import threading
import time
from pathlib import Path

DIESEL_PRICE = 95
CNG_PRICE = 75
ROUND_TRIP = True

MILEAGE_RANGES = {
    "tractor": (3, 8),
    "pickup":  (5, 20),
    "tempo":   (6, 16),
    "truck":   (3, 7)
}

RENT_RANGES = {
    "tractor": (10, 30),
    "pickup":  (10, 35),
    "tempo":   (15, 45),
    "truck":   (20, 70)
}

ROUTE_CACHE_TTL_SECONDS = 30 * 60
_ROUTE_CACHE_LOCK = threading.Lock()
_ROUTE_CACHE = {}
_APMC_DATA_CACHE = None
OSRM_DISTANCE_TIMEOUT_SECONDS = 3
OSRM_ROUTE_TIMEOUT_SECONDS = 4
ROUTE_CANDIDATE_BUFFER = 6
MIN_ROUTE_CANDIDATES = 12

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _cache_key(prefix, lat1, lon1, lat2, lon2):
    return (
        prefix,
        round(float(lat1), 5),
        round(float(lon1), 5),
        round(float(lat2), 5),
        round(float(lon2), 5),
    )


def _cache_get(key):
    with _ROUTE_CACHE_LOCK:
        cached = _ROUTE_CACHE.get(key)
        if not cached:
            return None, False
        if time.time() - cached["ts"] > ROUTE_CACHE_TTL_SECONDS:
            _ROUTE_CACHE.pop(key, None)
            return None, False
        return cached["value"], True


def _cache_set(key, value):
    with _ROUTE_CACHE_LOCK:
        _ROUTE_CACHE[key] = {"value": value, "ts": time.time()}


def get_road_distance(lat1, lon1, lat2, lon2):
    """
    Returns on-road distance in km using the OSRM public server.
    Falls back to None if the server is unavailable.

    UPGRADE OPTIONS (replace this function body):

    Option A - GraphHopper (free 500 req/day, no setup):
        import requests
        url = f"https://graphhopper.com/api/1/route?point={lat1},{lon1}&point={lat2},{lon2}&vehicle=car&key=YOUR_KEY"
        r = requests.get(url, timeout=10)
        return r.json()["paths"][0]["distance"] / 1000

    Option B - Google Maps Distance Matrix (paid, most accurate for India):
        import googlemaps
        gmaps = googlemaps.Client(key="YOUR_GOOGLE_KEY")
        result = gmaps.distance_matrix((lat1, lon1), (lat2, lon2), mode="driving")
        return result["rows"][0]["elements"][0]["distance"]["value"] / 1000

    Option C - Self-hosted OSRM (Docker, free, unlimited, fast):
        Change the URL below from router.project-osrm.org to localhost:5000
    """
    cache_key = _cache_key("distance", lat1, lon1, lat2, lon2)
    cached_value, cached = _cache_get(cache_key)
    if cached:
        return cached_value

    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{lon1},{lat1};{lon2},{lat2}?overview=false"
    )
    try:
        r = requests.get(url, timeout=OSRM_DISTANCE_TIMEOUT_SECONDS)
        data = r.json()
        distance_km = data["routes"][0]["distance"] / 1000
        _cache_set(cache_key, distance_km)
        return distance_km
    except Exception:
        _cache_set(cache_key, None)
        return None


def get_road_route(lat1, lon1, lat2, lon2):
    """
    Returns route details from OSRM:
      - distance_km
      - duration_min
      - path_latlng: [[lat, lon], ...] for direct map drawing
    """
    cache_key = _cache_key("route", lat1, lon1, lat2, lon2)
    cached_value, cached = _cache_get(cache_key)
    if cached:
        return cached_value

    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true"
    )
    try:
        r = requests.get(url, timeout=OSRM_ROUTE_TIMEOUT_SECONDS)
        data = r.json()
        route = data["routes"][0]
        coords = route.get("geometry", {}).get("coordinates", [])
        path_latlng = [[float(c[1]), float(c[0])] for c in coords if len(c) >= 2]
        route_stops = []
        for leg in route.get("legs", []):
            for step in leg.get("steps", []):
                name = str(step.get("name", "")).strip()
                if not name:
                    name = str(step.get("destinations", "")).strip() or str(step.get("ref", "")).strip()
                if name and (not route_stops or route_stops[-1].lower() != name.lower()):
                    route_stops.append(name)
        route_payload = {
            "distance_km": route["distance"] / 1000,
            "duration_min": route.get("duration", 0) / 60,
            "path_latlng": path_latlng,
            "route_stops": route_stops,
        }
        _cache_set(cache_key, route_payload)
        return route_payload
    except Exception:
        _cache_set(cache_key, None)
        return None


def load_apmc_data():
    global _APMC_DATA_CACHE
    if _APMC_DATA_CACHE is not None:
        return _APMC_DATA_CACHE.copy()

    base_dir = Path(__file__).resolve().parent
    file_path = base_dir / "apmc_locations_patched.xlsx"

    if not file_path.exists():
        raise FileNotFoundError(
            "apmc_locations_patched.xlsx not found. "
            "Run patch_apmc_excel.py once to generate it."
        )

    df = pd.read_excel(file_path)
    df["latitude"]  = pd.to_numeric(df["latitude"],  errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df = df.dropna(subset=["latitude", "longitude"])
    df = df[df["msamb_code"].notna()].reset_index(drop=True)
    _APMC_DATA_CACHE = df
    return _APMC_DATA_CACHE.copy()


def nearby_apmcs_with_transport_cost(
    farmer_lat,
    farmer_lon,
    vehicle_type,
    ownership,
    mileage_kmpl=None,
    fuel_type=None,
    rent_per_km=None,
    top_n=10,
    max_radius_km=None,
):
    vehicle_type = vehicle_type.lower()
    ownership    = ownership.lower()

    df = load_apmc_data()

    if ownership == "own":
        if mileage_kmpl is None:
            raise ValueError("Mileage required for own vehicle")
        mileage_kmpl = float(mileage_kmpl)
        min_mil, max_mil = MILEAGE_RANGES.get(vehicle_type, (1, 50))
        if not (min_mil <= mileage_kmpl <= max_mil):
            print(f"  Warning: unusual mileage {mileage_kmpl} for {vehicle_type}")
        if vehicle_type == "tractor":
            fuel_price = DIESEL_PRICE
        else:
            if fuel_type is None:
                raise ValueError("Fuel type must be diesel or cng")
            fuel_type  = fuel_type.lower()
            fuel_price = DIESEL_PRICE if fuel_type == "diesel" else CNG_PRICE
        cost_per_km = fuel_price / mileage_kmpl

    elif ownership == "rented":
        if rent_per_km is None:
            raise ValueError("Rent per km required")
        min_r, max_r = RENT_RANGES.get(vehicle_type, (1, 200))
        if not (min_r <= rent_per_km <= max_r):
            print(f"  Warning: unusual rent Rs.{rent_per_km}/km for {vehicle_type}")
        cost_per_km = rent_per_km
    else:
        raise ValueError("Ownership must be own or rented")

    # STEP 1: Aerial pre-filter (fast, no network)
    MAX_RADIUS_KM = int(max(100, min(max_radius_km or 140, 180)))
    df["aerial_km"] = df.apply(
        lambda row: haversine(farmer_lat, farmer_lon, row["latitude"], row["longitude"]),
        axis=1
    )
    candidates = (
        df[df["aerial_km"] <= MAX_RADIUS_KM]
        .sort_values("aerial_km")
        .head(max(top_n + ROUTE_CANDIDATE_BUFFER, MIN_ROUTE_CANDIDATES))
    )

    # STEP 2: Accurate road distance via OSRM
    results = []
    for _, row in candidates.iterrows():
        route_data = get_road_route(farmer_lat, farmer_lon, row["latitude"], row["longitude"])
        if route_data is not None:
            road_km = route_data["distance_km"]
            route_duration_min = route_data["duration_min"]
            route_path = route_data["path_latlng"]
            route_stops = route_data.get("route_stops", [])
        else:
            road_km = row["aerial_km"] * 1.3  # fallback: haversine + 30% road factor
            route_duration_min = None
            route_path = [
                [float(farmer_lat), float(farmer_lon)],
                [float(row["latitude"]), float(row["longitude"])],
            ]
            route_stops = []

        confidence = str(row["confidence"]).strip().lower()
        error_km   = 2 if confidence == "high" else 4  # high: ±1-3km mid=2, low: ±3-5km mid=4

        min_d = max(road_km - error_km, 0)
        max_d = road_km + error_km

        if ROUND_TRIP:
            min_d *= 2
            max_d *= 2

        # Normalize code: "11.0" → "011", "96.0" → "096"
        raw_code = str(row["msamb_code"]).strip()
        if raw_code.endswith(".0"):
            raw_code = raw_code[:-2]
        norm_code = raw_code.zfill(3)

        results.append({
            "apmc_name":             row["apmc_name"],
            "apmc_code":             norm_code,  # normalized MSAMB code e.g. "011"
            "distance_km":           round(road_km, 2),
            "confidence":            confidence,
            "latitude":              float(row["latitude"]),
            "longitude":             float(row["longitude"]),
            "transport_cost_min_rs": round(min_d * cost_per_km),
            "transport_cost_max_rs": round(max_d * cost_per_km),
            "vehicle_type":          vehicle_type,
            "ownership":             ownership,
            "district":              row.get("district", ""),
            "route_duration_min":    round(route_duration_min, 1) if route_duration_min is not None else None,
            "route_path":            route_path,
            "route_stops":           route_stops,
        })

    return (
        pd.DataFrame(results)
        .sort_values("distance_km")
        .head(top_n)
        .reset_index(drop=True)
    )


if __name__ == "__main__":
    print("\nNearby APMCs - Transport Cost Calculator\n")

    farmer_lat = float(input("Enter Latitude: "))
    farmer_lon = float(input("Enter Longitude: "))

    print("\nSelect Vehicle Type")
    print("1 Tractor  2 Pickup  3 Tempo  4 Truck")
    vehicle_map = {"1": "tractor", "2": "pickup", "3": "tempo", "4": "truck"}
    vehicle_type = vehicle_map.get(input("Choice: ").strip())

    print("\nOwnership: 1 Own  2 Rented")
    ownership_map = {"1": "own", "2": "rented"}
    ownership = ownership_map.get(input("Choice: ").strip())

    if ownership == "own":
        mileage = float(input("Mileage (km/litre): "))
        fuel_type = "diesel" if vehicle_type == "tractor" else input("Fuel type (diesel/cng): ").strip().lower()
        result = nearby_apmcs_with_transport_cost(
            farmer_lat, farmer_lon, vehicle_type, ownership,
            mileage_kmpl=mileage, fuel_type=fuel_type
        )
    else:
        rent_per_km = float(input("Rent per km Rs.: "))
        result = nearby_apmcs_with_transport_cost(
            farmer_lat, farmer_lon, vehicle_type, ownership,
            rent_per_km=rent_per_km
        )

    print("\nNearby APMCs:\n")
    print(result.to_string(index=False))
