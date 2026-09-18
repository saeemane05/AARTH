from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


QuantityUnit = Literal["kg", "quintal", "ton"]
LocationSource = Literal["CURRENT_DEVICE", "MANUAL_SEARCH", "PROFILE_DEFAULT"]


class LotCreateRequest(BaseModel):
	commodity_key: str = Field(min_length=2, max_length=100)
	commodity_name: str = Field(min_length=1, max_length=120)
	variety: str | None = Field(default=None, max_length=120)
	produce_form: str = Field(default="Fresh", min_length=1, max_length=60)
	quantity: float = Field(gt=0, le=10_000_000)
	quantity_unit: QuantityUnit
	partial_sale_allowed: bool = False
	minimum_sale_quantity: float | None = Field(default=None, gt=0)
	harvest_date: date
	grade: str | None = Field(default=None, max_length=80)
	size_calibre: str | None = Field(default=None, max_length=120)
	quality_measurements: dict[str, Any] = Field(default_factory=dict)
	pickup_district: str = Field(min_length=2, max_length=100)
	pickup_taluka: str | None = Field(default=None, max_length=100)
	pickup_village: str = Field(min_length=1, max_length=120)
	pickup_location_text: str = Field(min_length=2, max_length=300)
	pickup_latitude: float | None = Field(default=None, ge=-90, le=90)
	pickup_longitude: float | None = Field(default=None, ge=-180, le=180)
	location_source: LocationSource = "MANUAL_SEARCH"
	location_verified: bool = False
	location_verified_at: str | None = None
	location_accuracy_m: float | None = Field(default=None, ge=0)
	available_from: date
	pickup_until: date
	expected_price: float = Field(ge=0, le=100_000_000)
	expected_price_unit: Literal["INR_PER_QUINTAL"] = "INR_PER_QUINTAL"
	price_negotiable: bool = True
	payment_needed_by: date
	open_to_aggregation: bool = False
	evidence: list[dict[str, Any]] = Field(default_factory=list)
	status: Literal["DRAFT", "ACTIVE"] = "DRAFT"

	@model_validator(mode="after")
	def validate_business_rules(self):
		if self.pickup_until < self.available_from:
			raise ValueError("Latest pickup date cannot be before availability date.")
		if self.harvest_date > self.available_from:
			raise ValueError("Harvest date cannot be after the lot becomes available.")
		if self.partial_sale_allowed and self.minimum_sale_quantity is None:
			raise ValueError("Minimum sale quantity is required when partial sale is allowed.")
		if self.minimum_sale_quantity and self.minimum_sale_quantity > self.quantity:
			raise ValueError("Minimum sale quantity cannot exceed available quantity.")
		if not self.partial_sale_allowed and self.minimum_sale_quantity is not None:
			raise ValueError("Minimum sale quantity is only used when partial sale is allowed.")
		if self.pickup_latitude is None or self.pickup_longitude is None or not self.location_verified:
			raise ValueError("A verified pickup location is required before creating a lot.")
		return self


class LotUpdateRequest(LotCreateRequest):
	pass
