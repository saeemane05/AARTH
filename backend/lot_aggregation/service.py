from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.auth.service import _client, profile_for_user
from backend.database.models_sql.lot import quantity_to_kg


def _lot_row(row: dict[str, Any]) -> dict[str, Any]:
	return {
		key: row.get(key)
		for key in (
			"id", "lot_id", "commodity_key", "commodity_name", "variety",
			"produce_form", "quantity", "quantity_unit", "quantity_kg",
			"partial_sale_allowed", "minimum_sale_quantity_kg", "harvest_date",
			"grade", "size_calibre", "quality_measurements", "pickup_district",
			"pickup_taluka", "pickup_village", "pickup_location_text",
			"pickup_latitude", "pickup_longitude", "location_source",
			"location_verified", "location_verified_at", "location_accuracy_m",
			"available_from", "pickup_until", "expected_price",
			"expected_price_unit", "price_negotiable", "payment_needed_by",
			"open_to_aggregation", "evidence", "status", "created_at", "updated_at",
			"evidence_status", "verification_status",
		)
	} | {
		"quality_measurements": row.get("quality_measurements") or {},
		"evidence": row.get("evidence") or [],
		"evidence_status": row.get("evidence_status", "PENDING"),
		"verification_status": row.get("verification_status", "NOT_VERIFIED"),
	}


def _get_farmer(user_id: str) -> dict[str, Any]:
	profile = profile_for_user(user_id)
	if not profile or profile.get("role") != "FARMER":
		raise ValueError("Only an active farmer account can manage farmer lots.")
	if profile.get("status") != "ACTIVE":
		raise ValueError("Farmer account is not active.")
	return profile


def _base_payload(payload, profile: dict[str, Any]) -> dict[str, Any]:
	minimum_kg = (
		quantity_to_kg(payload.minimum_sale_quantity, payload.quantity_unit)
		if payload.minimum_sale_quantity is not None else None
	)
	now = datetime.now(timezone.utc).isoformat()
	return {
		"profile_id": profile["id"], "user_id": profile["user_id"],
		"commodity_key": payload.commodity_key.strip(), "commodity_name": payload.commodity_name.strip(),
		"variety": (payload.variety or "").strip() or None, "produce_form": payload.produce_form.strip(),
		"quantity": payload.quantity, "quantity_unit": payload.quantity_unit,
		"quantity_kg": quantity_to_kg(payload.quantity, payload.quantity_unit),
		"partial_sale_allowed": payload.partial_sale_allowed, "minimum_sale_quantity_kg": minimum_kg,
		"harvest_date": payload.harvest_date.isoformat(), "grade": (payload.grade or "").strip() or None,
		"size_calibre": (payload.size_calibre or "").strip() or None,
		"quality_measurements": payload.quality_measurements or {},
		"pickup_district": payload.pickup_district.strip(), "pickup_taluka": (payload.pickup_taluka or "").strip() or None,
		"pickup_village": payload.pickup_village.strip(), "pickup_location_text": payload.pickup_location_text.strip(),
		"pickup_latitude": payload.pickup_latitude, "pickup_longitude": payload.pickup_longitude,
		"location_source": payload.location_source, "location_verified": payload.location_verified,
		"location_verified_at": payload.location_verified_at or now, "location_accuracy_m": payload.location_accuracy_m,
		"available_from": payload.available_from.isoformat(), "pickup_until": payload.pickup_until.isoformat(),
		"expected_price": payload.expected_price, "expected_price_unit": payload.expected_price_unit,
		"price_negotiable": payload.price_negotiable, "payment_needed_by": payload.payment_needed_by.isoformat(),
		"open_to_aggregation": payload.open_to_aggregation, "evidence": payload.evidence or [], "status": "DRAFT",
		"evidence_status": "PENDING", "verification_status": "EVIDENCE_REQUIRED",
	}


def create_lot(user_id: str, payload) -> dict[str, Any]:
	profile = _get_farmer(user_id)
	admin = _client(admin=True)
	lot_id = admin.rpc("new_farmer_lot_id").execute().data
	if not lot_id:
		raise ValueError("Could not generate a lot ID.")
	response = admin.table("farmer_lots").insert({**_base_payload(payload, profile), "lot_id": lot_id}).execute()
	if not response.data:
		raise ValueError("Could not create the farmer lot.")
	return _lot_row(response.data[0])


def list_lots(user_id: str) -> list[dict[str, Any]]:
	_get_farmer(user_id)
	response = _client(admin=True).table("farmer_lots").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
	return [_lot_row(row) for row in (response.data or [])]


def get_lot(user_id: str, lot_id: str) -> dict[str, Any] | None:
	_get_farmer(user_id)
	admin = _client(admin=True)
	response = admin.table("farmer_lots").select("*").eq("user_id", user_id).eq("lot_id", lot_id).maybe_single().execute()
	if not response.data:
		return None
	result = _lot_row(response.data)
	for item in result["evidence"]:
		path = item.get("storage_path")
		if path:
			try:
				item["signed_url"] = admin.storage.from_("lot-evidence").create_signed_url(path, 3600).get("signedURL")
			except Exception:
				item["signed_url"] = None
	return result


def summary(user_id: str) -> dict[str, Any]:
	lots = list_lots(user_id)
	return {"total": len(lots), "active": sum(lot["status"] == "ACTIVE" for lot in lots), "draft": sum(lot["status"] == "DRAFT" for lot in lots), "incomplete": any(lot["status"] == "DRAFT" for lot in lots)}
