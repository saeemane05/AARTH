
import sys
import os
import time

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/api",
    tags=["Market Intelligence"],
)


MAX_ROUTE_POINTS = 90

MAX_ROUTE_STOPS = 50

ROUTE_COORD_PRECISION = 5

PROFIT_LOSS_CACHE_TTL_SEC = 15 * 60

MARKET_RATES_CACHE_TTL_SEC = 15 * 60


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(
        encoding="utf-8",
        errors="replace",
    )


ENGINE_AVAILABLE = False

_import_error = ""


try:

    # AARTH Market Intelligence Engine
    # Single source of truth: backend/ProfitLoss/

    from backend.ProfitLoss.profit_loss import (
        calculate_net_profit
    )

    from backend.ProfitLoss.market_rates import (
        fetch_msamb_data,
        crop_master,
        MSAMB_CODE_TO_MR,
    )

    from backend.ProfitLoss.market_trend_analysis import (
        fetch_nearby_market_data
    )

    import pandas as pd

    import numpy as np

    from sklearn.linear_model import LinearRegression

    ENGINE_AVAILABLE = True

    _import_error = ""

    print(
        "  ✅ ProfitLoss engine loaded"
    )


except ImportError as e:

    ENGINE_AVAILABLE = False

    _import_error = str(e)

    print(
        f"  ⚠ ProfitLoss engine not loaded: {e}"
    )


def _log_market_error(
    context: str,
    exc: Exception,
) -> None:

    print(
        f"[Market Intelligence] "
        f"{context}: "
        f"{exc.__class__.__name__}: "
        f"{exc}"
    )


def _market_http_exception(
    context: str,
    exc: Exception,
) -> HTTPException:

    _log_market_error(
        context,
        exc,
    )

    raw = str(
        exc or ""
    ).lower()

    if any(
        token in raw
        for token in [
            "failed to resolve",
            "getaddrinfo failed",
            "name resolution",
            "max retries exceeded",
            "httpsconnectionpool",
            "temporarily unavailable",
            "temporary failure",
            "failed to establish a new connection",
            "network is unreachable",
            "connection aborted",
            "connection refused",
            "failed to fetch",
            "no internet",
        ]
    ):

        return HTTPException(
            503,
            "Live mandi data source is temporarily unreachable. "
            "Please try again shortly.",
        )

    if any(
        token in raw
        for token in [
            "no price data for nearby apmcs",
            "no price data matched",
            "returned no price data",
            "not available for this crop",
            "no nearby market",
            "no data found",
            "could not find market data",
            "this crop may not have had any arrivals",
        ]
    ):

        return HTTPException(
            404,
            "Market data is not available for this crop right now.",
        )

    if any(
        token in raw
        for token in [
            "unsupported crop",
            "crop not found",
            "invalid crop",
            "unknown crop",
        ]
    ):

        return HTTPException(
            400,
            "This crop is not supported in the market engine yet.",
        )

    return HTTPException(
        500,
        "Unable to load market data right now. "
        "Please try again shortly.",
    )


def _engine_unavailable_exception() -> HTTPException:

    if _import_error:

        print(
            f"[Market Intelligence] "
            f"Engine unavailable: "
            f"{_import_error}"
        )

    return HTTPException(
        503,
        "Market engine is not available right now. "
        "Please try again shortly.",
    )


_profit_loss_cache: dict[
    tuple,
    tuple[float, dict]
] = {}


_market_rates_cache: dict[
    tuple,
    tuple[float, dict]
] = {}


def _build_cache_key(*parts):

    return tuple(parts)


def _read_cache(
    cache: dict,
    key: tuple,
    ttl_seconds: int,
):

    entry = cache.get(key)

    if not entry:

        return None

    ts, payload = entry

    if (
        time.time() - ts
    ) > ttl_seconds:

        cache.pop(
            key,
            None,
        )

        return None

    return payload


def _write_cache(
    cache: dict,
    key: tuple,
    payload: dict,
):

    cache[key] = (
        time.time(),
        payload,
    )

    if len(cache) > 256:

        oldest_key = min(
            cache,
            key=lambda item: cache[item][0],
        )

        cache.pop(
            oldest_key,
            None,
        )


class ProfitLossRequest(BaseModel):

    crop_en: str

    quantity_quintal: float = Field(
        ...,
        gt=0,
    )

    farmer_lat: float

    farmer_lon: float

    vehicle_type: str = "tractor"

    ownership: str = "own"

    mileage_kmpl: Optional[float] = None

    fuel_type: Optional[str] = None

    rent_per_km: Optional[float] = None


class MarketTrendRequest(BaseModel):

    crop_mr: str

    farmer_lat: float

    farmer_lon: float


class MarketRatesRequest(BaseModel):

    crop_mr: str

    farmer_lat: float

    farmer_lon: float

    vehicle_type: str = "tractor"

    ownership: str = "own"

    mileage_kmpl: Optional[float] = None

    fuel_type: Optional[str] = None

    rent_per_km: Optional[float] = None

    top_n: int = 50


@router.get(
    "/profit-loss/health"
)
def pl_health():

    return {
        "engine_available": ENGINE_AVAILABLE,
        "error": (
            _import_error
            if not ENGINE_AVAILABLE
            else None
        ),
    }


@router.get(
    "/profit-loss/crops"
)
def get_profit_loss_crops():

    if not ENGINE_AVAILABLE:

        raise _engine_unavailable_exception()

    crops = []

    for en_key, info in crop_master.items():

        crops.append(
            {
                "en": str(en_key),

                "mr": str(
                    info.get(
                        "mr",
                        "",
                    )
                ),

                "code": str(
                    info.get(
                        "code",
                        "",
                    )
                ),
            }
        )

    return {
        "count": len(crops),
        "crops": crops,
    }


@router.post(
    "/profit-loss"
)
async def get_profit_loss(
    req: ProfitLossRequest,
):

    if not ENGINE_AVAILABLE:

        raise _engine_unavailable_exception()

    if (
        req.ownership == "own"
        and req.mileage_kmpl is None
    ):

        raise HTTPException(
            400,
            "mileage_kmpl required for own vehicle",
        )

    if (
        req.ownership == "rented"
        and req.rent_per_km is None
    ):

        raise HTTPException(
            400,
            "rent_per_km required for rented vehicle",
        )

    if (
        req.ownership == "own"
        and req.vehicle_type != "tractor"
        and req.fuel_type is None
    ):

        raise HTTPException(
            400,
            "fuel_type required for non-tractor own vehicle",
        )

    cache_key = _build_cache_key(

        req.crop_en.strip().lower(),

        round(
            req.quantity_quintal,
            2,
        ),

        round(
            req.farmer_lat,
            4,
        ),

        round(
            req.farmer_lon,
            4,
        ),

        req.vehicle_type.strip().lower(),

        req.ownership.strip().lower(),

        round(
            req.mileage_kmpl or 0,
            2,
        ),

        (
            req.fuel_type or ""
        ).strip().lower(),

        round(
            req.rent_per_km or 0,
            2,
        ),
    )

    cached_payload = _read_cache(
        _profit_loss_cache,
        cache_key,
        PROFIT_LOSS_CACHE_TTL_SEC,
    )

    if cached_payload is not None:

        return {
            **cached_payload,
            "cached": True,
        }

    try:

        df = calculate_net_profit(

            crop_en=req.crop_en,

            quantity_quintal=req.quantity_quintal,

            farmer_lat=req.farmer_lat,

            farmer_lon=req.farmer_lon,

            vehicle_type=req.vehicle_type,

            ownership=req.ownership,

            mileage_kmpl=req.mileage_kmpl,

            fuel_type=req.fuel_type,

            rent_per_km=req.rent_per_km,
        )

        import pandas as _pd


        def _safe_route_path(val):

            if isinstance(
                val,
                list,
            ):

                out = []

                for pt in val:

                    if (
                        isinstance(
                            pt,
                            (list, tuple),
                        )
                        and len(pt) >= 2
                    ):

                        try:

                            out.append(
                                [
                                    round(
                                        float(pt[0]),
                                        ROUTE_COORD_PRECISION,
                                    ),

                                    round(
                                        float(pt[1]),
                                        ROUTE_COORD_PRECISION,
                                    ),
                                ]
                            )

                        except Exception:

                            continue

                if (
                    len(out)
                    > MAX_ROUTE_POINTS
                ):

                    step = max(
                        1,
                        len(out)
                        // (
                            MAX_ROUTE_POINTS - 1
                        ),
                    )

                    reduced = out[::step]

                    if (
                        reduced
                        and reduced[-1]
                        != out[-1]
                    ):

                        reduced.append(
                            out[-1]
                        )

                    out = reduced[
                        :MAX_ROUTE_POINTS
                    ]

                return out

            return []


        def _safe_route_stops(val):

            if isinstance(
                val,
                list,
            ):

                out = []

                for s in val:

                    t = str(
                        s or ""
                    ).strip()

                    if (
                        t
                        and (
                            not out
                            or out[-1].lower()
                            != t.lower()
                        )
                    ):

                        out.append(t)

                return out[
                    :MAX_ROUTE_STOPS
                ]

            return []


        results = []

        for _, row in df.iterrows():

            modal_price = int(
                _pd.to_numeric(
                    row.get(
                        "price_per_quintal_rs",
                        0,
                    ),
                    errors="coerce",
                )
                or 0
            )

            min_price = int(
                round(
                    modal_price * 0.86
                )
            )

            max_price = int(
                round(
                    modal_price * 1.14
                )
            )

            lat_val = _pd.to_numeric(
                row.get(
                    "latitude",
                    0,
                ),
                errors="coerce",
            )

            lon_val = _pd.to_numeric(
                row.get(
                    "longitude",
                    0,
                ),
                errors="coerce",
            )

            duration_val = _pd.to_numeric(
                row.get(
                    "route_duration_min",
                    0,
                ),
                errors="coerce",
            )

            apmc_code = str(
                row.get(
                    "apmc_code",
                    "",
                )
            )

            results.append(
                {
                    "apmc_name": str(
                        row.get(
                            "apmc_name",
                            "",
                        )
                    ),

                    "apmc_name_mr": str(
                        MSAMB_CODE_TO_MR.get(
                            apmc_code,
                            "",
                        )
                        or ""
                    ),

                    "apmc_code": apmc_code,

                    "district": str(
                        row.get(
                            "district",
                            "",
                        )
                    ),

                    "latitude": (
                        0.0
                        if _pd.isna(lat_val)
                        else float(lat_val)
                    ),

                    "longitude": (
                        0.0
                        if _pd.isna(lon_val)
                        else float(lon_val)
                    ),

                    "distance_km": round(
                        float(
                            row.get(
                                "distance_km",
                                0,
                            )
                        ),
                        2,
                    ),

                    "route_duration_min": (
                        0.0
                        if _pd.isna(
                            duration_val
                        )
                        else float(
                            duration_val
                        )
                    ),

                    "route_path": _safe_route_path(
                        row.get(
                            "route_path"
                        )
                    ),

                    "route_stops": _safe_route_stops(
                        row.get(
                            "route_stops"
                        )
                    ),

                    "confidence": str(
                        row.get(
                            "confidence",
                            "",
                        )
                    ),

                    "transport_cost_min_rs": int(
                        row.get(
                            "transport_cost_min_rs",
                            0,
                        )
                    ),

                    "transport_cost_max_rs": int(
                        row.get(
                            "transport_cost_max_rs",
                            0,
                        )
                    ),

                    "transport_cost_avg_rs": int(
                        row.get(
                            "transport_cost_avg_rs",
                            0,
                        )
                    ),

                    "price_per_quintal_rs":
                        modal_price,

                    "modal_price":
                        modal_price,

                    "min_price":
                        min_price,

                    "avg_price":
                        modal_price,

                    "max_price":
                        max_price,

                    "net_profit_min_rs": int(
                        row.get(
                            "net_profit_min_rs",
                            0,
                        )
                    ),

                    "net_profit_avg_rs": int(
                        row.get(
                            "net_profit_avg_rs",
                            0,
                        )
                    ),

                    "net_profit_max_rs": int(
                        row.get(
                            "net_profit_max_rs",
                            0,
                        )
                    ),
                }
            )

        payload = {
            "crop": req.crop_en,
            "quantity": req.quantity_quintal,
            "results": results,
            "source": "msamb.com",
        }

        _write_cache(
            _profit_loss_cache,
            cache_key,
            payload,
        )

        return {
            **payload,
            "cached": False,
        }

    except ValueError as e:

        raise HTTPException(
            400,
            str(e),
        )

    except RuntimeError as e:

        raise _market_http_exception(
            "profit-loss runtime error",
            e,
        )

    except Exception as e:

        raise _market_http_exception(
            "profit-loss error",
            e,
        )


@router.post(
    "/market-trend"
)
async def get_market_trend(
    req: MarketTrendRequest,
):

    if not ENGINE_AVAILABLE:

        raise _engine_unavailable_exception()

    try:

        df = fetch_nearby_market_data(
            req.crop_mr,
            req.farmer_lat,
            req.farmer_lon,
        )

        today = (
            pd.Timestamp.today()
            .normalize()
        )

        seven_ago = (
            today
            - pd.Timedelta(
                days=7
            )
        )

        df7 = df[
            (df["Date"] >= seven_ago)
            & (df["Date"] <= today)
        ]

        if df7.empty:

            return {
                "trend_direction": "STABLE",
                "price_slope": 0.0,
                "arrival_slope": 0.0,
                "volatility": 0.0,
                "confidence": 30,
                "risk_score": 40,
                "recommendation":
                    "HOLD / MONITOR",
                "signal":
                    "UNCERTAIN MARKET",
                "daily_data": [],
            }

        daily = (
            df7.groupby("Date")
            .agg(
                {
                    "Modal Price": "median",
                    "Arrival": "sum",
                }
            )
            .reset_index()
            .sort_values("Date")
        )

        prices = daily[
            "Modal Price"
        ].values.reshape(
            -1,
            1,
        )

        arrivals = daily[
            "Arrival"
        ].values.reshape(
            -1,
            1,
        )

        X = np.arange(
            len(prices)
        ).reshape(
            -1,
            1,
        )

        p_slope = float(
            LinearRegression()
            .fit(
                X,
                prices,
            )
            .coef_[0][0]
        )

        a_slope = float(
            LinearRegression()
            .fit(
                X,
                arrivals,
            )
            .coef_[0][0]
        )

        vol = float(
            np.std(prices)
        )

        mean_p = float(
            np.mean(prices)
        )

        if (
            p_slope > 5
            and a_slope < 0
        ):

            decision = "WAIT"

            signal = (
                "PRICE RISING, "
                "ARRIVAL FALLING"
            )

            direction = "RISING"

        elif (
            p_slope < -5
            and a_slope > 0
        ):

            decision = "SELL NOW"

            signal = (
                "PRICE FALLING, "
                "ARRIVAL RISING"
            )

            direction = "FALLING"

        else:

            decision = "HOLD / MONITOR"

            signal = (
                "UNCERTAIN MARKET"
            )

            direction = "STABLE"

        conf = min(
            int(
                (
                    abs(p_slope)
                    / 20
                )
                * 100
            ),
            95,
        )

        risk = (
            min(
                int(
                    (
                        vol
                        / mean_p
                    )
                    * 100
                ),
                100,
            )
            if mean_p > 0
            else 50
        )

        ddata = [
            {
                "date": str(
                    r["Date"]
                )[:10],

                "price": int(
                    r["Modal Price"]
                ),

                "arrivals": int(
                    r["Arrival"]
                    / 1000
                ),
            }

            for _, r
            in daily.iterrows()
        ]

        return {
            "trend_direction":
                direction,

            "price_slope":
                round(
                    p_slope,
                    2,
                ),

            "arrival_slope":
                round(
                    a_slope,
                    2,
                ),

            "volatility":
                round(
                    vol,
                    2,
                ),

            "confidence":
                conf,

            "risk_score":
                risk,

            "recommendation":
                decision,

            "signal":
                signal,

            "daily_data":
                ddata,
        }

    except Exception as e:

        raise _market_http_exception(
            "market-trend error",
            e,
        )


@router.post(
    "/market-rates"
)
async def get_market_rates(
    req: MarketRatesRequest,
):

    if not ENGINE_AVAILABLE:

        raise _engine_unavailable_exception()

    cache_key = _build_cache_key(

        req.crop_mr.strip().lower(),

        round(
            req.farmer_lat,
            4,
        ),

        round(
            req.farmer_lon,
            4,
        ),

        req.vehicle_type.strip().lower(),

        req.ownership.strip().lower(),

        round(
            req.mileage_kmpl or 0,
            2,
        ),

        (
            req.fuel_type or ""
        ).strip().lower(),

        round(
            req.rent_per_km or 0,
            2,
        ),

        int(
            req.top_n
        ),
    )

    cached_payload = _read_cache(
        _market_rates_cache,
        cache_key,
        MARKET_RATES_CACHE_TTL_SEC,
    )

    if cached_payload is not None:

        return {
            **cached_payload,
            "cached": True,
        }

    try:

        df = fetch_msamb_data(

            crop_mr=req.crop_mr,

            farmer_lat=req.farmer_lat,

            farmer_lon=req.farmer_lon,

            vehicle_type=req.vehicle_type,

            ownership=req.ownership,

            mileage_kmpl=req.mileage_kmpl,

            fuel_type=req.fuel_type,

            rent_per_km=req.rent_per_km,

            top_n=req.top_n,
        )

        import pandas as _pd

        results = [

            {
                "apmc_name": str(
                    r.get(
                        "apmc_name",
                        "",
                    )
                ),

                "apmc_name_mr": str(
                    MSAMB_CODE_TO_MR.get(
                        str(
                            r.get(
                                "apmc_code",
                                "",
                            )
                        ),
                        "",
                    )
                    or ""
                ),

                "apmc_code": str(
                    r.get(
                        "apmc_code",
                        "",
                    )
                ),

                "min_price": int(
                    _pd.to_numeric(
                        r.get(
                            "Min Price",
                            0,
                        ),
                        errors="coerce",
                    )
                    or 0
                ),

                "max_price": int(
                    _pd.to_numeric(
                        r.get(
                            "Max Price",
                            0,
                        ),
                        errors="coerce",
                    )
                    or 0
                ),

                "modal_price": int(
                    _pd.to_numeric(
                        r.get(
                            "Modal Price",
                            0,
                        ),
                        errors="coerce",
                    )
                    or 0
                ),

                "arrival": int(
                    _pd.to_numeric(
                        r.get(
                            "Arrival",
                            0,
                        ),
                        errors="coerce",
                    )
                    or 0
                ),

                "variety": str(
                    r.get(
                        "Variety",
                        "",
                    )
                ),

                "date": str(
                    r.get(
                        "Date",
                        "",
                    )
                )[:10],
            }

            for _, r
            in df.iterrows()
        ]

        payload = {
            "crop": req.crop_mr,
            "results": results,
            "source": "msamb.com",
        }

        _write_cache(
            _market_rates_cache,
            cache_key,
            payload,
        )

        return {
            **payload,
            "cached": False,
        }

    except RuntimeError as e:

        raise _market_http_exception(
            "market-rates runtime error",
            e,
        )

    except Exception as e:

        raise _market_http_exception(
            "market-rates error",
            e,
        )