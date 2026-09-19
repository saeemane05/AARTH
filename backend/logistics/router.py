from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from backend.auth.service import _client, profile_for_user
from backend.lot_aggregation.router import _user_id

router = APIRouter(prefix="/api/logistics", tags=["Logistics Profile"])

class VehiclePayload(BaseModel):
    registration_number: str = Field(min_length=4, max_length=30)
    vehicle_type: str = Field(min_length=2, max_length=80)
    capacity_value: float = Field(gt=0, le=100000)
    capacity_unit: str

def _partner(user_id: str):
    profile = profile_for_user(user_id)
    if not profile or profile.get("role") != "LOGISTICS_PARTNER": raise ValueError("Only a logistics partner can manage vehicles.")
    row = _client(admin=True).table("logistics_partners").select("id").eq("user_id", user_id).maybe_single().execute().data
    if not row: raise ValueError("Logistics partner profile is unavailable.")
    return row

@router.get("/vehicles")
def vehicles(authorization: str = Header(default="")):
    try:
        user_id = _user_id(authorization); partner = _partner(user_id)
        return {"vehicles": _client(admin=True).table("logistics_vehicles").select("*").eq("logistics_partner_id", partner["id"]).order("created_at", desc=True).execute().data or []}
    except ValueError as exc: raise HTTPException(403, str(exc)) from exc
    except Exception as exc:
        message = str(exc)
        if "logistics_vehicles" in message and "schema cache" in message:
            raise HTTPException(503, "Vehicle service is being prepared. Apply the pending logistics vehicles migration and try again.") from exc
        raise HTTPException(500, "Could not load vehicles.") from exc

@router.post("/vehicles")
def create_vehicle(payload: VehiclePayload, authorization: str = Header(default="")):
    try:
        user_id = _user_id(authorization); partner = _partner(user_id)
        data = payload.model_dump(); data["registration_number"] = data["registration_number"].upper().replace(" ", ""); data["logistics_partner_id"] = partner["id"]
        return _client(admin=True).table("logistics_vehicles").insert(data).execute().data[0]
    except ValueError as exc: raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        message = str(exc)
        if "logistics_vehicles" in message and "schema cache" in message:
            raise HTTPException(503, "Vehicle service is being prepared. Apply the pending logistics vehicles migration and try again.") from exc
        raise HTTPException(500, "Could not save vehicle.") from exc
