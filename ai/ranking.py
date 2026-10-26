"""Rotasyon senaryolarını çiftçi önceliklerine göre çok amaçlı sıralama.

Rotasyon motoru (app/engine) her senaryo için metrikleri hesaplar; bu modül
o metrikleri çiftçinin ağırlıklarıyla birleştirir ve şunları döndürür:

* 0-100 arası toplam skor ve sıra
* Pareto-optimal mi? (başka bir senaryo onu her metrikte geçemiyor mu)
* Güven: ağırlıklar biraz değişse de bu senaryo birinci kalıyor mu (%)
* Türkçe "neden?" açıklaması (en güçlü ve en zayıf yönler)

Arama uzayı küçük (ör. 12 ürün, 4 yıl, kurallarla budanınca birkaç bin senaryo),
bu yüzden genetik algoritma gibi sezgisel arama yerine hepsi puanlanabilir.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence

import numpy as np


@dataclass(frozen=True)
class Metric:
    label: str           # arayüzde görünen ad
    higher_is_better: bool
    unit: str = ""


# Rotasyon motorunun senaryo başına üreteceği metrikler (API sözleşmesi).
METRICS: dict[str, Metric] = {
    "soil_organic_trend": Metric("Toprak organik maddesi", True, "puan"),
    "nitrogen_balance": Metric("Azot dengesi", True, "kg N/da"),
    "water_demand_mm": Metric("Su ihtiyacı", False, "mm"),
    "water_deficit_mm": Metric("Yağışla karşılanmayan su", False, "mm"),
    "disease_risk": Metric("Hastalık / zararlı riski", False),
    "drought_risk": Metric("Kuraklık riski", False),
    "climate_2040_robustness": Metric("2040 iklimine dayanıklılık", True, "%"),
    "income": Metric("Tahmini gelir", True, "TL/da"),
}

# Arayüzdeki 4 öncelik kaydırıcısı -> metrik ağırlıkları.
PRIORITY_METRICS: dict[str, dict[str, float]] = {
    "soil": {"soil_organic_trend": 0.5, "nitrogen_balance": 0.3, "disease_risk": 0.2},
    "water": {"water_demand_mm": 0.4, "water_deficit_mm": 0.4, "drought_risk": 0.2},
    "yield": {"income": 1.0},
    "risk": {"drought_risk": 0.35, "disease_risk": 0.25, "climate_2040_robustness": 0.4},
}


def metric_weights(priorities: Mapping[str, float]) -> dict[str, float]:
    """Öncelik ağırlıklarını (ör. {"soil": 40, "water": 30, ...}) metrik ağırlıklarına çevir, toplamı 1."""
    unknown = set(priorities) - set(PRIORITY_METRICS)
    if unknown:
        raise ValueError(f"Bilinmeyen öncelik: {sorted(unknown)}")
    if any(v < 0 for v in priorities.values()):
        raise ValueError("Öncelik ağırlıkları negatif olamaz")
    weights: dict[str, float] = {}
    for priority, value in priorities.items():
        for metric, share in PRIORITY_METRICS[priority].items():
            weights[metric] = weights.get(metric, 0.0) + value * share
    total = sum(weights.values())
    if total <= 0:
        raise ValueError("En az bir önceliğin ağırlığı sıfırdan büyük olmalı")
    return {metric: value / total for metric, value in weights.items()}


def _utilities(scenarios: Sequence[Mapping], metrics: Sequence[str]) -> np.ndarray:
    """Her metriği senaryolar arasında 0 (en kötü) - 1 (en iyi) aralığına ölçekle."""
    raw = np.array([[float(s["metrics"][m]) for m in metrics] for s in scenarios], dtype="float64")
    low, high = raw.min(axis=0), raw.max(axis=0)
    span = np.where(high > low, high - low, 1.0)
    scaled = np.where(high > low, (raw - low) / span, 0.5)
    for j, metric in enumerate(metrics):
        if not METRICS[metric].higher_is_better:
            scaled[:, j] = 1.0 - scaled[:, j]
    return scaled


def _pareto_mask(utilities: np.ndarray) -> np.ndarray:
    n = len(utilities)
    optimal = np.ones(n, dtype=bool)
    for i in range(n):
        dominated = np.all(utilities >= utilities[i], axis=1) & np.any(utilities > utilities[i], axis=1)
        optimal[i] = not dominated.any()
    return optimal


def _confidence(utilities: np.ndarray, weights: np.ndarray, samples: int, seed: int) -> np.ndarray:
    """Ağırlıkları Dirichlet ile ±%20 civarı oynat; her senaryonun kaç kez birinci olduğunu say."""
    rng = np.random.default_rng(seed)
    concentration = np.maximum(weights * 25.0, 0.05)
    perturbed = rng.dirichlet(concentration, size=samples)
    winners = np.argmax(perturbed @ utilities.T, axis=1)
    return np.bincount(winners, minlength=len(utilities)) / samples


def _explain(utilities: np.ndarray, i: int, metrics: Sequence[str], weights: np.ndarray, scenarios: Sequence[Mapping]) -> dict:
    relevant = [j for j in range(len(metrics)) if weights[j] > 0.02]
    strengths = sorted(relevant, key=lambda j: weights[j] * utilities[i, j], reverse=True)[:2]
    # En çok puan kaybettiren metrik: ağırlığı yüksek ama senaryonun kötü olduğu yer.
    weakest = max(relevant, key=lambda j: weights[j] * (1 - utilities[i, j]))

    def describe(j: int) -> str:
        metric = METRICS[metrics[j]]
        value = float(scenarios[i]["metrics"][metrics[j]])
        shown = f"%{value * 100:.0f}" if not metric.unit else f"{value:g} {metric.unit}"
        return f"{metric.label} ({shown})"
    strengths_text = [describe(j) for j in strengths if utilities[i, j] >= 0.5]
    weakness_text = describe(weakest) if utilities[i, weakest] < 0.5 else None
    sentence = ""
    if strengths_text:
        sentence = "Öne çıkan yönleri: " + " ve ".join(strengths_text) + "."
    if weakness_text:
        sentence += f" Zayıf kaldığı nokta: {weakness_text}."
    return {"strengths": strengths_text, "weakness": weakness_text, "text": sentence.strip()}


def rank_scenarios(scenarios: Sequence[Mapping], priorities: Mapping[str, float],
                   confidence_samples: int = 2000, seed: int = 0) -> list[dict]:
    """Senaryoları sırala.

    scenarios: [{"id": "A", "crops": ["wheat", "chickpea", ...], "metrics": {metrik: değer, ...}}, ...]
    priorities: {"soil": 40, "water": 30, "yield": 20, "risk": 10}  (ölçek önemsiz, oranlanır)
    """
    if not scenarios:
        return []
    weights_by_metric = metric_weights(priorities)
    metrics = [m for m in METRICS if m in weights_by_metric and all(m in s["metrics"] for s in scenarios)]
    missing = set(weights_by_metric) - set(metrics)
    if not metrics:
        raise ValueError("Seçilen öncelikler için senaryolarda hiç metrik yok")
    weights = np.array([weights_by_metric[m] for m in metrics])
    weights /= weights.sum()

    utilities = _utilities(scenarios, metrics)
    scores = utilities @ weights
    pareto = _pareto_mask(utilities)
    confidence = _confidence(utilities, weights, confidence_samples, seed) if len(scenarios) > 1 else np.ones(1)

    order = np.argsort(-scores, kind="stable")
    ranked = []
    for rank, i in enumerate(order, start=1):
        ranked.append({
            "id": scenarios[i].get("id", str(i)),
            "crops": list(scenarios[i].get("crops", [])),
            "rank": rank,
            "score": round(float(scores[i]) * 100, 1),
            "pareto_optimal": bool(pareto[i]),
            "confidence": round(float(confidence[i]) * 100, 1),
            "contributions": {m: round(float(weights[j] * utilities[i, j]) * 100, 1) for j, m in enumerate(metrics)},
            "explanation": _explain(utilities, i, metrics, weights, scenarios),
            "ignored_metrics": sorted(missing),
        })
    return ranked
