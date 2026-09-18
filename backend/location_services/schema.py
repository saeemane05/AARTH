from pydantic import BaseModel, Field


class LocationSuggestion(BaseModel):
	display_name: str
	latitude: float
	longitude: float
	district: str | None = None
	taluka: str | None = None
	village: str | None = None
	state: str | None = None
	country: str | None = None
	source: str = "OpenStreetMap Nominatim"


class LocationSearchResponse(BaseModel):
	suggestions: list[LocationSuggestion]


class LocationVerifyRequest(BaseModel):
	latitude: float = Field(ge=-90, le=90)
	longitude: float = Field(ge=-180, le=180)
