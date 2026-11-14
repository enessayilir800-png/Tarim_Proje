# AI — Phase 0 Decision Memo (October 27, 2026)

## Decisions

| # | Component | Decision | Rationale |
|---|---|---|---|
| 1 | **NDVI-based seasonal class and five-year rotation history** | ✅ Proceed (prototype ready) | Runs on real NASA data and infers what was grown in previous years without asking the farmer; identifies monoculture and crop–fallow patterns. |
| 2 | **Scenario ranking (`rank_scenarios`)** | ✅ Proceed (core ready; 14 tests passing) | Directly addresses the challenge goal of exploring strategies based on farmer priorities. |
| 3 | Turkish-language explanation assistant (LLM) | 🟡 Sprint 2, if time permits | Explains reports in plain language; must be constrained so it does not make dosage or pesticide recommendations. |
| 4 | Yield prediction (ML) | ❌ Do not proceed | Field-level labeled yield data is unavailable for Türkiye; an invented model would not be defensible to judges. |
| 5 | Genetic algorithm for optimization | ❌ Not needed | With 12 crops over four years and rule-based pruning, only a few thousand scenarios remain; all can be scored in seconds. |

## 1. Initial results: NDVI seasonal classification

**Data:** NASA MODIS MOD13Q1 (250 m, 16-day), provided by ORNL DAAC; no token required. Five areas in Malatya × 289 pixels × 2021–2025 = **7,225 pixel-years**.

**Method:** Cloud/snow masking → temporal gap filling → Savitzky–Golay smoothing → phenology features (peak month, amplitude, duration of greenness, spring/summer mean, number of peaks) → rule-based classification.

At 250 m resolution, individual crops such as wheat and chickpea cannot be distinguished reliably. The classifier identifies the **growing season**, which is useful for rotation analysis.

| Area | Dominant class | Consistent with expectations? |
|---|---|---|
| Doğanşehir | 39% orchard | ✅ Apricot-growing area |
| Akçadağ | 45% early-season (cereals) | ✅ |
| Yazıhan | 27% early-season + 21% summer-season | ✅ Irrigated fields |
| Darende Plateau | 50% fallow/bare; **crop–fallow** cycle in 16% of pixels | ✅ Dryland wheat–fallow system |
| Battalgazi Plain | 33% early-season, 21% double-cropped, 26% uncertain | ⚠️ Fewer apricot orchards classified as orchards than expected; requires validation |

Figures: `ai/figures/sinif_profilleri.png`, `ai/figures/harita_*.png`, `ai/figures/kmeans_kumeler.png`.

**Known limitations:**

- 13–26% of pixel-years are classified as uncertain. Many are mixed pixels that peak in April–May but remain green into summer (a field and orchard may occupy the same 250 m pixel).
- The 13% double-cropping rate appears high for Malatya and may reflect mixed orchard/field pixels.
- Agreement with rule-independent KMeans clustering is moderate (ARI = 0.21): fallow and orchard clusters are distinct, while intermediate classes overlap.
- **Accuracy has not yet been measured.** The validation step below is intended to address this.

## 2. Scenario ranking

`ai/ranking.py` → `rank_scenarios(scenarios, priorities)`

- Four priority sliders (soil / water / income / risk) determine the weights of eight metrics.
- Output: score from 0 to 100, rank, **Pareto-optimal status**, **confidence** (how often the scenario remains first when weights vary by ±20%), and a plain-language explanation.
- Example: soil 40% / water 30% / income 20% / risk 10% → wheat–chickpea–wheat–lentil scores **82/100 with 99.7% confidence**; monoculture scores 23/100 and is not Pareto-optimal.

## Team inputs needed

| Owner | Input | Due |
|---|---|---|
| **Agronomy** | Label 70 points in `data/malatya/ndvi/dogrulama_ornekleri.csv` using Google satellite imagery or field knowledge (blind review: model predictions are hidden). The measured accuracy can then be included in the presentation. | November 2 |
| **Agronomy** | Provide crop-table metric values for water, nitrogen, organic-matter contribution, disease group, and income. | Start of Sprint 1 |
| **Software 1 (Enes)** | Ensure the rotation engine produces the `METRICS` keys in `ai/ranking.py` for every scenario (API contract). | October 29 workshop |
| **Computer Engineering (Arhat)** | In Sprint 2, access 30 m HLS NDVI and apply the same classifier at parcel scale. | November 5 |

## Next AI steps

1. Once validation labels arrive, calculate accuracy and a confusion matrix, then tune thresholds.
2. Connect the classifier to the API: parcel geometry → five-year season sequence → automatically populate the form's “previous year” field.
3. Connect `rank_scenarios` to rotation-engine output (`/api/v1/scenarios`).
4. If time permits, train a small supervised model (Random Forest) for uncertain pixels using labeled examples and add an LLM-based explanation assistant.

## Run

```bash
pip install numpy scipy pandas scikit-learn matplotlib pytest
python -m ai.ndvi_fetch        # ~25 minutes on first run; cached thereafter
python -m ai.run_prototype
python -m pytest ai
```
