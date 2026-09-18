import json
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile

from backend.auth.service import _client
from .schema import LotCreateRequest
from .service import create_lot, get_lot, list_lots, summary, _get_farmer

router = APIRouter(prefix="/api/lots", tags=["Farmer Lots"])


def _user_id(authorization: str) -> str:
	if not authorization.lower().startswith("bearer "):
		raise HTTPException(401, "Invalid authorization header.")
	try:
		user = _client().auth.get_user(authorization[7:].strip()).user
		if not user:
			raise ValueError()
		return user.id
	except Exception as exc:
		raise HTTPException(401, "Invalid session.") from exc


@router.get("")
def my_lots(authorization: str = Header(default="")):
	try:
		return {"lots": list_lots(_user_id(authorization))}
	except HTTPException:
		raise
	except ValueError as exc:
		raise HTTPException(403, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(500, "Could not load farmer lots.") from exc


@router.get("/summary")
def lots_summary(authorization: str = Header(default="")):
	try:
		return summary(_user_id(authorization))
	except HTTPException:
		raise
	except ValueError as exc:
		raise HTTPException(403, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(500, "Could not load lot status.") from exc


@router.get("/{lot_id}")
def lot_detail(lot_id: str, authorization: str = Header(default="")):
	try:
		lot = get_lot(_user_id(authorization), lot_id)
		if not lot:
			raise HTTPException(404, "Lot not found.")
		return lot
	except HTTPException:
		raise
	except ValueError as exc:
		raise HTTPException(403, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(500, "Could not load the lot.") from exc


@router.post("")
def create_farmer_lot(payload: LotCreateRequest, authorization: str = Header(default="")):
	try:
		return create_lot(_user_id(authorization), payload)
	except HTTPException:
		raise
	except ValueError as exc:
		raise HTTPException(422, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(500, "Could not create the farmer lot.") from exc


@router.post("/{lot_id}/evidence")
async def submit_lot_evidence(
	lot_id: str,
	files: list[UploadFile] = File(...),
	metadata: str = Form(...),
	authorization: str = Header(default=""),
):
	user_id = _user_id(authorization)
	if len(files) < 4 or len(files) > 5:
		raise HTTPException(422, "Four to five evidence photos are required.")
	try:
		items = json.loads(metadata)
		if not isinstance(items, list) or len(items) != len(files):
			raise ValueError("Evidence metadata does not match the uploaded photos.")
		_get_farmer(user_id)
		admin = _client(admin=True)
		lot = admin.table("farmer_lots").select("id, lot_id, user_id, status").eq("lot_id", lot_id).eq("user_id", user_id).maybe_single().execute().data
		if not lot:
			raise HTTPException(404, "Lot not found.")
		admin.table("lot_evidence").delete().eq("lot_id", lot["id"]).execute()
		stored = []
		for index, (upload, item) in enumerate(zip(files, items), start=1):
			if item.get("capture_source") != "aarth_camera":
				raise ValueError("Evidence must be captured inside AARTH.")
			if item.get("latitude") is None or item.get("longitude") is None or item.get("gps_accuracy") is None or not item.get("captured_at_client"):
				raise ValueError("Every photo needs fresh GPS and capture metadata.")
			content = await upload.read()
			if not content or not upload.content_type or not upload.content_type.startswith("image/"):
				raise ValueError("Evidence files must be images.")
			path = f"{user_id}/{lot['lot_id']}/{index}-{datetime.now(timezone.utc).timestamp()}.jpg"
			admin.storage.from_("lot-evidence").upload(path, content, {"content-type": upload.content_type, "upsert": "false"})
			row = {
				"lot_id": lot["id"], "sequence_number": index, "storage_path": path,
				"captured_at_client": item["captured_at_client"], "latitude": item["latitude"],
				"longitude": item["longitude"], "gps_accuracy": item["gps_accuracy"],
				"capture_source": "aarth_camera", "status": "SUBMITTED",
			}
			stored.append(admin.table("lot_evidence").insert(row).execute().data[0])
		now = datetime.now(timezone.utc).isoformat()
		admin.table("farmer_lots").update({"status": "ACTIVE", "evidence_status": "SUBMITTED", "verification_status": "VERIFIED", "evidence": stored, "updated_at": now}).eq("id", lot["id"]).eq("user_id", user_id).execute()
		return {"lot_id": lot["lot_id"], "evidence_status": "SUBMITTED", "verification_status": "VERIFIED", "evidence": stored}
	except HTTPException:
		raise
	except (ValueError, json.JSONDecodeError) as exc:
		raise HTTPException(422, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(502, "Some evidence photos could not be uploaded. Please retry.") from exc
