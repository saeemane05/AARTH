from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

QuantityUnit = Literal["kg", "quintal", "ton"]
RequirementStatus = Literal["DRAFT", "ACTIVE", "PAUSED", "FULFILLED", "CANCELLED"]


class RequirementPayload(BaseModel):
    commodity_key: str | None = Field(default=None, max_length=100)
    commodity_name: str | None = Field(default=None, max_length=120)
    variety: str | None = Field(default=None, max_length=120)
    quantity: float | None = Field(default=None, gt=0, le=10_000_000)
    quantity_unit: QuantityUnit | None = None
    quality_grade: str | None = Field(default=None, max_length=80)
    size_calibre: str | None = Field(default=None, max_length=120)
    quality_requirements: str | None = Field(default=None, max_length=2000)
    delivery_location: str | None = Field(default=None, max_length=300)
    delivery_district: str | None = Field(default=None, max_length=100)
    delivery_taluka: str | None = Field(default=None, max_length=100)
    delivery_city: str | None = Field(default=None, max_length=120)
    delivery_latitude: float | None = Field(default=None, ge=-90, le=90)
    delivery_longitude: float | None = Field(default=None, ge=-180, le=180)
    delivery_start_date: date | None = None
    delivery_end_date: date | None = None
    packaging_requirement: str | None = Field(default="No specific requirement", max_length=80)
    target_price: float | None = Field(default=None, ge=0, le=100_000_000)
    target_price_min: float | None = Field(default=None, ge=0, le=100_000_000)
    target_price_max: float | None = Field(default=None, ge=0, le=100_000_000)
    target_price_unit: Literal["INR_PER_KG", "INR_PER_QUINTAL", "INR_PER_TON"] | None = None
    price_mode: Literal["PREFERRED_RANGE", "MAXIMUM", "MARKET_LINKED"] = "PREFERRED_RANGE"
    open_to_market_pricing: bool = False
    additional_requirements: str | None = Field(default=None, max_length=3000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.delivery_start_date and self.delivery_end_date and self.delivery_start_date > self.delivery_end_date:
            raise ValueError("Delivery from date cannot be after delivery by date.")
        if self.quantity is not None and self.quantity_unit is None:
            raise ValueError("A quantity unit is required with quantity.")
        if self.target_price_min is not None and self.target_price_max is not None and self.target_price_min > self.target_price_max:
            raise ValueError("Minimum buying price cannot be greater than maximum buying price.")
        if self.price_mode == "MARKET_LINKED":
            self.open_to_market_pricing = True
        return self


class RequirementCreateRequest(RequirementPayload):
    status: Literal["DRAFT"] = "DRAFT"


class StatusRequest(BaseModel):
    status: RequirementStatus