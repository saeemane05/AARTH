"""
AARTH Matching Engine - Market Price Route Patch

Purpose:
    Provides the corrected /market-prices route behavior.

Important:
    This file is a patch/reference module.

    The actual route used by FastAPI should ultimately live in:
        backend/matching_engine/router.py

    Do NOT import this module from router.py if router.py already imports
    market_router_patch.py, because that can create a circular import.

    If you are applying this patch manually, copy the route below into
    backend/matching_engine/router.py.
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Query

from .market_service import live_market_prices


# ---------------------------------------------------------------------------
# Patch router
# ---------------------------------------------------------------------------
#
# This router is intentionally separate from the main matching-engine router.
# It exists so this patch file is syntactically complete and can be checked
# independently by VS Code / Pylance.
#
# The production application should register the actual route from
# backend/matching_engine/router.py.
#

router = APIRouter()


# ---------------------------------------------------------------------------
# Authentication helper
# ---------------------------------------------------------------------------

def _current_user(authorization: str) -> str:
    """
    Validate that an Authorization header is present.

    The main matching-engine router has its own _current_user implementation.
    This local implementation keeps this patch file standalone.

    IMPORTANT:
        If your application's existing authentication helper performs actual
        Supabase/JWT validation, the main router's helper should be used there.
        This patch helper only ensures the request contains a Bearer token.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header.",
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization token.",
        )

    return token


# ---------------------------------------------------------------------------
# Market Prices
# ---------------------------------------------------------------------------

@router.get("/market-prices")
def market_prices(
    crop_key: str,
    latitude: float | None = None,
    longitude: float | None = None,
    top_n: int = Query(
        default=8,
        ge=3,
        le=20,
    ),
    authorization: str = Header(default=""),
):
    """
    Return live market-price intelligence for the requested crop.

    Market intelligence is advisory.

    A temporary MSAMB/APMC/network/parser failure must NEVER prevent
    a buyer from creating or publishing a requirement.

    Expected behavior:

        Successful market lookup
            ->
        HTTP 200
            ->
        Live market data

    OR:

        Temporary market-data failure
            ->
        HTTP 200
            ->
        available = False
            ->
        Buyer can continue with own buying range

    Invalid request parameters are returned as HTTP 422.
    """

    # -----------------------------------------------------------------------
    # Authentication
    # -----------------------------------------------------------------------

    _current_user(authorization)

    # -----------------------------------------------------------------------
    # Validate crop key
    # -----------------------------------------------------------------------

    if not crop_key or not crop_key.strip():
        raise HTTPException(
            status_code=422,
            detail="Crop key is required.",
        )

    crop_key = crop_key.strip()

    # -----------------------------------------------------------------------
    # Market intelligence lookup
    # -----------------------------------------------------------------------

    try:
        return live_market_prices(
            crop_key,
            latitude,
            longitude,
            top_n,
        )

    # -----------------------------------------------------------------------
    # Expected validation errors
    # -----------------------------------------------------------------------

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    # -----------------------------------------------------------------------
    # External market-data failure
    # -----------------------------------------------------------------------
    #
    # This is deliberately NOT converted into HTTP 502.
    #
    # The buyer requirement workflow must remain independent of the live
    # market-price service.
    #

    except Exception:
        return {
            "available": False,
            "crop_key": crop_key,
            "crop_name": crop_key,
            "summary": None,
            "apmcs": [],
            "message": (
                "Live APMC prices are temporarily unavailable. "
                "You can continue with your own buying range."
            ),
        }


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

__all__ = [
    "router",
    "market_prices",
]