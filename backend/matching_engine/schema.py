from __future__ import annotations

from typing import Any, Literal
from pydantic import BaseModel, Field

PriceMode = Literal["PREFERRED_RANGE", "MAXIMUM", "MARKET_LINKED"]


class MarketPriceRequest(BaseModel):
    crop_key: str = Field(min_length=2, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    top_n: int = Field(default=8, ge=3, le=20)


class DiscoveryQuery(BaseModel):
    requirement_id: str | None = None
    commodity_key: str | None = None
    limit: int = Field(default=50, ge=1, le=100)


class MatchExplanation(BaseModel):
    label: str
    value: str
    tone: Literal["positive", "neutral", "warning", "blocked"] = "neutral"


class MatchResult(BaseModel):
    lot_id: str
    requirement_id: str
    match_type: Literal["DIRECT", "AGGREGATION_CANDIDATE"]
    match_status: Literal["FEASIBLE", "NEEDS_AGGREGATION"]
    score: float
    score_percent: int
    hard_constraints: dict[str, Any]
    factors: dict[str, float]
    explanations: list[MatchExplanation]
    seller: dict[str, Any] | None = None
    buyer: dict[str, Any] | None = None
    lot: dict[str, Any] | None = None
    requirement: dict[str, Any] | None = None
