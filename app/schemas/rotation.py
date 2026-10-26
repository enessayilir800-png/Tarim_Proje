"""Request and response models for crop-rotation recommendations."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CropId = Literal[
    "wheat", "barley", "corn", "sunflower", "chickpea", "lentil",
    "cotton", "tomato", "potato",
]
Priority = Literal["soil", "water", "risk"]
PreviousCrop = Literal[
    "none", "wheat", "barley", "corn", "sunflower", "chickpea", "lentil",
    "cotton", "tomato", "potato",
]


class RotationRequest(BaseModel):
    """Inputs used to build a three-season crop rotation."""

    model_config = ConfigDict(extra="forbid")

    selected_crop: CropId
    previous_crop: PreviousCrop = "none"
    priority: Priority = "soil"
    irrigation_available: bool = False


class RotationYear(BaseModel):
    """One crop recommendation in the rotation schedule."""

    year: int = Field(ge=2000, le=2200)
    crop_id: CropId
    crop_name: str
    reason: str


class RotationResponse(BaseModel):
    """Three-year rotation and cache metadata."""

    selected_crop: CropId
    priority: Priority
    years: list[RotationYear] = Field(min_length=3, max_length=3)
    cached: bool
