"""Senaryo sıralama testleri.  Çalıştır: python -m pytest ai"""
import pytest

from ai.ranking import metric_weights, rank_scenarios

# Rakamlar örnek amaçlıdır; gerçek değerleri rotasyon motoru ve ziraat tablosu üretecek.
# Sürekli buğdayda verim düşüşü nedeniyle 4 yıllık gelir baklagilli rotasyondan düşüktür.
SCENARIOS = [
    {"id": "monokultur", "crops": ["wheat", "wheat", "wheat", "wheat"],
     "metrics": {"soil_organic_trend": -2, "nitrogen_balance": -6, "water_demand_mm": 1680, "water_deficit_mm": 420,
                 "disease_risk": .8, "drought_risk": .5, "climate_2040_robustness": 40, "income": 7800}},
    {"id": "baklagilli", "crops": ["wheat", "chickpea", "wheat", "lentil"],
     "metrics": {"soil_organic_trend": 3, "nitrogen_balance": 4, "water_demand_mm": 1400, "water_deficit_mm": 300,
                 "disease_risk": .3, "drought_risk": .35, "climate_2040_robustness": 70, "income": 8200}},
    {"id": "sulu_yazlik", "crops": ["wheat", "corn", "sunflower", "wheat"],
     "metrics": {"soil_organic_trend": 0, "nitrogen_balance": -3, "water_demand_mm": 2100, "water_deficit_mm": 900,
                 "disease_risk": .4, "drought_risk": .7, "climate_2040_robustness": 35, "income": 11500}},
]


def test_weights_normalised():
    weights = metric_weights({"soil": 40, "water": 30, "yield": 20, "risk": 10})
    assert sum(weights.values()) == pytest.approx(1)


def test_soil_priority_prefers_legume_rotation():
    ranked = rank_scenarios(SCENARIOS, {"soil": 100})
    assert ranked[0]["id"] == "baklagilli"
    assert ranked[-1]["id"] == "monokultur"


def test_income_priority_prefers_irrigated_summer_crops():
    assert rank_scenarios(SCENARIOS, {"yield": 100})[0]["id"] == "sulu_yazlik"


def test_water_priority_penalises_corn():
    assert rank_scenarios(SCENARIOS, {"water": 100})[-1]["id"] == "sulu_yazlik"


def test_monoculture_is_dominated_not_pareto():
    by_id = {r["id"]: r for r in rank_scenarios(SCENARIOS, {"soil": 25, "water": 25, "yield": 25, "risk": 25})}
    assert by_id["baklagilli"]["pareto_optimal"] and by_id["sulu_yazlik"]["pareto_optimal"]
    assert not by_id["monokultur"]["pareto_optimal"]


def test_confidence_sums_to_100_and_explanation_turkish():
    ranked = rank_scenarios(SCENARIOS, {"soil": 40, "water": 30, "yield": 20, "risk": 10})
    assert sum(r["confidence"] for r in ranked) == pytest.approx(100, abs=0.5)
    assert ranked[0]["explanation"]["text"].startswith("Öne çıkan yönleri")


def test_bad_priority_rejected():
    with pytest.raises(ValueError):
        rank_scenarios(SCENARIOS, {"hiz": 1})
