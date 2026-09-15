"""Username/password authentication backed only by Supabase Auth."""
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

PUBLIC_ROLES = {"FARMER", "FPO", "BUYER", "LOGISTICS_PARTNER", "STORAGE_PARTNER"}
AUTH_EMAIL_DOMAIN = "auth.aarth.local"


def _client(admin=False):
    key = os.getenv("SUPABASE_SECRET_KEY") if admin else os.getenv("SUPABASE_PUBLISHABLE_KEY")
    return create_client(os.environ["SUPABASE_URL"], key)


def _auth_email(username: str) -> str:
    """Internal Supabase identifier; neither the API nor UI collect email."""
    return f"{username.lower()}@{AUTH_EMAIL_DOMAIN}"


def _public_account(user) -> dict:
    metadata = user.user_metadata or {}
    role = metadata.get("role")
    if role not in PUBLIC_ROLES:
        raise ValueError("This account has no valid AARTH role. Please register again.")
    return {"user_id": user.id, "username": metadata.get("username", ""), "role": role}


def _user_for_username(username: str):
    """Find the Auth user whose AARTH username is stored in user metadata."""
    normalised = username.strip().lower()
    page = 1
    while True:
        result = _client(True).auth.admin.list_users(page=page, per_page=1000)
        users = result if isinstance(result, list) else (getattr(result, "users", None) or [])
        for user in users:
            if (user.user_metadata or {}).get("username", "").lower() == normalised:
                return user
        if len(users) < 1000:
            return None
        page += 1


def profile_for_user(user_id: str):
    response = _client(True).auth.admin.get_user_by_id(user_id)
    return _public_account(response.user) if response and response.user else None


def register(payload):
    if _user_for_username(payload.username):
        raise ValueError("Username already taken")
    created = _client(True).auth.admin.create_user({
        "email": _auth_email(payload.username), "password": payload.password, "email_confirm": True,
        "user_metadata": {"username": payload.username, "role": payload.role},
    })
    if not created or not created.user:
        raise ValueError("Could not create account")
    try:
        session = _client().auth.sign_in_with_password({"email": _auth_email(payload.username), "password": payload.password})
        if not session or not session.session:
            raise ValueError("Account was created but could not be signed in")
        return session, _public_account(created.user)
    except Exception:
        _client(True).auth.admin.delete_user(created.user.id)
        raise


def login(username: str, password: str):
    user = _user_for_username(username)
    if not user:
        return None, None
    try:
        session = _client().auth.sign_in_with_password({"email": _auth_email(username), "password": password})
        return session, _public_account(user)
    except Exception:
        return None, None
