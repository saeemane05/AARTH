"""
AARTH authentication service.

Authentication:
    Supabase Auth

Application profile:
    public.profiles

The Supabase secret/service key is used ONLY by this backend.
It must never be exposed to React, Vite, Capacitor or Android.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client


BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


PUBLIC_ROLES = {
    "FARMER",
    "FPO",
    "BUYER",
    "LOGISTICS_PARTNER",
    "STORAGE_PARTNER",
}

ALL_ROLES = PUBLIC_ROLES | {
    "ADMIN",
}

AUTH_EMAIL_DOMAIN = "auth.aarth.local"


ROLE_PREFIX = {
    "FARMER": "FRM",
    "FPO": "FPO",
    "BUYER": "BUY",
    "LOGISTICS_PARTNER": "LOG",
    "STORAGE_PARTNER": "STR",
    "ADMIN": "ADM",
}


# =========================================================
# PROFILE FIELD WHITELIST
# =========================================================
#
# This is important.
#
# The frontend cannot send arbitrary future-sprint fields
# and accidentally store them in profile_data.
#
# =========================================================

ROLE_PROFILE_FIELDS = {
    "FARMER": {
        "full_name",
        "phone_number",
        "district",
        "taluka",
        "village",
        "crops_grown",
        "land_production_info",
    },

    "BUYER": {
        "business_name",
        "phone_number",
        "buyer_type",
        "gst_number",
        "district",
        "city",
    },

    "FPO": {
        "fpo_name",
        "registration_number",
        "registration_date",
        "member_count",
        "district",
        "taluka",
        "headquarters_village",
        "crops_handled",
    },

    "LOGISTICS_PARTNER": {
        "business_name",
        "phone_number",
        "district",
        "city",
        "service_area",
        "vehicle_details",
        "capacity",
    },

    "STORAGE_PARTNER": {
        "facility_name",
        "phone_number",
        "district",
        "taluka",
        "village_area",
        "storage_type",
        "total_capacity",
        "supported_commodities",
    },
}


# =========================================================
# CLIENTS
# =========================================================

def _client(admin: bool = False) -> Client:
    url = os.getenv(
        "SUPABASE_URL"
    )

    if admin:
        key = os.getenv(
            "SUPABASE_SECRET_KEY"
        )
    else:
        key = (
            os.getenv(
                "SUPABASE_PUBLISHABLE_KEY"
            )
            or os.getenv(
                "SUPABASE_ANON_KEY"
            )
        )

    if not url:
        raise RuntimeError(
            "SUPABASE_URL is missing."
        )

    if not key:
        if admin:
            raise RuntimeError(
                "SUPABASE_SECRET_KEY is missing."
            )

        raise RuntimeError(
            "SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is missing."
        )

    return create_client(
        url,
        key,
    )


# =========================================================
# HELPERS
# =========================================================

def _normalise_username(
    username: str,
) -> str:
    return username.strip().lower()


def _auth_email(
    username: str,
) -> str:
    """
    AARTH users log in with username.

    Supabase Auth still needs an email-like identity,
    therefore the username is mapped internally to:

        username@auth.aarth.local

    This internal email is never shown to the user.
    """

    return (
        f"{_normalise_username(username)}"
        f"@{AUTH_EMAIL_DOMAIN}"
    )


def _profile_row(
    data: dict[str, Any] | None,
) -> dict[str, Any] | None:

    if not data:
        return None

    return {
        "user_id": data.get(
            "user_id"
        ),

        "username": data.get(
            "username",
            "",
        ),

        "role": data.get(
            "role"
        ),

        "aarth_id": data.get(
            "aarth_id"
        ),

        "farmer_id": data.get(
            "farmer_id"
        ),

        "profile_data":
            data.get(
                "profile_data"
            )
            or {},

        "status": data.get(
            "status",
            "ACTIVE",
        ),
    }


def _get_profile_by_username(
    username: str,
    admin: Client | None = None,
):
    admin = (
        admin
        or _client(admin=True)
    )

    username = _normalise_username(
        username
    )

    response = (
        admin
        .table("profiles")
        .select(
            """
            user_id,
            username,
            role,
            aarth_id,
            farmer_id,
            profile_data,
            status
            """
        )
        .eq(
            "username",
            username,
        )
        .maybe_single()
        .execute()
    )

    return _profile_row(
        response.data
        if response
        else None
    )


def profile_for_user(
    user_id: str,
):
    admin = _client(
        admin=True
    )

    response = (
        admin
        .table("profiles")
        .select(
            """
            user_id,
            username,
            role,
            aarth_id,
            farmer_id,
            profile_data,
            status
            """
        )
        .eq(
            "user_id",
            user_id,
        )
        .maybe_single()
        .execute()
    )

    return _profile_row(
        response.data
        if response
        else None
    )


# =========================================================
# AARTH ID
# =========================================================

def _new_aarth_id(
    role: str,
) -> str:

    prefix = ROLE_PREFIX[
        role
    ]

    number = (
        secrets.randbelow(
            90000
        )
        + 10000
    )

    return (
        f"{prefix}-MH-{number:05d}"
    )


# =========================================================
# PROFILE CREATION
# =========================================================
def _create_profile(
    admin: Client,
    *,
    user_id: str,
    username: str,
    role: str,
):
    last_error = None

    for _ in range(15):
        aarth_id = _new_aarth_id(role)

        profile_data = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "aarth_id": aarth_id,
            "profile_data": {},
            "status": "ACTIVE",
            "farmer_id": None,
        }

        try:
            result = (
                admin
                .table("profiles")
                .upsert(
                    profile_data,
                    on_conflict="user_id",
                )
                .execute()
            )

            if result and result.data:
                return _profile_row(result.data[0])

        except Exception as exc:
            last_error = exc

            message = str(exc).lower()

            if (
                "duplicate" not in message
                and "unique" not in message
            ):
                break

    raise ValueError(
        f"Registration failed while creating the AARTH profile: {last_error}"
    ) from last_error

# =========================================================
# REGISTRATION
# =========================================================

def register(
    payload,
):
    username = _normalise_username(
        payload.username
    )

    role = payload.role

    if role not in PUBLIC_ROLES:
        raise ValueError(
            "Invalid AARTH account role."
        )

    admin = _client(
        admin=True
    )

    existing = (
        _get_profile_by_username(
            username,
            admin,
        )
    )

    if existing:
        raise ValueError(
            "Username already taken."
        )

    created_user = None

    try:
        created_user = (
            admin
            .auth
            .admin
            .create_user(
                {
                    "email": _auth_email(
                        username
                    ),

                    "password":
                        payload.password,

                    "email_confirm":
                        True,

                    "user_metadata": {
                        "username":
                            username,

                        "role":
                            role,
                    },
                }
            )
        )

        if (
            not created_user
            or not created_user.user
        ):
            raise ValueError(
                "Could not create the Supabase Auth account."
            )

        user_id = (
            created_user
            .user
            .id
        )

        profile = (
            _create_profile(
                admin,
                user_id=user_id,
                username=username,
                role=role,
            )
        )

        if not profile:
            raise ValueError(
                "Could not create the AARTH profile."
            )

        session = (
            _client()
            .auth
            .sign_in_with_password(
                {
                    "email":
                        _auth_email(
                            username
                        ),

                    "password":
                        payload.password,
                }
            )
        )

        if (
            not session
            or not session.session
        ):
            raise ValueError(
                "Account created, but automatic login failed. Please login manually."
            )

        return (
            session,
            profile,
        )

    except ValueError:
        if (
            created_user
            and created_user.user
        ):
            try:
                admin.auth.admin.delete_user(
                    created_user.user.id
                )
            except Exception:
                pass

        raise

    except Exception as exc:
        if (
            created_user
            and created_user.user
        ):
            try:
                admin.auth.admin.delete_user(
                    created_user.user.id
                )
            except Exception:
                pass

        raise ValueError(
            "Registration failed. Check your Supabase configuration."
        ) from exc


# =========================================================
# LOGIN
# =========================================================

def login(
    username: str,
    password: str,
):
    username = _normalise_username(
        username
    )

    profile = (
        _get_profile_by_username(
            username
        )
    )

    if not profile:
        return None, None

    if profile["status"] != "ACTIVE":
        return None, None

    try:
        session = (
            _client()
            .auth
            .sign_in_with_password(
                {
                    "email":
                        _auth_email(
                            username
                        ),

                    "password":
                        password,
                }
            )
        )

        if (
            not session
            or not session.session
        ):
            return None, None

        return (
            session,
            profile,
        )

    except Exception:
        return None, None


# =========================================================
# TOKEN REFRESH
# =========================================================

def refresh_session(
    refresh_token: str,
):
    try:
        return (
            _client()
            .auth
            .refresh_session(
                refresh_token
            )
        )
    except Exception as exc:
        raise ValueError(
            "Session refresh failed. Please login again."
        ) from exc


# =========================================================
# PROFILE UPDATE
# =========================================================

def update_profile(
    user_id: str,
    profile_data: dict[str, Any],
):
    admin = _client(
        admin=True
    )

    existing = profile_for_user(
        user_id
    )

    if not existing:
        raise ValueError(
            "AARTH profile not found."
        )

    role = existing["role"]

    allowed_fields = (
        ROLE_PROFILE_FIELDS.get(
            role,
            set(),
        )
    )

    cleaned = {}

    for key, value in (
        profile_data or {}
    ).items():

        if key not in allowed_fields:
            continue

        if value is None:
            cleaned[key] = ""
        elif isinstance(
            value,
            str,
        ):
            cleaned[key] = (
                value.strip()
            )
        else:
            cleaned[key] = value

    current_data = (
        existing.get(
            "profile_data"
        )
        or {}
    )

    merged_data = {
        **current_data,
        **cleaned,
    }

    result = (
        admin
        .table("profiles")
        .update(
            {
                "profile_data":
                    merged_data,
            }
        )
        .eq(
            "user_id",
            user_id,
        )
        .execute()
    )

    if (
        not result
        or not result.data
    ):
        raise ValueError(
            "Could not save the AARTH profile."
        )

    return _profile_row(
        result.data[0]
    )