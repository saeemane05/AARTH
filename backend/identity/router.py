from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from backend.auth.service import _client
from .service import farmer_credential, public_farmer_lookup, sync_assisted_onboarding

router = APIRouter(prefix="/api/identity", tags=["Identity"])


class AssistedOnboardingRequest(BaseModel):
    local_id: str
    farmer_id: str
    onboarding_data: dict = {}


def _user_id(authorization: str) -> str:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Authentication required.")
    token = authorization[7:].strip()
    try:
        user = _client().auth.get_user(token).user
    except Exception as exc:
        raise HTTPException(401, "Invalid session.") from exc
    if not user:
        raise HTTPException(401, "Invalid session.")
    return user.id


@router.get("/farmer-credential")
def get_farmer_credential(authorization: str = Header(default="")):
    try:
        return farmer_credential(_user_id(authorization))
    except HTTPException:
        raise
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get("/farmer/{farmer_id}")
def lookup_farmer(farmer_id: str, authorization: str = Header(default="")):
    _user_id(authorization)
    try:
        return public_farmer_lookup(farmer_id)
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.post("/assisted-onboarding/sync")
def sync_onboarding(payload: AssistedOnboardingRequest, authorization: str = Header(default="")):
    try:
        return sync_assisted_onboarding(_user_id(authorization), payload.model_dump())
    except HTTPException:
        raise
    except (ValueError, LookupError) as exc:
        raise HTTPException(400, str(exc)) from exc