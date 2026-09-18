from fastapi import APIRouter, HTTPException, Query

from .schema import LocationSearchResponse, LocationVerifyRequest
from .service import reverse_location, search_locations

router = APIRouter(prefix="/api/location", tags=["Location"])


@router.get("/search", response_model=LocationSearchResponse)
def search(q: str = Query(min_length=2, max_length=120), district: str | None = None, taluka: str | None = None):
	try:
		return {"suggestions": search_locations(q, district, taluka)}
	except Exception as exc:
		raise HTTPException(502, "Location search is temporarily unavailable.") from exc


@router.post("/reverse")
def reverse(payload: LocationVerifyRequest):
	try:
		return reverse_location(payload.latitude, payload.longitude)
	except ValueError as exc:
		raise HTTPException(422, str(exc)) from exc
	except Exception as exc:
		raise HTTPException(502, "Could not verify the current location.") from exc
