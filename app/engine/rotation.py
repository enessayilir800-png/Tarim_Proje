"""Crop-rotation recommendation engine with SQLite result caching."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from typing import Any, Literal

from app.db.cache import get_cache, set_cache

CropId = Literal[
    "wheat", "barley", "corn", "sunflower", "chickpea", "lentil",
    "cotton", "tomato", "potato",
]
Priority = Literal["soil", "water", "risk"]

_TRAITS: dict[str, dict[str, Any]] = {
    "wheat": {"family": "cereal", "water_need": 2, "soil_gain": 0, "cover": True},
    "barley": {"family": "cereal", "water_need": 2, "soil_gain": 0, "cover": True},
    "corn": {"family": "cereal", "water_need": 4, "soil_gain": -1, "cover": False},
    "sunflower": {"family": "oilseed", "water_need": 3, "soil_gain": -1, "cover": False},
    "chickpea": {"family": "legume", "water_need": 1, "soil_gain": 3, "cover": True},
    "lentil": {"family": "legume", "water_need": 1, "soil_gain": 3, "cover": True},
    "cotton": {"family": "industrial", "water_need": 5, "soil_gain": -1, "cover": False},
    "tomato": {"family": "vegetable", "water_need": 4, "soil_gain": -1, "cover": False},
    "potato": {"family": "tuber", "water_need": 4, "soil_gain": -1, "cover": False},
}
_NAMES: dict[str, str] = {
    "wheat": "Wheat", "barley": "Barley", "corn": "Corn",
    "sunflower": "Sunflower", "chickpea": "Chickpea", "lentil": "Lentil",
    "cotton": "Cotton", "tomato": "Tomato", "potato": "Potato",
}
_ROTATION_POOL = ("wheat", "chickpea", "barley", "sunflower", "lentil", "corn")
_REASONS = (
    "The crop selected for this season.",
    "Breaks the previous crop family and helps restore the soil.",
    "Different root structures can reduce disease pressure and nutrient imbalance.",
)


class RotationEngine:
    """Calculate three-year crop rotations and cache results in SQLite."""

    def __init__(self, cache_ttl_seconds: int = 21_600) -> None:
        if cache_ttl_seconds <= 0:
            raise ValueError("cache_ttl_seconds must be greater than zero")
        self.cache_ttl_seconds = cache_ttl_seconds

    def calculate(
        self,
        selected_crop: CropId,
        previous_crop: str = "none",
        priority: Priority = "soil",
        irrigation_available: bool = False,
        start_year: int | None = None,
    ) -> dict[str, Any]:
        """Return a cached rotation or calculate and persist a new recommendation."""
        current_year = start_year if start_year is not None else date.today().year
        inputs = {
            "selected_crop": selected_crop,
            "previous_crop": previous_crop,
            "priority": priority,
            "irrigation_available": irrigation_available,
            "start_year": current_year,
        }
        key_json = json.dumps(inputs, sort_keys=True, separators=(",", ":"))
        cache_key = "rotation:" + hashlib.sha256(key_json.encode("utf-8")).hexdigest()
        cached_result = get_cache(cache_key)
        if isinstance(cached_result, dict):
            return {**cached_result, "cached": True}

        result = self._calculate_uncached(
            selected_crop=selected_crop,
            previous_crop=previous_crop,
            priority=priority,
            irrigation_available=irrigation_available,
            start_year=current_year,
        )
        set_cache(cache_key, result, ttl_seconds=self.cache_ttl_seconds)
        return {**result, "cached": False}

    @staticmethod
    def _calculate_uncached(
        selected_crop: CropId,
        previous_crop: str,
        priority: Priority,
        irrigation_available: bool,
        start_year: int,
    ) -> dict[str, Any]:
        """Apply family, soil, water, and risk preference scores."""
        current_traits = _TRAITS[selected_crop]
        previous_family = _TRAITS.get(previous_crop, {}).get("family")
        choices = [crop for crop in _ROTATION_POOL if crop != selected_crop]

        def score(crop_id: str) -> int:
            traits = _TRAITS[crop_id]
            value = int(traits["family"] != current_traits["family"]) * 3
            if previous_family is not None:
                value += int(traits["family"] != previous_family) * 2
            value += int(traits["family"] == "legume") * 3
            if priority == "water":
                value += 5 - int(traits["water_need"])
            elif priority == "soil" and traits["family"] == "legume":
                value += 4
            elif priority == "risk" and traits["cover"]:
                value += 2
            if not irrigation_available:
                value -= int(traits["water_need"])
            return value

        choices.sort(key=score, reverse=True)
        planned_crops = [selected_crop, *choices[:2]]

        return {
            "selected_crop": selected_crop,
            "priority": priority,
            "years": [
                {
                    "year": start_year + index,
                    "crop_id": crop_id,
                    "crop_name": _NAMES[crop_id],
                    "reason": _REASONS[index],
                }
                for index, crop_id in enumerate(planned_crops)
            ],
        }


rotation_engine = RotationEngine()


def calculate_rotation(
    selected_crop: CropId,
    previous_crop: str = "none",
    priority: Priority = "soil",
    irrigation_available: bool = False,
    start_year: int | None = None,
) -> dict[str, Any]:
    """Convenience function used by API routes and other application services."""
    return rotation_engine.calculate(
        selected_crop=selected_crop,
        previous_crop=previous_crop,
        priority=priority,
        irrigation_available=irrigation_available,
        start_year=start_year,
    )
