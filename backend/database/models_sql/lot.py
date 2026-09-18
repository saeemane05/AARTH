"""Shared lot vocabulary and quantity conversion helpers."""

LOT_STATUSES = {
	"DRAFT",
	"ACTIVE",
	"RESERVED",
	"PARTIALLY_SOLD",
	"SOLD",
	"CANCELLED",
}

LOT_QUANTITY_UNITS = {"kg", "quintal", "ton"}
PRICE_UNITS = {"INR_PER_QUINTAL"}
LOCATION_SOURCES = {"CURRENT_DEVICE", "MANUAL_SEARCH", "PROFILE_DEFAULT"}


def quantity_to_kg(quantity: float, unit: str) -> float:
	unit = unit.lower()
	if unit == "kg":
		return quantity
	if unit == "quintal":
		return quantity * 100
	if unit == "ton":
		return quantity * 1000
	raise ValueError("Unsupported quantity unit.")
