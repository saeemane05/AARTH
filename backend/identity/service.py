from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from backend.auth.service import _client, profile_for_user


def _encoded(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _canonical(payload: dict) -> bytes:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")


def _private_key() -> Ed25519PrivateKey:
    raw = os.getenv("AARTH_FARMER_SIGNING_PRIVATE_KEY", "").strip()
    if not raw:
        raise RuntimeError("AARTH_FARMER_SIGNING_PRIVATE_KEY is not configured.")
    try:
        return serialization.load_pem_private_key(raw.encode("utf-8"), password=None)
    except ValueError:
        return Ed25519PrivateKey.from_private_bytes(base64.b64decode(raw))


def _public_key(key: Ed25519PrivateKey) -> str:
    return _encoded(key.public_key().public_bytes_raw())


def farmer_credential(user_id: str) -> dict:
    profile = profile_for_user(user_id)
    if not profile or profile.get("role") != "FARMER":
        raise ValueError("An active Farmer profile is required.")
    farmer_id = profile.get("role_id")
    if not farmer_id:
        raise ValueError("The Farmer ID is not available yet.")

    payload = {
        "type": "AARTH_FARMER",
        "farmer_id": farmer_id,
        "version": 1,
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
    key = _private_key()
    payload["public_key"] = _public_key(key)
    signature = key.sign(_canonical(payload))
    return {**payload, "signature": _encoded(signature)}


def public_farmer_lookup(farmer_id: str) -> dict:
    row = (
        _client(admin=True)
        .table("farmers")
        .select("user_id, farmer_id, status")
        .eq("farmer_id", farmer_id.strip())
        .maybe_single()
        .execute()
        .data
    )
    if not row or row.get("status") != "ACTIVE":
        raise LookupError("Farmer not found or inactive.")
    profile = profile_for_user(row["user_id"])
    data = profile.get("profile_data") or {}
    return {
        "farmer_id": row["farmer_id"],
        "full_name": data.get("full_name") or profile.get("username"),
        "role": "FARMER",
        "district": data.get("district"),
        "status": row.get("status", "ACTIVE"),
    }


def sync_assisted_onboarding(operator_user_id: str, payload: dict) -> dict:
    farmer_id = str(payload.get("farmer_id", "")).strip()
    if not farmer_id:
        raise ValueError("Farmer ID is required.")
    public_farmer_lookup(farmer_id)
    row = {
        "local_id": payload.get("local_id"),
        "farmer_id": farmer_id,
        "operator_user_id": operator_user_id,
        "onboarding_data": payload.get("onboarding_data") or {},
        "status": "SYNCED",
    }
    result = _client(admin=True).table("assisted_onboarding").upsert(row, on_conflict="local_id").execute()
    return {"status": "SYNCED", "local_id": payload.get("local_id"), "record": result.data[0] if result.data else row}