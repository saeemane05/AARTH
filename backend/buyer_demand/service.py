from __future__ import annotations

from datetime import date
from typing import Any

from backend.auth.service import _client, profile_for_user
from backend.database.models_sql.lot import quantity_to_kg

EDITABLE_STATUSES = {"DRAFT", "ACTIVE", "PAUSED"}
TRANSITIONS = {
    "DRAFT": {"ACTIVE", "CANCELLED"},
    "ACTIVE": {"PAUSED", "FULFILLED", "CANCELLED"},
    "PAUSED": {"ACTIVE", "CANCELLED"},
}


def _buyer(user_id: str) -> dict[str, Any]:
    profile = profile_for_user(user_id)
    if not profile or profile.get("role") != "BUYER" or profile.get("status") != "ACTIVE":
        raise ValueError("Only an active buyer account can manage requirements.")
    return profile


def _clean(value):
    return value.strip() or None if isinstance(value, str) else value


def _row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: row.get(key) for key in (
        "id", "requirement_id", "buyer_id", "commodity_key", "commodity_name", "variety", "quantity",
        "quantity_unit", "quantity_kg", "quality_grade", "size_calibre", "quality_requirements",
        "delivery_location", "delivery_district", "delivery_taluka", "delivery_city", "delivery_latitude",
        "delivery_longitude", "delivery_start_date", "delivery_end_date", "packaging_requirement",
        "target_price", "target_price_unit", "open_to_market_pricing", "additional_requirements", "status",
        "created_at", "updated_at",
    )}


def _payload(payload, profile: dict[str, Any]) -> dict[str, Any]:
    data = payload.model_dump()
    data.pop("status", None)
    data["profile_id"] = profile["id"]
    data["user_id"] = profile["user_id"]
    data["quantity_kg"] = quantity_to_kg(data["quantity"], data["quantity_unit"]) if data.get("quantity") and data.get("quantity_unit") else None
    for key, value in list(data.items()):
        if isinstance(value, date): data[key] = value.isoformat()
        elif isinstance(value, str): data[key] = _clean(value)
    return data


def _publish_ready(data: dict[str, Any]):
    required = ("commodity_key", "commodity_name", "quantity", "quantity_unit", "delivery_location", "delivery_district", "delivery_latitude", "delivery_longitude", "delivery_start_date", "delivery_end_date")
    if any(data.get(field) is None or data.get(field) == "" for field in required):
        raise ValueError("Complete produce, quantity, verified delivery location, and delivery dates before publishing.")
    start = data["delivery_start_date"]
    end = data["delivery_end_date"]
    start = date.fromisoformat(start) if isinstance(start, str) else start
    end = date.fromisoformat(end) if isinstance(end, str) else end
    if start < date.today() or end < date.today():
        raise ValueError("Delivery dates cannot be in the past.")


def create_requirement(user_id: str, payload) -> dict[str, Any]:
    profile = _buyer(user_id)
    admin = _client(admin=True)
    requirement_id = admin.rpc("new_buyer_requirement_id").execute().data
    if not requirement_id: raise ValueError("Could not generate a requirement ID.")
    response = admin.table("buyer_requirements").insert({**_payload(payload, profile), "requirement_id": requirement_id, "buyer_id": profile.get("role_id"), "status": "DRAFT"}).execute()
    if not response.data: raise ValueError("Could not save the requirement.")
    return _row(response.data[0])


def list_requirements(user_id: str) -> list[dict[str, Any]]:
    _buyer(user_id)
    response = _client(admin=True).table("buyer_requirements").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return [_row(row) for row in (response.data or [])]


def get_requirement(user_id: str, requirement_id: str) -> dict[str, Any] | None:
    _buyer(user_id)
    result = _client(admin=True).table("buyer_requirements").select("*").eq("user_id", user_id).eq("requirement_id", requirement_id).maybe_single().execute().data
    return _row(result) if result else None


def update_requirement(user_id: str, requirement_id: str, payload) -> dict[str, Any]:
    existing = get_requirement(user_id, requirement_id)
    if not existing: raise LookupError("Requirement not found.")
    if existing["status"] not in EDITABLE_STATUSES: raise ValueError("This requirement can no longer be edited.")
    response = _client(admin=True).table("buyer_requirements").update(_payload(payload, _buyer(user_id))).eq("user_id", user_id).eq("requirement_id", requirement_id).execute()
    if not response.data: raise ValueError("Could not save the requirement.")
    return _row(response.data[0])


def change_status(user_id: str, requirement_id: str, next_status: str) -> dict[str, Any]:
    existing = get_requirement(user_id, requirement_id)
    if not existing: raise LookupError("Requirement not found.")
    if next_status not in TRANSITIONS.get(existing["status"], set()): raise ValueError("That status change is not available for this requirement.")
    if next_status == "ACTIVE": _publish_ready(existing)
    response = _client(admin=True).table("buyer_requirements").update({"status": next_status}).eq("user_id", user_id).eq("requirement_id", requirement_id).execute()
    return _row(response.data[0])


def delete_requirement(user_id: str, requirement_id: str) -> None:
    """Permanently remove only the buyer's own unpublished requirement."""
    existing = get_requirement(user_id, requirement_id)
    if not existing:
        raise LookupError("Requirement not found.")
    if existing["status"] != "DRAFT":
        raise ValueError("Only draft requirements can be deleted. Cancel a published requirement to preserve its record.")
    response = _client(admin=True).table("buyer_requirements").delete().eq("user_id", user_id).eq("requirement_id", requirement_id).execute()
    if not response.data:
        raise ValueError("Could not delete the requirement.")
