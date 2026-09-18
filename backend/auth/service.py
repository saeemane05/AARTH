"""
AARTH authentication service.

Authentication:
    Supabase Auth

Application identity:
    public.profiles

Role-specific identity:
    public.farmers
    public.fpos
    public.buyers
    public.logistics_partners
    public.storage_partners

Design:
    profiles is GENERALIZED. It stores the Supabase user ID,
    generalized AARTH ID, username, role, status and basic
    profile_data.

    Role tables store the role-specific ID plus the same
    Supabase user/profile linkage required to work with that role.

Supabase secret/service key is used ONLY by this backend.
It must never be exposed to React, Vite, Capacitor or Android.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client


# =========================================================
# ENVIRONMENT
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

load_dotenv(BASE_DIR / ".env")


# =========================================================
# ROLES
# =========================================================

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

ROLE_TABLES = {
    "FARMER": "farmers",
    "FPO": "fpos",
    "BUYER": "buyers",
    "LOGISTICS_PARTNER": "logistics_partners",
    "STORAGE_PARTNER": "storage_partners",
}

ROLE_ID_COLUMNS = {
    "FARMER": "farmer_id",
    "FPO": "fpo_id",
    "BUYER": "buyer_id",
    "LOGISTICS_PARTNER": "logistics_partner_id",
    "STORAGE_PARTNER": "storage_partner_id",
}

ROLE_ID_PREFIX = {
    "FARMER": "FRM",
    "FPO": "FPO",
    "BUYER": "BUY",
    "LOGISTICS_PARTNER": "LOG",
    "STORAGE_PARTNER": "STR",
}

AUTH_EMAIL_DOMAIN = "auth.aarth.local"


# =========================================================
# PROFILE FIELD WHITELIST
# =========================================================
#
# These are only BASIC profile/onboarding fields.
#
# Do not add transaction-specific fields here such as:
# - payment preference
# - typical selling quantity
# - selling urgency
# - payment terms
#
# Those belong to later AARTH workflows.
# =========================================================

ROLE_PROFILE_FIELDS = {
    "FARMER": {
        "full_name",
        "phone_number",
        "district",
        "taluka",
        "village",
        "profile_photo",
        "crops_grown",
        "land_size",
        "cultivation_type",
        "fpo_membership",
        "fpo_name",
        "storage_access",
        "storage_type",
        "about_farm",
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
# SUPABASE CLIENTS
# =========================================================

def _client(admin: bool = False) -> Client:
    """
    Create a Supabase client.

    admin=False:
        Uses the publishable/anon key.

    admin=True:
        Uses the server-only secret key.

    Never expose SUPABASE_SECRET_KEY to the frontend.
    """

    url = os.getenv("SUPABASE_URL")

    if not url:
        raise RuntimeError(
            "SUPABASE_URL is missing."
        )

    if admin:
        key = os.getenv("SUPABASE_SECRET_KEY")

        if not key:
            raise RuntimeError(
                "SUPABASE_SECRET_KEY is missing."
            )
    else:
        key = (
            os.getenv("SUPABASE_PUBLISHABLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )

        if not key:
            raise RuntimeError(
                "SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is missing."
            )

    return create_client(url, key)


# =========================================================
# BASIC HELPERS
# =========================================================

def _normalise_username(username: str) -> str:
    return username.strip().lower()


def _auth_email(username: str) -> str:
    """
    AARTH exposes username-based login to the user.

    Supabase Auth uses an internal email-shaped identifier:

        username@auth.aarth.local

    This internal value is never shown in the AARTH UI.
    """

    return (
        f"{_normalise_username(username)}"
        f"@{AUTH_EMAIL_DOMAIN}"
    )


# =========================================================
# ID GENERATION
# =========================================================

def _new_aarth_id() -> str:
    """
    Generate a GENERALIZED AARTH ID.

    Important:
        This must NOT be role-prefixed.

    Correct:
        AAR-MH-48291

    Incorrect:
        FRM-MH-48291
        BUY-MH-48291
    """

    return (
        "AAR-MH-"
        f"{secrets.randbelow(90000) + 10000:05d}"
    )


def _new_role_id(role: str) -> str:
    """
    Generate the role-specific identity ID.

    Examples:
        FRM-MH-12345
        FPO-MH-12345
        BUY-MH-12345
        LOG-MH-12345
        STR-MH-12345

    PostgreSQL remains responsible for the authoritative
    role-table identity after the migration is applied.
    This helper is only a safe fallback for compatibility
    with databases where a trigger is not yet present.
    """

    prefix = ROLE_ID_PREFIX[role]

    return (
        f"{prefix}-MH-"
        f"{secrets.randbelow(90000) + 10000:05d}"
    )


# =========================================================
# PROFILE RESPONSE
# =========================================================

def _profile_row(
    data: dict[str, Any] | None,
) -> dict[str, Any] | None:
    """
    Convert the database profile row into the API shape.

    role_id is resolved separately from the role-specific
    table and is therefore not stored in profiles.
    """

    if not data:
        return None

    return {
        "id": data.get("id"),

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

        "role_id": data.get(
            "role_id"
        ),

        "profile_data": (
            data.get("profile_data")
            or {}
        ),

        "status": data.get(
            "status",
            "ACTIVE",
        ),
    }


# =========================================================
# ROLE IDENTITY LOOKUP
# =========================================================

def _get_role_identity(
    profile: dict[str, Any] | None,
    admin: Client | None = None,
) -> dict[str, Any] | None:
    """
    Resolve the role-specific identity for a profile.

    profiles remains generalized.
    The role-specific ID comes from its own table.

    Returns a compact identity object, for example:

        {
            "role": "FARMER",
            "role_id": "FRM-MH-12345"
        }

    ADMIN has no role table in the current design.
    """

    if not profile:
        return None

    role = profile.get("role")

    if role not in ROLE_TABLES:
        return None

    admin = admin or _client(admin=True)

    table = ROLE_TABLES[role]
    id_column = ROLE_ID_COLUMNS[role]

    try:
        response = (
            admin
            .table(table)
            .select(
                f"profile_id,user_id,{id_column},username,status"
            )
            .eq(
                "profile_id",
                profile.get("id"),
            )
            .maybe_single()
            .execute()
        )
    except Exception:
        # This makes login/profile reads fail gracefully if
        # someone starts the backend before applying the new
        # migration. Once the migration is applied, role_id
        # will be returned normally.
        return None

    if not response or not response.data:
        return None

    row = response.data

    return {
        "role": role,
        "role_id": row.get(id_column),
        "profile_id": row.get("profile_id"),
        "user_id": row.get("user_id"),
        "status": row.get("status"),
    }


# =========================================================
# PROFILE LOOKUP
# =========================================================

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
            id,
            user_id,
            username,
            role,
            aarth_id,
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

    if not response or not response.data:
        return None

    profile = _profile_row(
        response.data
    )

    role_identity = _get_role_identity(
        profile,
        admin,
    )

    if role_identity:
        profile["role_id"] = role_identity.get(
            "role_id"
        )

    return profile


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
            id,
            user_id,
            username,
            role,
            aarth_id,
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

    if not response or not response.data:
        return None

    profile = _profile_row(
        response.data
    )

    role_identity = _get_role_identity(
        profile,
        admin,
    )

    if role_identity:
        profile["role_id"] = role_identity.get(
            "role_id"
        )

    return profile


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
    """
    Create the generalized public.profiles row.

    Do NOT insert farmer_id here.

    After the generalized-profile migration:
        profiles INSERT
             ↓
        PostgreSQL trigger
             ↓
        role-specific table row
    """

    last_error: Exception | None = None

    for _ in range(15):
        profile_data = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "aarth_id": _new_aarth_id(),
            "profile_data": {},
            "status": "ACTIVE",
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
                profile = _profile_row(
                    result.data[0]
                )

                # The trigger in the new migration creates
                # the role-specific table record.
                role_identity = _get_role_identity(
                    profile,
                    admin,
                )

                if role_identity:
                    profile["role_id"] = (
                        role_identity.get("role_id")
                    )

                return profile

        except Exception as exc:
            last_error = exc

            message = str(exc).lower()

            if (
                "duplicate" not in message
                and "unique" not in message
            ):
                break

    raise ValueError(
        "Registration failed while creating the AARTH profile."
    ) from last_error


# =========================================================
# REGISTRATION
# =========================================================

def register(payload):
    """
    Register any PUBLIC AARTH role.

    Flow:

        username + password + role
                    ↓
             Supabase Auth
                    ↓
                auth.users
                    ↓
             public.profiles
                    ↓
          PostgreSQL role trigger
                    ↓
          role-specific table
                    ↓
          automatic Supabase login
    """

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

    existing = _get_profile_by_username(
        username,
        admin,
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

        profile = _create_profile(
            admin,
            user_id=user_id,
            username=username,
            role=role,
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

        # Re-read the profile so the response definitely
        # contains the role-specific ID created by the DB trigger.
        final_profile = profile_for_user(
            user_id
        )

        if not final_profile:
            raise ValueError(
                "Account was created but the AARTH profile could not be loaded."
            )

        return (
            session,
            final_profile,
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
    """
    Username + password login.

    Flow:

        username
            ↓
        profiles
            ↓
        profiles.user_id
            ↓
        internal Auth email
            ↓
        Supabase password authentication
            ↓
        session
            ↓
        generalized + role-specific profile
    """

    username = _normalise_username(
        username
    )

    profile = _get_profile_by_username(
        username
    )

    if not profile:
        return None, None

    if profile.get("status") != "ACTIVE":
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

        # Refresh profile information so role_id is
        # definitely current after successful authentication.
        authenticated_user_id = (
            session.user.id
            if getattr(session, "user", None)
            else profile.get("user_id")
        )

        final_profile = profile_for_user(
            authenticated_user_id
        )

        if not final_profile:
            return None, None

        if final_profile.get("status") != "ACTIVE":
            return None, None

        return (
            session,
            final_profile,
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
    """
    Update only the basic profile_data fields allowed for
    the authenticated user's role.

    Identity fields are never accepted from this endpoint:
        user_id
        aarth_id
        role
        role_id
        status
        farmer_id / fpo_id / buyer_id / etc.
    """

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

    role = existing.get("role")

    allowed_fields = ROLE_PROFILE_FIELDS.get(
        role,
        set(),
    )

    cleaned = {}

    for key, value in (
        profile_data or {}
    ).items():

        if key not in allowed_fields:
            continue

        if value is None:
            cleaned[key] = ""

        elif isinstance(value, str):
            cleaned[key] = value.strip()

        else:
            cleaned[key] = value

    current_data = (
        existing.get("profile_data")
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

    updated = _profile_row(
        result.data[0]
    )

    role_identity = _get_role_identity(
        updated,
        admin,
    )

    if role_identity:
        updated["role_id"] = (
            role_identity.get("role_id")
        )

    return updated


# =========================================================
# CURRENT AUTH USER
# =========================================================

def get_user(
    access_token: str,
):
    """
    Validate a Supabase access token and return the
    authenticated Supabase Auth user.
    """

    client = _client()

    return client.auth.get_user(
        access_token
    )


# =========================================================
# CURRENT USER PROFILE
# =========================================================

def get_current_profile(
    access_token: str,
):
    """
    Resolve:

        access_token
             ↓
        Supabase Auth user
             ↓
           user_id
             ↓
        public.profiles
             ↓
       role-specific table
             ↓
      generalized + role identity
    """

    user_response = get_user(
        access_token
    )

    if (
        not user_response
        or not user_response.user
    ):
        raise ValueError(
            "Invalid or expired session."
        )

    user_id = user_response.user.id

    profile = profile_for_user(
        user_id
    )

    if not profile:
        raise ValueError(
            "AARTH profile not found."
        )

    if profile.get("status") != "ACTIVE":
        raise ValueError(
            "AARTH account is not active."
        )

    return {
        **profile,
        "phone": getattr(
            user_response.user,
            "phone",
            None,
        ),
        "email": getattr(
            user_response.user,
            "email",
            None,
        ),
    }


# =========================================================
# BACKWARD-COMPATIBILITY ALIAS
# =========================================================
#
# Existing code that still imports get_current_farmer()
# will continue to work during the transition.
#
# The function is now generalized and does NOT assume FARMER.
# =========================================================

def get_current_farmer(
    access_token: str,
):
    return get_current_profile(
        access_token
    )


# =========================================================
# LOGOUT
# =========================================================

def logout(
    access_token: str,
) -> None:
    """
    Sign out the current Supabase session.

    If the installed supabase-py version does not expose
    admin.sign_out(), the frontend can still discard the
    session and let the token expire naturally.
    """

    admin = _client(
        admin=True
    )

    try:
        admin.auth.admin.sign_out(
            access_token
        )

    except AttributeError:
        # Older supabase-py versions may not support this.
        pass

    except Exception:
        # Logout should not make the client appear broken.
        # The frontend already clears its local session.
        pass
