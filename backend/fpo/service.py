"""
FPO operations backed exclusively by the combined public.fpos record.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from backend.auth.service import (
    _client,
    profile_for_user,
)


STAFF_ROLES = {
    "FPO_ADMIN",
    "OPERATIONS_MANAGER",
    "FIELD_COORDINATOR",
    "FINANCE",
}

MANAGE_ORG = {
    "FPO_ADMIN",
}

MANAGE_MEMBERS = {
    "FPO_ADMIN",
    "OPERATIONS_MANAGER",
}

INVITE_FARMERS = {
    "FPO_ADMIN",
    "FIELD_COORDINATOR",
}


def now() -> str:
    return datetime.now(
        timezone.utc
    ).isoformat()


def current_profile(
    token: str,
) -> dict[str, Any]:

    try:
        user = (
            _client()
            .auth
            .get_user(token)
            .user
        )

    except Exception as exc:
        raise HTTPException(
            401,
            "Invalid session.",
        ) from exc

    profile = None
    if user:
        profile = (
            _client(admin=True)
            .table("profiles")
            .select(
                "id,user_id,username,role,aarth_id,profile_data,status"
            )
            .eq("user_id", user.id)
            .maybe_single()
            .execute()
            .data
        )

        if profile:
            profile["profile_data"] = profile.get("profile_data") or {}
            profile["status"] = profile.get("status", "ACTIVE")

    if (
        not profile
        or profile.get("status")
        != "ACTIVE"
    ):
        raise HTTPException(
            401,
            "Invalid session.",
        )

    return profile


def get_fpo(
    fpo_id: str,
) -> dict[str, Any]:

    result = (
        _client(admin=True)
        .table("fpos")
        .select("*")
        .eq("id", fpo_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise HTTPException(
            404,
            "FPO not found.",
        )

    return result.data


def public_fpo(
    row: dict[str, Any],
) -> dict[str, Any]:

    source = (
        row.get("source_data")
        or {}
    )

    verification = (
        row.get("verification_data")
        or {}
    )

    return {
        "id": row["id"],

        "fpo_name":
            row.get("fpo_name")
            or row.get("username")
            or "Unnamed FPO",

        "organisation_type":
            row.get(
                "organisation_type"
            ),

        "registration_number":
            row.get(
                "registration_number"
            ),

        "district":
            row.get("district"),

        "state":
            row.get("state") or "Maharashtra",

        "taluka":
            row.get("taluka"),

        "village":
            row.get("village"),

        "address":
            row.get("address"),

        "crops":
            row.get("crops")
            or [],

        "source":
            source.get("source"),

        "source_record_id":
            source.get(
                "record_id"
            ),

        "source_last_updated":
            source.get(
                "last_source_sync"
            ),

        "verification_status":
            row.get(
                "verification_status"
            ),

        "activation_status":
            row.get(
                "activation_status"
            ),

        "primary_admin_user_id":
            row.get("primary_admin_user_id")
            or row.get("user_id"),

        "government_record_matched":
            bool(
                verification.get(
                    "government_record_matched"
                )
            ),
    }


def profile_completion(
    row: dict[str, Any],
) -> dict[str, Any]:
    fields = {
        "Organisation name": row.get("fpo_name"),
        "Organisation type": row.get("organisation_type"),
        "Registration number": row.get("registration_number"),
        "District": row.get("district"),
        "Taluka": row.get("taluka"),
        "Village": row.get("village"),
        "Address": row.get("address"),
        "Associated crops": row.get("crops"),
    }
    complete = [
        name
        for name, value in fields.items()
        if value and (not isinstance(value, list) or len(value) > 0)
    ]
    missing = [name for name in fields if name not in complete]
    return {
        "percentage": round(len(complete) / len(fields) * 100),
        "complete": complete,
        "missing": missing,
    }


def staff_role(
    row: dict[str, Any],
    user_id: str,
) -> str | None:

    if row.get("user_id") == user_id:
        return "FPO_ADMIN"

    if (
        row.get(
            "primary_admin_user_id"
        )
        == user_id
    ):
        return "FPO_ADMIN"

    for member in (
        row.get("staff_data")
        or []
    ):
        if (
            member.get("user_id")
            == user_id
            and member.get(
                "status",
                "ACTIVE",
            )
            == "ACTIVE"
        ):
            return member.get(
                "role"
            )

    return None


def resolve_farmer(
    profile: dict[str, Any],
) -> dict[str, Any]:
    """Resolve the existing active farmer identity for a session."""

    if not profile:
        raise HTTPException(
            404,
            "The Farmer account is no longer available.",
        )

    if profile.get("role") != "FARMER":
        raise HTTPException(
            403,
            "This FPO invitation is available for AARTH farmer accounts.",
        )

    if profile.get("status") != "ACTIVE":
        raise HTTPException(
            403,
            "This farmer account is not active.",
        )

    farmer = (
        _client(admin=True)
        .table("farmers")
        .select("*")
        .eq("user_id", profile["user_id"])
        .maybe_single()
        .execute()
        .data
    )

    if not farmer or farmer.get("status", "ACTIVE") != "ACTIVE":
        raise HTTPException(
            403,
            "An active Farmer profile is required to join an FPO.",
        )

    return {
        "profile": profile,
        "farmer": farmer,
    }


def invite_record(
    row: dict[str, Any],
    code: str,
) -> dict[str, Any]:
    """Find and validate one invitation belonging to this FPO."""

    invite = next(
        (
            item
            for item in (row.get("invite_data") or [])
            if item.get("code") == code
        ),
        None,
    )

    if not invite:
        raise HTTPException(404, "Invite code is invalid.")

    expires_at = invite.get("expires_at")
    expired = False
    if expires_at:
        try:
            expired = datetime.fromisoformat(
                expires_at.replace("Z", "+00:00")
            ) <= datetime.now(timezone.utc)
        except ValueError:
            expired = True

    if invite.get("status") != "ACTIVE" or expired:
        raise HTTPException(410, "This invitation is no longer active.")

    if invite.get("usage_count", 0) >= invite.get("max_usage", 1):
        raise HTTPException(410, "This invitation has reached its usage limit.")

    return invite


def farmer_by_aarth_id(
    aarth_id: str,
) -> dict[str, Any]:
    """Resolve an AARTH farmer ID without trusting frontend profile data."""

    profiles = (
        _client(admin=True)
        .table("profiles")
        .select("*")
        .eq("aarth_id", aarth_id.strip())
        .eq("role", "FARMER")
        .eq("status", "ACTIVE")
        .maybe_single()
        .execute()
        .data
    )

    if not profiles:
        farmer = (
            _client(admin=True)
            .table("farmers")
            .select("user_id, status")
            .eq("farmer_id", aarth_id.strip())
            .maybe_single()
            .execute()
            .data
        )

        if farmer:
            profiles = profile_for_user(farmer.get("user_id"))

    if not profiles:
        raise HTTPException(
            404,
            "No active Farmer account matches that AARTH ID.",
        )

    return resolve_farmer(profiles)


def authorised(
    row: dict[str, Any],
    user_id: str,
    allowed: set[str],
) -> str:

    role = staff_role(
        row,
        user_id,
    )

    if role not in allowed:
        raise HTTPException(
            403,
            "You do not have permission for this FPO action.",
        )

    return role


def update_fpo(
    fpo_id: str,
    patch: dict[str, Any],
) -> dict[str, Any]:

    result = (
        _client(admin=True)
        .table("fpos")
        .update(patch)
        .eq("id", fpo_id)
        .execute()
    )

    return result.data[0]


def my_fpo(
    profile: dict[str, Any],
) -> dict[str, Any]:

    admin = _client(
        admin=True
    )

    # First check direct ownership / primary admin.
    rows = (
        admin
        .table("fpos")
        .select("*")
        .or_(
            f'primary_admin_user_id.eq.{profile["user_id"]},'
            f'user_id.eq.{profile["user_id"]}'
        )
        .execute()
        .data
        or []
    )

    for row in rows:
        if staff_role(
            row,
            profile["user_id"],
        ):
            return row

    # JSONB staff assignments cannot safely be
    # expressed through the simple REST filter,
    # therefore scan the combined FPO records.
    all_rows = (
        admin
        .table("fpos")
        .select("*")
        .execute()
        .data
        or []
    )

    for row in all_rows:
        if staff_role(
            row,
            profile["user_id"],
        ):
            return row

    raise HTTPException(
        404,
        "No FPO organisation is assigned to this account.",
    )


def membership_summary(
    row: dict[str, Any],
) -> dict[str, int]:

    items = (
        row.get("membership_data")
        or []
    )

    return {
        "total": len(items),

        "active": sum(
            x.get("status")
            == "ACTIVE"
            for x in items
        ),

        "pending": sum(
            x.get("status")
            == "PENDING"
            for x in items
        ),

        "inactive": sum(
            x.get("status")
            in {
                "LEFT",
                "SUSPENDED",
                "REJECTED",
            }
            for x in items
        ),
    }


def membership_views(
    row: dict[str, Any],
) -> list[dict[str, Any]]:

    result = []

    for membership in (
        row.get(
            "membership_data"
        )
        or []
    ):

        user_id = membership.get(
            "farmer_user_id"
        )

        profile = (
            profile_for_user(
                user_id
            )
            if user_id
            else None
        )

        if (
            not profile
            or profile.get("role")
            != "FARMER"
        ):
            continue

        data = (
            profile.get(
                "profile_data"
            )
            or {}
        )

        result.append(
            {
                "membership_id":
                    membership.get(
                        "id"
                    ),

                "farmer_user_id":
                    user_id,

                "aarth_id":
                    profile.get(
                        "role_id"
                    )
                    or profile.get(
                        "aarth_id"
                    ),

                "full_name":
                    data.get(
                        "full_name"
                    )
                    or profile.get(
                        "username"
                    ),

                "district":
                    data.get(
                        "district"
                    ),

                "taluka":
                    data.get(
                        "taluka"
                    ),

                "village":
                    data.get(
                        "village"
                    ),

                "crops":
                    data.get(
                        "crops_grown"
                    )
                    or [],

                "land_size":
                    data.get(
                        "land_size"
                    ),

                "status":
                    membership.get(
                        "status"
                    ),

                "requested_at":
                    membership.get(
                        "requested_at"
                    ),

                "approved_at":
                    membership.get(
                        "approved_at"
                    ),
            }
        )

    return result


def invite(
    row: dict[str, Any],
    user_id: str,
) -> dict[str, Any]:

    authorised(
        row,
        user_id,
        INVITE_FARMERS,
    )

    code = __import__("secrets").token_urlsafe(18)

    entry = {
        "id": __import__("secrets").token_hex(12),
        "code": code,
        "created_at": now(),
        "created_by": user_id,
        "status": "ACTIVE",
        "expires_at": (
            datetime.now(timezone.utc) + timedelta(days=30)
        ).isoformat(),
        "usage_count": 0,
        "max_usage": 100,
        "fpo_id": row["id"],
    }

    invites = [
        *(
            row.get(
                "invite_data"
            )
            or []
        ),
        entry,
    ]

    update_fpo(
        row["id"],
        {
            "invite_data": invites
        },
    )

    return {
        **entry,
        "fpo_id": row["id"],
    }