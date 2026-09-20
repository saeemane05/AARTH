from fastapi import APIRouter, Header, HTTPException, Query

from backend.auth.service import _client
from backend.lot_aggregation.router import _user_id
from .service import (
    buyer_lots,
    buyer_match_detail,
    farmer_match_detail,
    farmer_requirements,
    live_market_prices,
)

router = APIRouter(prefix="/api/matching-engine", tags=["AARTH Matching Engine"])


def _current_user(authorization: str) -> str:
    return _user_id(authorization)


@router.get("/farmer/requirements")
def farmer_discovery(
    limit: int = Query(default=50, ge=1, le=100),
    authorization: str = Header(default=""),
):
    try:
        return {"items": farmer_requirements(_current_user(authorization), limit)}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(403, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Could not load buyer requirements for this farmer.") from exc


@router.get("/farmer/requirements/{requirement_id}/lots/{lot_id}")
def farmer_detail(requirement_id: str, lot_id: str, authorization: str = Header(default="")):
    try:
        result = farmer_match_detail(_current_user(authorization), requirement_id, lot_id)
        if not result:
            raise HTTPException(404, "This requirement/lot match is no longer available.")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Could not load match details.") from exc


@router.get("/buyer/lots")
def buyer_discovery(
    requirement_id: str | None = None,
    commodity_key: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    authorization: str = Header(default=""),
):
    try:
        return {"items": buyer_lots(_current_user(authorization), requirement_id, commodity_key, limit)}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(403, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(500, "Could not load live farmer lots.") from exc


@router.get("/buyer/requirements/{requirement_id}/lots/{lot_id}")
def buyer_detail(requirement_id: str, lot_id: str, authorization: str = Header(default="")):
    try:
        result = buyer_match_detail(_current_user(authorization), requirement_id, lot_id)
        if not result:
            raise HTTPException(404, "This requirement/lot match is no longer available.")
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, "Could not load match details.") from exc


@router.get("/market-prices")
def market_prices(
    crop_key: str,
    latitude: float | None = None,
    longitude: float | None = None,
    top_n: int = Query(default=8, ge=3, le=20),
    authorization: str = Header(default=""),
):
    # Authentication prevents this expensive live source from being abused anonymously.
    _current_user(authorization)
    try:
        return live_market_prices(crop_key, latitude, longitude, top_n)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, "Live APMC prices are temporarily unavailable. You can continue with your own price range.") from exc
