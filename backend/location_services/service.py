from __future__ import annotations

import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen

NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
USER_AGENT = os.getenv("AARTH_GEOCODING_USER_AGENT", "AARTH-SIH-2026/1.0")


def _get_json(path: str, params: dict[str, str]) -> list | dict:
	request = Request(f"{NOMINATIM_URL.rstrip('/')}{path}?{urlencode(params)}", headers={"User-Agent": USER_AGENT, "Accept-Language": "en"})
	with urlopen(request, timeout=8) as response:
		return json.loads(response.read().decode("utf-8"))


def _normalise(item: dict) -> dict:
	address = item.get("address") or {}
	return {"display_name": item.get("display_name", ""), "latitude": float(item["lat"]), "longitude": float(item["lon"]), "district": address.get("state_district") or address.get("district") or address.get("county"), "taluka": address.get("municipality") or address.get("town") or address.get("suburb") or address.get("village"), "village": address.get("village") or address.get("hamlet") or address.get("town"), "state": address.get("state"), "country": address.get("country"), "source": "OpenStreetMap Nominatim"}


def search_locations(query: str, district: str | None = None, taluka: str | None = None) -> list[dict]:
	context = ", Maharashtra, India"
	if taluka: context = f", {taluka}{context}"
	if district: context = f", {district}{context}"
	data = _get_json("/search", {"q": f"{' '.join(query.strip().split())}{context}", "format": "jsonv2", "addressdetails": "1", "limit": "6", "countrycodes": "in"})
	return [_normalise(item) for item in data if isinstance(data, list) and ((item.get("address") or {}).get("state") or "").lower() in {"maharashtra", "महाराष्ट्र"}]


def reverse_location(latitude: float, longitude: float) -> dict:
	data = _get_json("/reverse", {"lat": str(latitude), "lon": str(longitude), "format": "jsonv2", "addressdetails": "1", "zoom": "18"})
	if not isinstance(data, dict): raise ValueError("The map service returned an invalid location.")
	result = _normalise(data)
	result["verified"] = (result.get("state") or "").lower() in {"maharashtra", "महाराष्ट्र"}
	if not result["verified"]: raise ValueError("The selected location could not be verified as being in Maharashtra.")
	return result
