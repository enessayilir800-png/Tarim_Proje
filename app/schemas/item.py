from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    error: str
    details: str | None = None


class NdviTaskRequest(BaseModel):
    geometry: dict[str, Any]
    start: str
    end: str
    name: str = Field(default="Parcel", max_length=80)


class NdviTaskResponse(BaseModel):
    task_id: str
    status: str
    source: str
    resolution_m: int
    composite_days: int


class LocationOption(BaseModel):
    id: str
    name: str


class LocationOptionsResponse(BaseModel):
    options: list[LocationOption]


class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    display_name: str


class ParcelResponse(BaseModel):
    type: str
    geometry: dict[str, Any]
    properties: dict[str, Any]


class ItemResponse(BaseModel):
    """Flexible typed envelope for proxy responses consumed by the frontend."""

    model_config = {"extra": "allow"}
    source: str | None = None
    data: Any = None
