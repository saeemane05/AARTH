import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client


# =========================================================
# ENVIRONMENT
# =========================================================

# Current structure:
#
# AARTH/
# ├── .env
# └── backend/
#     └── PROFILE/
#         └── FARMER/
#             └── service.py
#
# service.py
#     parents[0] = FARMER
#     parents[1] = PROFILE
#     parents[2] = backend
#     parents[3] = AARTH

BASE_DIR = Path(__file__).resolve().parents[3]

load_dotenv(BASE_DIR / ".env")


logger = logging.getLogger("seva.farmer.auth")


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SECRET = os.getenv("SUPABASE_SECRET_KEY")


if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing")

if not SUPABASE_KEY:
    raise RuntimeError(
        "SUPABASE_PUBLISHABLE_KEY is missing"
    )

if not SUPABASE_SECRET:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY is missing"
    )


# =========================================================
# CLIENT FACTORIES
# =========================================================

def _client() -> Client:
    """
    Normal Supabase client.

    Used for:
    - Password login
    - OTP
    - Token validation

    The publishable key is safe for client-side use,
    but this backend still keeps authentication logic here.
    """

    return create_client(
        SUPABASE_URL,
        SUPABASE_KEY
    )


def _admin_client() -> Client:
    """
    Privileged Supabase client.

    SERVER ONLY.

    The secret key bypasses RLS and must NEVER be
    exposed to frontend/mobile applications.
    """

    return create_client(
        SUPABASE_URL,
        SUPABASE_SECRET
    )


# =========================================================
# PROFILE HELPERS
# =========================================================

def _get_profile_by_username(
    admin: Client,
    username: str
):
    """
    Find a SEVA profile using username.

    Username comparison is case-insensitive.
    """

    result = (
        admin
        .table("profiles")
        .select(
            """
            id,
            user_id,
            farmer_id,
            username,
            role,
            status
            """
        )
        .ilike("username", username)
        .maybe_single()
        .execute()
    )

    return result.data if result else None


def _get_profile_by_user_id(
    admin: Client,
    user_id: str
):
    """
    Find a SEVA profile using Supabase Auth user ID.
    """

    result = (
        admin
        .table("profiles")
        .select(
            """
            id,
            user_id,
            farmer_id,
            username,
            role,
            status
            """
        )
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    return result.data if result else None


# =========================================================
# REGISTRATION
# =========================================================

def register_farmer(
    phone: str,
    username: str,
    password: str,
    role: str = "FARMER"
):
    """
    Register a new farmer.

    Flow:

        username + phone + password
                    ↓
             Supabase Auth
                    ↓
               auth.users
                    ↓
               profiles
                    ↓
            farmer_id generated
             by PostgreSQL
    """

    admin = _admin_client()

    # -----------------------------------------------------
    # 1. Check username
    # -----------------------------------------------------

    existing = _get_profile_by_username(
        admin,
        username
    )

    if existing:
        raise ValueError(
            "Username already taken"
        )

    # -----------------------------------------------------
    # 2. Validate role
    # -----------------------------------------------------

    allowed_roles = {
        "FARMER",
        "FPO",
        "PACS",
        "BUYER",
        "STORAGE",
        "LOGISTICS",
        "ASSAYER",
        "ADMIN",
    }

    if role not in allowed_roles:
        raise ValueError(
            "Invalid account role"
        )

    # -----------------------------------------------------
    # 3. Create Supabase Auth user
    # -----------------------------------------------------

    try:

        created_user = (
            admin
            .auth
            .admin
            .create_user(
                {
                    "phone": phone,
                    "password": password,

                    # This is important because this
                    # registration flow is being initiated
                    # after phone verification.
                    "phone_confirm": True,

                    "user_metadata": {
                        "username": username,
                        "role": role,
                    },
                }
            )
        )

    except Exception as e:

        logger.exception(
            "Supabase Auth user creation failed"
        )

        # Do not expose raw Supabase errors to client.
        raise ValueError(
            "Could not create account"
        ) from e

    if (
        not created_user
        or not created_user.user
    ):
        raise ValueError(
            "Could not create account"
        )

    user_id = created_user.user.id

    # -----------------------------------------------------
    # 4. Create SEVA profile
    # -----------------------------------------------------
    #
    # farmer_id is NOT supplied here.
    #
    # PostgreSQL automatically generates:
    #
    # FAR-MH-482731
    #
    # through the database default:
    #
    # public.generate_farmer_id()
    #

    try:

        profile_result = (
            admin
            .table("profiles")
            .insert(
                {
                    "user_id": user_id,
                    "username": username,
                    "role": role,
                    "status": "ACTIVE",
                }
            )
            .execute()
        )

    except Exception as e:

        logger.exception(
            "Profile creation failed for user_id=%s",
            user_id
        )

        # -------------------------------------------------
        # Roll back Auth user
        # -------------------------------------------------

        try:

            admin.auth.admin.delete_user(
                user_id
            )

        except Exception:

            logger.exception(
                "Auth rollback failed for user_id=%s",
                user_id
            )

        raise ValueError(
            "Registration failed. Please try again."
        ) from e

    # -----------------------------------------------------
    # 5. Verify that profile was actually created
    # -----------------------------------------------------

    profile = _get_profile_by_user_id(
        admin,
        user_id
    )

    if not profile:

        logger.error(
            "Auth user exists but profile was not found. "
            "user_id=%s",
            user_id
        )

        try:

            admin.auth.admin.delete_user(
                user_id
            )

        except Exception:

            logger.exception(
                "Cleanup failed for user_id=%s",
                user_id
            )

        raise ValueError(
            "Registration could not be completed"
        )

    # -----------------------------------------------------
    # 6. Make sure Farmer ID exists
    # -----------------------------------------------------

    if not profile.get("farmer_id"):

        logger.error(
            "Profile created without farmer_id. "
            "user_id=%s",
            user_id
        )

        raise ValueError(
            "Farmer identity could not be created"
        )

    # -----------------------------------------------------
    # 7. Automatically log farmer in
    # -----------------------------------------------------

    try:

        session = (
            _client()
            .auth
            .sign_in_with_password(
                {
                    "phone": phone,
                    "password": password,
                }
            )
        )

    except Exception as e:

        logger.exception(
            "Automatic login failed after registration "
            "for user_id=%s",
            user_id
        )

        # Registration itself succeeded.
        # Do not delete the user here.
        raise ValueError(
            "Account created, but automatic login failed. "
            "Please login again."
        ) from e

    return session


# =========================================================
# PHONE OTP LOGIN
# =========================================================

def send_login_otp(
    phone: str
):
    """
    Send OTP to an existing Supabase Auth user.

    should_create_user=False is important.

    OTP login must NOT silently create a new
    SEVA farmer account.
    """

    client = _client()

    return (
        client
        .auth
        .sign_in_with_otp(
            {
                "phone": phone,

                "options": {
                    "should_create_user": False
                }
            }
        )
    )


def verify_login_otp(
    phone: str,
    token: str
):
    """
    Verify phone OTP and create a Supabase session.
    """

    client = _client()

    return (
        client
        .auth
        .verify_otp(
            {
                "phone": phone,
                "token": token,
                "type": "sms",
            }
        )
    )


# =========================================================
# USERNAME + PASSWORD LOGIN
# =========================================================

def login_username(
    username: str,
    password: str
):
    """
    Login using:

        SEVA username
              ↓
        profiles.user_id
              ↓
        auth.users.phone
              ↓
        Supabase password authentication
    """

    admin = _admin_client()

    # -----------------------------------------------------
    # 1. Find SEVA profile
    # -----------------------------------------------------

    profile = _get_profile_by_username(
        admin,
        username
    )

    if not profile:
        return None

    # -----------------------------------------------------
    # 2. Check account status
    # -----------------------------------------------------

    if profile["status"] != "ACTIVE":
        return None

    user_id = profile["user_id"]

    # -----------------------------------------------------
    # 3. Find Supabase Auth user
    # -----------------------------------------------------

    try:

        auth_user_response = (
            admin
            .auth
            .admin
            .get_user_by_id(
                user_id
            )
        )

    except Exception:

        logger.exception(
            "Could not retrieve Auth user "
            "for user_id=%s",
            user_id
        )

        return None

    if (
        not auth_user_response
        or not auth_user_response.user
    ):
        return None

    auth_user = auth_user_response.user

    # -----------------------------------------------------
    # 4. Phone is the underlying Auth identifier
    # -----------------------------------------------------

    if not auth_user.phone:
        return None

    # -----------------------------------------------------
    # 5. Let Supabase verify password
    # -----------------------------------------------------

    try:

        return (
            _client()
            .auth
            .sign_in_with_password(
                {
                    "phone": auth_user.phone,
                    "password": password,
                }
            )
        )

    except Exception:

        # Wrong password / authentication failure.
        return None


# =========================================================
# FORGOT USERNAME
# =========================================================

def send_forgot_username_otp(
    phone: str
):
    """
    Send OTP for username recovery.

    OTP verification happens through Supabase Auth.
    """

    return send_login_otp(phone)


def verify_forgot_username_otp(
    phone: str,
    token: str
):
    """
    Verify OTP and retrieve the SEVA username.
    """

    response = verify_login_otp(
        phone,
        token
    )

    if (
        not response
        or not response.user
    ):
        return None

    user_id = response.user.id

    admin = _admin_client()

    profile = _get_profile_by_user_id(
        admin,
        user_id
    )

    if not profile:
        return None

    return profile.get("username")


# =========================================================
# FORGOT PASSWORD
# =========================================================

def send_forgot_password_otp(
    phone: str
):
    """
    Send OTP for password recovery.
    """

    return send_login_otp(phone)


def verify_forgot_password_otp(
    phone: str,
    token: str
):
    """
    Verify OTP.

    Supabase returns a temporary authenticated
    session which is then used by reset_password().
    """

    return verify_login_otp(
        phone,
        token
    )


def reset_password(
    access_token: str,
    new_password: str
):
    """
    Reset password using the authenticated
    recovery session.

    Supabase Auth remains responsible for storing
    the password securely.
    """

    client = _client()

    # -----------------------------------------------------
    # 1. Validate recovery session
    # -----------------------------------------------------

    try:

        user_response = (
            client
            .auth
            .get_user(
                access_token
            )
        )

    except Exception as e:

        raise ValueError(
            "Invalid or expired reset session"
        ) from e

    if (
        not user_response
        or not user_response.user
    ):
        raise ValueError(
            "Invalid or expired reset session"
        )

    user_id = user_response.user.id

    # -----------------------------------------------------
    # 2. Make sure SEVA profile exists
    # -----------------------------------------------------

    admin = _admin_client()

    profile = _get_profile_by_user_id(
        admin,
        user_id
    )

    if not profile:
        raise ValueError(
            "Farmer profile not found"
        )

    # -----------------------------------------------------
    # 3. Update password
    # -----------------------------------------------------

    try:

        admin.auth.admin.update_user_by_id(
            user_id,
            {
                "password": new_password
            }
        )

    except Exception as e:

        logger.exception(
            "Password update failed for user_id=%s",
            user_id
        )

        raise ValueError(
            "Unable to update password"
        ) from e

    return True


# =========================================================
# CURRENT USER
# =========================================================

def get_user(
    access_token: str
):
    """
    Validate Supabase access token and return
    the authenticated Auth user.
    """

    client = _client()

    return client.auth.get_user(
        access_token
    )


# =========================================================
# CURRENT FARMER PROFILE
# =========================================================

def get_current_farmer(
    access_token: str
):
    """
    Resolve:

        access_token
             ↓
        Supabase Auth user
             ↓
          user_id
             ↓
        SEVA profile
             ↓
        farmer_id
    """

    user_response = get_user(
        access_token
    )

    if (
        not user_response
        or not user_response.user
    ):
        raise ValueError(
            "Invalid or expired session"
        )

    user_id = user_response.user.id

    admin = _admin_client()

    profile = _get_profile_by_user_id(
        admin,
        user_id
    )

    if not profile:
        raise ValueError(
            "Farmer profile not found"
        )

    return {
        "user_id": user_id,
        "farmer_id": profile["farmer_id"],
        "username": profile["username"],
        "role": profile["role"],
        "status": profile["status"],
        "phone": user_response.user.phone,
        "email": user_response.user.email,
    }

# =========================================================
# LOGOUT
# =========================================================

def logout(
    access_token: str
) -> None:
    """
    Sign out the current Supabase session.

    If server-side sign-out is unavailable in the installed
    supabase-py version, the client can still discard its
    access token and let it expire naturally.
    """

    admin = _admin_client()

    try:

        admin.auth.admin.sign_out(
            access_token
        )

    except AttributeError:

        logger.warning(
            "Installed supabase-py version does not support "
            "admin.sign_out. Relying on client-side token "
            "discard and natural expiry."
        )

    except Exception:

        logger.exception(
            "Server-side sign-out failed"
        )

        raise