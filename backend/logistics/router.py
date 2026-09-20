from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.auth.service import _client, profile_for_user
from backend.lot_aggregation.router import _user_id

router = APIRouter(prefix="/api/logistics", tags=["Logistics Profile"])

class VehiclePayload(BaseModel):
    registration_number: str = Field(min_length=4, max_length=30)
    vehicle_type: str = Field(min_length=2, max_length=80)
    capacity_value: float = Field(gt=0, le=100000)
    capacity_unit: str

DOCUMENT_COLUMNS = {
    "rc": ("rc_document_path", "rc_document_status"),
    "insurance": ("insurance_document_path", "insurance_document_status"),
    "fitness": ("fitness_document_path", "fitness_document_status"),
    "puc": ("puc_document_path", "puc_document_status"),
    "goods_carriage_permit": ("goods_carriage_permit_document_path", "goods_carriage_permit_document_status"),
}

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

@router.post("/vehicles/{vehicle_id}/documents/{document_type}")
async def upload_vehicle_document(vehicle_id: str, document_type: str, file: UploadFile = File(...), authorization: str = Header(default="")):
    if document_type not in DOCUMENT_COLUMNS:
        raise HTTPException(422, "Unknown vehicle document type.")
    if not file.filename or file.content_type not in {"application/pdf", "image/jpeg", "image/png"}:
        raise HTTPException(422, "Upload a PDF, JPG, or PNG document.")
    try:
        user_id = _user_id(authorization); partner = _partner(user_id); admin = _client(admin=True)
        vehicle = admin.table("logistics_vehicles").select("id,registration_number").eq("id", vehicle_id).eq("logistics_partner_id", partner["id"]).maybe_single().execute().data
        if not vehicle: raise HTTPException(404, "Vehicle not found.")
        content = await file.read()
        if not content or len(content) > 10 * 1024 * 1024: raise HTTPException(422, "Document must be between 1 byte and 10 MB.")
        extension = Path(file.filename).suffix.lower() or ".pdf"
        path = f"{user_id}/{vehicle['id']}/{document_type}-{uuid4().hex}{extension}"
        admin.storage.from_("logistics-documents").upload(path, content, {"content-type": file.content_type, "upsert": "false"})
        path_column, status_column = DOCUMENT_COLUMNS[document_type]
        updated = admin.table("logistics_vehicles").update({path_column: path, status_column: "SUBMITTED"}).eq("id", vehicle_id).eq("logistics_partner_id", partner["id"]).execute().data
        return updated[0]
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(403, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not upload vehicle document.") from exc

@router.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: str, authorization: str = Header(default="")):
    try:
        user_id = _user_id(authorization); partner = _partner(user_id); admin = _client(admin=True)
        vehicle = admin.table("logistics_vehicles").select("id").eq("id", vehicle_id).eq("logistics_partner_id", partner["id"]).maybe_single().execute().data
        if not vehicle: raise HTTPException(404, "Vehicle not found.")
        admin.table("logistics_vehicles").delete().eq("id", vehicle_id).eq("logistics_partner_id", partner["id"]).execute()
        return {"deleted": True, "vehicle_id": vehicle_id}
    except HTTPException: raise
    except ValueError as exc: raise HTTPException(403, str(exc)) from exc
    except Exception as exc: raise HTTPException(500, "Could not delete vehicle.") from exc
