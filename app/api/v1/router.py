"""Versioned API routes for features introduced after the initial API migration."""

from fastapi import APIRouter

from app.engine.rotation import calculate_rotation
from app.schemas.rotation import RotationRequest, RotationResponse

router = APIRouter(prefix="/api/v1", tags=["v1"])


@router.post("/rotation/calculate", response_model=RotationResponse)
def calculate_rotation_endpoint(payload: RotationRequest) -> dict[str, object]:
    """Calculate a three-season crop rotation, using SQLite when cached."""
    return calculate_rotation(
        selected_crop=payload.selected_crop,
        previous_crop=payload.previous_crop,
        priority=payload.priority,
        irrigation_available=payload.irrigation_available,
    )
