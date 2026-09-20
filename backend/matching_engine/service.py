

import math
import re
from datetime import date, datetime
from statistics import median
from typing import Any

from backend.auth.service import _client, profile_for_user
from backend.market_intelligence.market_rates import (
    MSAMB_CODE_TO_MR,
    _get_cached_prices,
    _set_cached_prices,
    _session_get_with_retry,
    fetch_all_apmc_prices,
    crop_master,
    MAIN_PAGE,
    HEADERS,
)
from backend.market_intelligence.travel_expense import haversine, load_apmc_data

ENGINE_VERSION = "MATCH_V1"
PRICE_TOLERANCE_RATIO = 0.12
DISTANCE_SCALE_KM = 100.0

# The weights are deliberately fixed and auditable. Hard constraints always win.
WEIGHTS = {
    "landed_cost_suitability": 0.25,
    "quality_compatibility": 0.20,
    "delivery_feasibility": 0.15,
    "quantity_fit": 0.10,
    "transport_location": 0.10,
    "seller_reliability": 0.10,
    "price_proximity": 0.05,
    "evidence_strength": 0.05,
}


def _today() -> date:
    return date.today()


def _to_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except Exception:
        return None


def _kg_price(value: float | None, unit: str | None) -> float | None:
    if value is None:
        return None
    unit = unit or "INR_PER_QUINTAL"
    if unit in {"INR_PER_KG", "INR_PER_QUINTAL", "INR_PER_TON"}:
        return float(value) / {"INR_PER_KG": 1, "INR_PER_QUINTAL": 100, "INR_PER_TON": 1000}[unit]
    return None


def _safe_profile(profile: dict[str, Any] | None, role: str) -> dict[str, Any]:
    if not profile or profile.get("role") != role or profile.get("status") != "ACTIVE":
        return {}
    data = profile.get("profile_data") or {}
    if role == "FARMER":
        return {
            "farmer_id": profile.get("role_id"),
            "aarth_id": profile.get("aarth_id"),
            "name": data.get("full_name") or "Farmer",
            "district": data.get("district"),
            "taluka": data.get("taluka"),
            "village": data.get("village"),
            "fpo_membership": data.get("fpo_membership"),
            "verification_status": data.get("verification_status") or "PROFILE_VERIFIED",
        }
    return {
        "buyer_id": profile.get("role_id"),
        "aarth_id": profile.get("aarth_id"),
        "business_name": data.get("business_name") or "Buyer",
        "buyer_type": data.get("buyer_type"),
        "district": data.get("operating_district") or data.get("registered_district"),
        "city": data.get("operating_city") or data.get("registered_city"),
        "verification_status": data.get("verification_status") or "PROFILE_VERIFIED",
    }


def _row_lot(row: dict[str, Any]) -> dict[str, Any]:
    row = dict(row)
    row["quality_measurements"] = row.get("quality_measurements") or {}
    row["evidence"] = row.get("evidence") or []
    return row


def _row_requirement(row: dict[str, Any]) -> dict[str, Any]:
    return dict(row)


def _fetch_lots(*, user_id: str | None = None, commodity_key: str | None = None, active_only: bool = True) -> list[dict[str, Any]]:
    query = _client(admin=True).table("farmer_lots").select("*")
    if user_id:
        query = query.eq("user_id", user_id)
    if commodity_key:
        query = query.eq("commodity_key", commodity_key)
    if active_only:
        query = query.in_("status", ["ACTIVE", "PARTIALLY_SOLD", "RESERVED"])
    return [_row_lot(x) for x in (query.order("created_at", desc=True).execute().data or [])]


def _fetch_requirements(*, user_id: str | None = None, commodity_key: str | None = None, active_only: bool = True) -> list[dict[str, Any]]:
    query = _client(admin=True).table("buyer_requirements").select("*")
    if user_id:
        query = query.eq("user_id", user_id)
    if commodity_key:
        query = query.eq("commodity_key", commodity_key)
    if active_only:
        query = query.in_("status", ["ACTIVE"])
    return [_row_requirement(x) for x in (query.order("created_at", desc=True).execute().data or [])]


def _profiles(user_ids: list[str]) -> dict[str, dict[str, Any]]:
    ids = [x for x in dict.fromkeys(user_ids) if x]
    if not ids:
        return {}
    rows = _client(admin=True).table("profiles").select("id,user_id,aarth_id,role,role_id,profile_data,status").in_("user_id", ids).execute().data or []
    return {str(row["user_id"]): row for row in rows}


def _grade_score(lot_grade: str | None, requested: str | None) -> tuple[bool, float, str]:
    wanted = (requested or "Any").strip().lower()
    got = (lot_grade or "").strip().lower()
    if not wanted or wanted == "any":
        return True, 0.8 if got else 0.6, "No grade restriction"
    if not got:
        return True, 0.35, "Grade not declared; buyer should verify before acceptance"
    if got == wanted:
        return True, 1.0, f"{lot_grade} matches requested grade"
    ranks = {"grade a": 3, "grade b": 2, "faq / standard": 1, "faq": 1, "standard": 1}
    if ranks.get(got, 0) >= ranks.get(wanted, 0) and ranks.get(wanted, 0) > 0:
        return True, 0.85, f"Declared grade {lot_grade} meets requested level"
    return False, 0.0, f"Declared grade {lot_grade} does not meet {requested}"


def _parse_quality_constraints(text: str | None) -> list[tuple[str, str, float]]:
    if not text:
        return []
    pattern = re.compile(r"([a-zA-Z][a-zA-Z _-]{2,30})\s*(<=|>=|<|>|=|at most|at least)\s*(\d+(?:\.\d+)?)", re.I)
    out = []
    for match in pattern.finditer(text):
        name = re.sub(r"\s+", " ", match.group(1).strip().lower())
        op = match.group(2).lower().replace("at most", "<=").replace("at least", ">=")
        out.append((name, op, float(match.group(3))))
    return out


def _quality_measurement(lot: dict[str, Any], name: str) -> float | None:
    measures = lot.get("quality_measurements") or {}
    normalized = re.sub(r"[^a-z0-9]", "", name.lower())
    for key, value in measures.items():
        key_norm = re.sub(r"[^a-z0-9]", "", str(key).lower())
        if key_norm != normalized:
            continue
        if isinstance(value, dict):
            raw = value.get("value")
        else:
            raw = value
        try:
            return float(raw)
        except Exception:
            return None
    return None


def _quality_result(lot: dict[str, Any], req: dict[str, Any]) -> tuple[bool, float, list[str]]:
    grade_ok, grade_score, grade_msg = _grade_score(lot.get("grade"), req.get("quality_grade"))
    if not grade_ok:
        return False, 0.0, [grade_msg]
    score_parts = [grade_score]
    notes = [grade_msg]
    requested_size = (req.get("size_calibre") or "").strip().lower()
    lot_size = (lot.get("size_calibre") or "").strip().lower()
    if requested_size:
        if not lot_size:
            score_parts.append(0.35)
            notes.append("Size/calibre is not declared")
        elif requested_size == lot_size:
            score_parts.append(1.0)
            notes.append("Size/calibre matches")
        else:
            return False, 0.0, [f"Size/calibre {lot.get('size_calibre')} does not match {req.get('size_calibre')}"]
    constraints = _parse_quality_constraints(req.get("quality_requirements"))
    for name, op, target in constraints:
        actual = _quality_measurement(lot, name)
        if actual is None:
            score_parts.append(0.45)
            notes.append(f"{name}: not measured; verify before acceptance")
            continue
        ok = {"<=": actual <= target, "<": actual < target, ">=": actual >= target, ">": actual > target, "=": math.isclose(actual, target, rel_tol=1e-6)}[op]
        if not ok:
            return False, 0.0, [f"{name} = {actual:g} fails buyer threshold {op} {target:g}"]
        score_parts.append(1.0)
        notes.append(f"{name} = {actual:g} satisfies {op} {target:g}")
    return True, sum(score_parts) / len(score_parts), notes


def _date_result(lot: dict[str, Any], req: dict[str, Any]) -> tuple[bool, float, str]:
    available = _to_date(lot.get("available_from")) or _today()
    pickup_until = _to_date(lot.get("pickup_until")) or available
    start = _to_date(req.get("delivery_start_date"))
    end = _to_date(req.get("delivery_end_date"))
    if not start or not end:
        return True, 0.6, "Delivery window is not fully specified"
    # The lot must be available no later than the buyer's delivery end and must not stop being available before the delivery window begins.
    if available > end or pickup_until < start:
        return False, 0.0, "Lot availability window does not overlap buyer delivery window"
    slack_days = max((end - available).days, 0)
    score = min(1.0, 0.55 + slack_days / 30.0)
    return True, score, f"Availability overlaps delivery window ({available.isoformat()} to {pickup_until.isoformat()})"


def _quantity_result(lot: dict[str, Any], req: dict[str, Any]) -> tuple[bool, str, float, str]:
    available = float(lot.get("quantity_kg") or 0)
    required = float(req.get("quantity_kg") or 0)
    if required <= 0 or available <= 0:
        return False, "DIRECT", 0.0, "Quantity is missing"
    if available >= required:
        return True, "DIRECT", min(1.0, required / available), "Lot can cover the full requirement"
    if bool(lot.get("open_to_aggregation")) or bool(lot.get("partial_sale_allowed")):
        coverage = max(0.0, min(1.0, available / required))
        return True, "AGGREGATION_CANDIDATE", coverage, f"Lot covers {coverage * 100:.0f}% of the requirement; aggregation is allowed"
    return False, "DIRECT", 0.0, "Lot is smaller than the requirement and is not open to aggregation"


def _price_score(lot: dict[str, Any], req: dict[str, Any]) -> tuple[float, str]:
    mode = req.get("price_mode") or ("MARKET_LINKED" if req.get("open_to_market_pricing") else "PREFERRED_RANGE")
    farm = _kg_price(lot.get("expected_price"), lot.get("expected_price_unit"))
    low = _kg_price(req.get("target_price_min"), req.get("target_price_unit"))
    high = _kg_price(req.get("target_price_max"), req.get("target_price_unit"))
    target = _kg_price(req.get("target_price"), req.get("target_price_unit"))
    if mode == "MARKET_LINKED" or req.get("open_to_market_pricing"):
        return 0.8, "Buyer is open to market-linked pricing"
    if farm is None or target is None and low is None and high is None:
        return 0.55, "Price not fully specified"
    if low is None and high is None:
        low = high = target
    if high is None:
        high = low
    if low is None:
        low = high
    if farm < low:
        distance = (low - farm) / max(low, 1)
    elif farm > high:
        distance = (farm - high) / max(high, 1)
        if mode == "MAXIMUM":
            return max(0.0, 1.0 - distance / PRICE_TOLERANCE_RATIO), f"Farmer price is ₹{farm * 100:.0f}/quintal vs buyer ceiling ₹{high * 100:.0f}/quintal"
    else:
        return 1.0, f"Farmer price is within buyer range ₹{low * 100:.0f}–₹{high * 100:.0f}/quintal"
    return max(0.0, 1.0 - distance / PRICE_TOLERANCE_RATIO), f"Farmer price is ₹{farm * 100:.0f}/quintal; buyer range is ₹{low * 100:.0f}–₹{high * 100:.0f}/quintal"


def _distance_score(lot: dict[str, Any], req: dict[str, Any]) -> tuple[float, float | None, str]:
    lat1, lon1 = lot.get("pickup_latitude"), lot.get("pickup_longitude")
    lat2, lon2 = req.get("delivery_latitude"), req.get("delivery_longitude")
    if None in {lat1, lon1, lat2, lon2}:
        return 0.45, None, "Road distance is unavailable"
    distance = haversine(float(lat1), float(lon1), float(lat2), float(lon2))
    score = math.exp(-distance / DISTANCE_SCALE_KM)
    return score, distance, f"Approx. {distance:.0f} km from pickup to receiving location"


def _evidence_score(lot: dict[str, Any]) -> tuple[float, str]:
    evidence = lot.get("evidence") or []
    photos = sum(1 for item in evidence if item.get("media_type", "PHOTO") == "PHOTO")
    videos = sum(1 for item in evidence if item.get("media_type") == "VIDEO")
    status = str(lot.get("evidence_status") or "PENDING")
    if status == "SUBMITTED" and photos >= 4:
        return 1.0, "Evidence submitted with required photo set"
    if photos or videos:
        return 0.65, "Some lot evidence is available"
    return 0.35, "Lot evidence is not yet available"


def _reliability_score(profile: dict[str, Any], lot: dict[str, Any]) -> tuple[float, str]:
    # No completed transaction history is available in the current schema.
    # Never label a new seller as unreliable; use verification/evidence only.
    verified = str(profile.get("profile_data", {}).get("verification_status") or "")
    if "VERIFIED" in verified:
        return 0.9, "Seller profile has a verification signal; transaction history is still limited"
    return 0.65, "Seller has insufficient completed-transaction history for a reliability score"


def match_lot_to_requirement(lot: dict[str, Any], req: dict[str, Any], seller_profile: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if lot.get("status") not in {"ACTIVE", "PARTIALLY_SOLD", "RESERVED"} or req.get("status") != "ACTIVE":
        return None
    if lot.get("commodity_key") != req.get("commodity_key"):
        return None
    if req.get("variety") and lot.get("variety") and str(req["variety"]).strip().lower() != str(lot["variety"]).strip().lower():
        return None
    if req.get("variety") and not lot.get("variety"):
        # Unknown variety is not a hard failure; it requires confirmation.
        variety_score = 0.4
        variety_note = "Buyer requested a variety; farmer did not declare one"
    else:
        variety_score = 1.0
        variety_note = "Variety compatible"

    qty_ok, match_type, quantity_score, qty_note = _quantity_result(lot, req)
    if not qty_ok:
        return None
    quality_ok, quality_score, quality_notes = _quality_result(lot, req)
    if not quality_ok:
        return None
    date_ok, delivery_score, date_note = _date_result(lot, req)
    if not date_ok:
        return None
    distance_score, distance_km, distance_note = _distance_score(lot, req)
    price_score, price_note = _price_score(lot, req)
    evidence_score, evidence_note = _evidence_score(lot)
    reliability_score, reliability_note = _reliability_score(seller_profile or {}, lot)

    # Cost suitability is represented by price + distance proxy until an actual logistics quote exists.
    landed_cost_score = max(0.0, min(1.0, 0.55 * price_score + 0.45 * distance_score))
    factors = {
        "landed_cost_suitability": landed_cost_score,
        "quality_compatibility": quality_score,
        "delivery_feasibility": delivery_score,
        "quantity_fit": quantity_score,
        "transport_location": distance_score,
        "seller_reliability": reliability_score,
        "price_proximity": price_score,
        "evidence_strength": evidence_score,
    }
    score = sum(WEIGHTS[key] * factors[key] for key in WEIGHTS)
    explanations = [
        {"label": "Quantity", "value": qty_note, "tone": "positive" if match_type == "DIRECT" else "warning"},
        {"label": "Quality", "value": " · ".join(quality_notes[:3]), "tone": "positive"},
        {"label": "Delivery", "value": date_note, "tone": "positive"},
        {"label": "Location", "value": distance_note, "tone": "neutral"},
        {"label": "Price", "value": price_note, "tone": "positive" if price_score >= 0.7 else "warning"},
        {"label": "Evidence", "value": evidence_note, "tone": "positive" if evidence_score >= 0.9 else "neutral"},
        {"label": "Seller", "value": reliability_note, "tone": "neutral"},
    ]
    if req.get("variety"):
        explanations.insert(1, {"label": "Variety", "value": variety_note, "tone": "positive" if variety_score >= 0.9 else "warning"})
    return {
        "lot_id": lot["lot_id"],
        "requirement_id": req["requirement_id"],
        "match_type": match_type,
        "match_status": "FEASIBLE" if match_type == "DIRECT" else "NEEDS_AGGREGATION",
        "score": round(score, 6),
        "score_percent": round(score * 100),
        "hard_constraints": {
            "commodity": True,
            "variety": variety_score >= 0.9 if req.get("variety") else True,
            "quality": True,
            "quantity": match_type == "DIRECT",
            "delivery_window": True,
            "location": distance_km is not None,
        },
        "factors": {k: round(v, 4) for k, v in factors.items()},
        "explanations": explanations,
        "distance_km": round(distance_km, 1) if distance_km is not None else None,
        "seller": _safe_profile(seller_profile, "FARMER") if seller_profile else None,
        "lot": _public_lot(lot),
        "requirement": _public_requirement(req),
        "engine_version": ENGINE_VERSION,
    }


def _public_lot(lot: dict[str, Any]) -> dict[str, Any]:
    keys = [
        "lot_id", "commodity_key", "commodity_name", "variety", "produce_form", "quantity", "quantity_unit", "quantity_kg",
        "partial_sale_allowed", "grade", "size_calibre", "quality_measurements", "pickup_district", "pickup_taluka",
        "pickup_village", "pickup_location_text", "available_from", "pickup_until", "expected_price", "expected_price_unit",
        "price_negotiable", "open_to_aggregation", "status", "created_at", "updated_at", "evidence_status", "verification_status",
    ]
    data = {key: lot.get(key) for key in keys}
    data["market_status"] = "OPEN" if lot.get("status") in {"ACTIVE", "PARTIALLY_SOLD", "RESERVED"} else "CLOSED"
    return data


def _public_requirement(req: dict[str, Any]) -> dict[str, Any]:
    keys = [
        "requirement_id", "commodity_key", "commodity_name", "variety", "quantity", "quantity_unit", "quantity_kg", "quality_grade",
        "size_calibre", "quality_requirements", "delivery_district", "delivery_taluka", "delivery_city", "delivery_location",
        "delivery_start_date", "delivery_end_date", "packaging_requirement", "target_price", "target_price_unit",
        "target_price_min", "target_price_max", "price_mode", "open_to_market_pricing", "additional_requirements", "status", "created_at", "updated_at",
    ]
    data = {key: req.get(key) for key in keys}
    data["market_status"] = "OPEN" if req.get("status") == "ACTIVE" else "CLOSED" if req.get("status") in {"FULFILLED", "CANCELLED"} else req.get("status")
    return data


def rank_lots_for_requirement(req: dict[str, Any], lots: list[dict[str, Any]]) -> list[dict[str, Any]]:
    profiles = _profiles([lot.get("user_id") for lot in lots])
    matches = []
    for lot in lots:
        match = match_lot_to_requirement(lot, req, profiles.get(str(lot.get("user_id"))))
        if match:
            matches.append(match)
    return sorted(matches, key=lambda x: (x["score"], x["match_type"] == "DIRECT"), reverse=True)


def rank_requirements_for_farmer(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    lots = _fetch_lots(user_id=user_id)
    if not lots:
        return []
    requirements = _fetch_requirements()
    profiles = _profiles([req.get("user_id") for req in requirements])
    best_by_requirement = []
    for req in requirements:
        best = None
        for lot in lots:
            match = match_lot_to_requirement(lot, req, _profiles([lot.get("user_id")]).get(str(lot.get("user_id"))))
            if match and (best is None or match["score"] > best["score"]):
                best = match
        if best:
            best["buyer"] = _safe_profile(profiles.get(str(req.get("user_id"))), "BUYER")
            best_by_requirement.append(best)
    return sorted(best_by_requirement, key=lambda x: x["score"], reverse=True)[:limit]


def discover_lots_for_buyer(user_id: str, requirement_id: str | None = None, commodity_key: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    reqs = _fetch_requirements(user_id=user_id)
    if requirement_id:
        reqs = [r for r in reqs if r.get("requirement_id") == requirement_id]
    if commodity_key:
        reqs = [r for r in reqs if r.get("commodity_key") == commodity_key]
    if not reqs:
        return []
    all_lots = _fetch_lots(commodity_key=(reqs[0].get("commodity_key") if len(reqs) == 1 else None))
    profiles = _profiles([lot.get("user_id") for lot in all_lots])
    best_by_lot: dict[str, dict[str, Any]] = {}
    for lot in all_lots:
        for req in reqs:
            match = match_lot_to_requirement(lot, req, profiles.get(str(lot.get("user_id"))))
            if match and (lot["lot_id"] not in best_by_lot or match["score"] > best_by_lot[lot["lot_id"]]["score"]):
                match["buyer"] = _safe_profile(_profiles([req.get("user_id")]).get(str(req.get("user_id"))), "BUYER")
                best_by_lot[lot["lot_id"]] = match
    return sorted(best_by_lot.values(), key=lambda x: (x["score"], x["match_type"] == "DIRECT"), reverse=True)[:limit]


def farmer_requirements(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    # Open requirements are ranked by the engine. Closed requirements remain visible
    # as history so the farmer can distinguish OPEN from CLOSED sourcing windows.
    lots = _fetch_lots(user_id=user_id)
    all_requirements = _fetch_requirements(active_only=False)
    profiles = _profiles([req.get("user_id") for req in all_requirements])
    open_items = []
    closed_items = []
    for req in all_requirements:
        if req.get("status") == "ACTIVE":
            best = None
            for lot in lots:
                match = match_lot_to_requirement(lot, req, profiles.get(str(lot.get("user_id"))))
                if match and (best is None or match["score"] > best["score"]):
                    best = match
            if best:
                best["buyer"] = _safe_profile(profiles.get(str(req.get("user_id"))), "BUYER")
                open_items.append(best)
            else:
                open_items.append({
                    "lot_id": "", "requirement_id": req["requirement_id"], "match_type": "DIRECT",
                    "match_status": "NO_CURRENT_LOT", "score": 0.0, "score_percent": 0,
                    "hard_constraints": {}, "factors": {},
                    "explanations": [{"label": "AARTH suggestion", "value": "No current active lot matches this requirement. You can still open a lot against this buyer demand.", "tone": "neutral"}],
                    "buyer": _safe_profile(profiles.get(str(req.get("user_id"))), "BUYER"),
                    "lot": None, "requirement": _public_requirement(req), "engine_version": ENGINE_VERSION,
                })
        elif req.get("status") in {"FULFILLED", "CANCELLED", "PAUSED"}:
            closed_items.append({
                "lot_id": "", "requirement_id": req["requirement_id"], "match_type": "DIRECT",
                "match_status": "CLOSED", "score": 0.0, "score_percent": 0,
                "hard_constraints": {}, "factors": {},
                "explanations": [{"label": "Status", "value": "This buyer requirement is no longer open for new matches", "tone": "neutral"}],
                "buyer": _safe_profile(profiles.get(str(req.get("user_id"))), "BUYER"),
                "lot": None, "requirement": _public_requirement(req),
                "engine_version": ENGINE_VERSION,
            })
    open_items.sort(key=lambda x: x["score"], reverse=True)
    return (open_items + closed_items)[:limit]


def buyer_lots(user_id: str, requirement_id: str | None, commodity_key: str | None, limit: int = 50) -> list[dict[str, Any]]:
    items = discover_lots_for_buyer(user_id, requirement_id, commodity_key, limit)
    # Discovery is live-first. Closed lots can still be retained as recent marketplace history.
    if len(items) >= limit:
        return items[:limit]
    reqs = _fetch_requirements(user_id=user_id)
    if requirement_id:
        reqs = [r for r in reqs if r.get("requirement_id") == requirement_id]
    if commodity_key:
        reqs = [r for r in reqs if r.get("commodity_key") == commodity_key]
    if not reqs:
        return items
    all_lots = _fetch_lots(commodity_key=reqs[0].get("commodity_key") if len(reqs) == 1 else None, active_only=False)
    profiles = _profiles([lot.get("user_id") for lot in all_lots])
    known = {x.get("lot_id") for x in items}
    for lot in all_lots:
        if lot.get("lot_id") in known or lot.get("status") not in {"SOLD", "CANCELLED"}:
            continue
        req = reqs[0]
        item = {
            "lot_id": lot["lot_id"], "requirement_id": req["requirement_id"], "match_type": "DIRECT",
            "match_status": "CLOSED", "score": 0.0, "score_percent": 0, "hard_constraints": {}, "factors": {},
            "explanations": [{"label": "Status", "value": "This farmer lot is no longer open for a new transaction", "tone": "neutral"}],
            "seller": _safe_profile(profiles.get(str(lot.get("user_id"))), "FARMER"),
            "lot": _public_lot(lot), "requirement": _public_requirement(req), "engine_version": ENGINE_VERSION,
        }
        items.append(item)
        if len(items) >= limit:
            break
    return items[:limit]


def buyer_match_detail(user_id: str, requirement_id: str, lot_id: str) -> dict[str, Any] | None:
    reqs = _fetch_requirements(user_id=user_id, active_only=False)
    req = next((x for x in reqs if x.get("requirement_id") == requirement_id), None)
    if not req:
        return None
    lot = next((x for x in _fetch_lots(commodity_key=req.get("commodity_key"), active_only=False) if x.get("lot_id") == lot_id), None)
    if not lot:
        return None
    profile = _profiles([lot.get("user_id")]).get(str(lot.get("user_id")))
    return match_lot_to_requirement(lot, req, profile)


def farmer_match_detail(user_id: str, requirement_id: str, lot_id: str) -> dict[str, Any] | None:
    lot = next((x for x in _fetch_lots(user_id=user_id, active_only=False) if x.get("lot_id") == lot_id), None)
    if not lot:
        return None
    req = next((x for x in _fetch_requirements(active_only=False) if x.get("requirement_id") == requirement_id), None)
    if not req:
        return None
    profile = _profiles([lot.get("user_id")]).get(str(lot.get("user_id")))
    return match_lot_to_requirement(lot, req, profile)


def _load_prices(crop_key: str) -> dict[str, dict[str, Any]]:
    crop_key = crop_key.lower().strip()
    if crop_key not in crop_master:
        raise ValueError(f"Crop '{crop_key}' is not supported by the existing APMC market-intelligence catalog.")
    commodity_code = crop_master[crop_key]["code"]
    cached = _get_cached_prices(commodity_code)
    if cached is not None:
        return cached
    import requests
    session = requests.Session()
    try:
        _session_get_with_retry(session, MAIN_PAGE, headers=HEADERS)
        prices = fetch_all_apmc_prices(session, commodity_code)
    finally:
        session.close()
    if prices:
        _set_cached_prices(commodity_code, prices)
    return prices or {}


def live_market_prices(crop_key: str, latitude: float | None = None, longitude: float | None = None, top_n: int = 8) -> dict[str, Any]:
    prices = _load_prices(crop_key)
    if not prices:
        raise RuntimeError("The MSAMB APMC source returned no price data for this crop.")
    df = load_apmc_data().copy()
    if latitude is not None and longitude is not None:
        df["distance_km"] = df.apply(lambda row: haversine(float(latitude), float(longitude), float(row["latitude"]), float(row["longitude"])), axis=1)
        df = df.sort_values("distance_km").head(max(top_n * 2, top_n))
    rows = []
    for _, apmc in df.iterrows():
        code = str(apmc.get("msamb_code", "")).replace(".0", "").zfill(3)
        market_mr = MSAMB_CODE_TO_MR.get(code)
        price = prices.get(market_mr) if market_mr else None
        if not price:
            continue
        rows.append({
            "apmc_code": code,
            "apmc_name": str(apmc.get("apmc_name") or market_mr),
            "district": str(apmc.get("district") or ""),
            "distance_km": round(float(apmc.get("distance_km")), 1) if "distance_km" in apmc and not math.isnan(float(apmc.get("distance_km"))) else None,
            "min_price": float(price["Min Price"]),
            "max_price": float(price["Max Price"]),
            "modal_price": float(price["Modal Price"]),
            "date": str(price["Date"]),
        })
        if len(rows) >= top_n:
            break
    if not rows:
        raise RuntimeError("No nearby APMC had recent price data for this crop.")
    min_price = min(x["min_price"] for x in rows)
    max_price = max(x["max_price"] for x in rows)
    modal_median = median(x["modal_price"] for x in rows)
    return {
        "crop_key": crop_key,
        "crop_name": crop_master[crop_key]["mr"],
        "source": "MSAMB APMC price information",
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "summary": {
            "min_price_per_quintal": round(min_price, 2),
            "max_price_per_quintal": round(max_price, 2),
            "representative_modal_per_quintal": round(modal_median, 2),
            "suggested_range_per_quintal": [round(min_price, 2), round(max_price, 2)],
        },
        "apmcs": rows,
    }