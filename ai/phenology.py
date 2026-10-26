"""NDVI zaman serisinden fenoloji özellikleri ve ürün grubu sınıflandırması.

250 m MODIS ile buğday/nohut gibi tek tek ürünler ayrılamaz; ayrılabilen şey
ürünün *sezonudur*. Bu yüzden sınıflar rotasyon kararı için anlamlı gruplardır:

    erken_sezon   Kışlık / erken ilkbahar ürünleri (buğday, arpa, mercimek, nohut) — tepe Mart-Haziran
    yaz_sezonu    Yazlık ürünler (mısır, ayçiçeği, şeker pancarı, sebze) — tepe Haziran-Ekim
    cift_urun     Aynı yıl iki ayrı yeşillenme (ör. buğday sonrası ikinci ürün)
    bahce         Uzun ve geniş yeşil dönem (kayısı vb. bahçe, yonca)
    sabit_yesil   Yıl boyu az değişen örtü (orman, mera, sulak alan kenarı)
    nadas_ciplak  Yeşillenme yok (nadas, çıplak toprak, yerleşim)
    belirsiz      Kurallara uymayan
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.signal import find_peaks, savgol_filter

CLASSES = ("erken_sezon", "yaz_sezonu", "cift_urun", "bahce", "sabit_yesil", "nadas_ciplak", "belirsiz")
CLASS_LABELS = {
    "erken_sezon": "Erken sezon (tahıl / baklagil)",
    "yaz_sezonu": "Yaz sezonu (mısır, ayçiçeği, pancar, sebze)",
    "cift_urun": "Çift ürün",
    "bahce": "Bahçe / çok yıllık (kayısı, yonca)",
    "sabit_yesil": "Sabit yeşil örtü (orman, mera)",
    "nadas_ciplak": "Nadas / çıplak",
    "belirsiz": "Belirsiz",
}
ANNUAL_CROP_CLASSES = ("erken_sezon", "yaz_sezonu", "cift_urun")
COMPOSITE_DAYS = 16


def clean_series(dates: np.ndarray, ndvi: np.ndarray, reliability: np.ndarray) -> np.ndarray:
    """Kar/bulut piksellerini at, zamanda doğrusal doldur, Savitzky-Golay ile yumuşat.

    ndvi ve reliability (T, P) boyutludur. MOD13Q1 güvenilirlik: 0 iyi, 1 vasat, 2 kar, 3 bulut.
    """
    days = np.array([np.datetime64(d, "D").astype("int64") for d in dates], dtype="float64")
    series = np.where(np.isin(reliability, (0, 1)), ndvi, np.nan).astype("float64")
    cleaned = np.empty_like(series)
    for p in range(series.shape[1]):
        column = series[:, p]
        good = np.isfinite(column)
        if good.sum() < 4:
            cleaned[:, p] = np.nan
            continue
        cleaned[:, p] = np.interp(days, days[good], column[good])
    smoothed = savgol_filter(cleaned, window_length=5, polyorder=2, axis=0, mode="interp")
    return np.clip(smoothed, -0.2, 1.0)


@dataclass
class YearFeatures:
    peak: float
    peak_month: int
    base: float
    amplitude: float
    spring: float      # Mart-Mayıs ortalaması
    summer: float      # Temmuz-Eylül ortalaması
    winter: float      # Ocak, Şubat, Aralık ortalaması
    season_days: int   # yarı-genliğin üstünde kalınan gün sayısı
    early_peak: bool   # Mart-Haziran arasında belirgin tepe
    late_peak: bool    # Haziran sonrası belirgin tepe
    monthly: np.ndarray  # 12 aylık ortalama profil


def year_features(months: np.ndarray, values: np.ndarray) -> YearFeatures:
    """Tek pikselin tek yıllık (~23 kompozit) serisinden özellik çıkar."""
    monthly = np.array([values[months == m].mean() if np.any(months == m) else np.nan for m in range(1, 13)])
    peak_index = int(np.argmax(values))
    peak, base = float(values[peak_index]), float(np.percentile(values, 10))
    amplitude = peak - base
    above = values > base + 0.5 * amplitude
    peaks, _ = find_peaks(np.concatenate(([values[0]], values, [values[-1]])), prominence=max(0.06, 0.25 * amplitude))
    peak_months = months[np.clip(peaks - 1, 0, len(months) - 1)]
    return YearFeatures(
        peak=peak,
        peak_month=int(months[peak_index]),
        base=base,
        amplitude=amplitude,
        spring=float(np.nanmean(monthly[2:5])),
        summer=float(np.nanmean(monthly[6:9])),
        winter=float(np.nanmean(monthly[[0, 1, 11]])),
        season_days=int(above.sum() * COMPOSITE_DAYS),
        early_peak=bool(np.any((peak_months >= 3) & (peak_months <= 6))),
        late_peak=bool(np.any(peak_months >= 7)),
        monthly=monthly,
    )


def classify_year(f: YearFeatures) -> str:
    """Kural tabanlı sezon sınıflandırması. Eşikler Malatya yarı-kurak koşulları için başlangıç değerleridir."""
    if f.peak < 0.25 or f.amplitude < 0.06:
        return "nadas_ciplak" if f.peak < 0.35 else "sabit_yesil"
    if f.amplitude < 0.12:
        return "sabit_yesil"
    if f.early_peak and f.late_peak and min(f.spring, f.summer) > f.base + 0.1:
        return "cift_urun"
    if f.season_days >= 150 and 5 <= f.peak_month <= 9 and f.spring > f.base + 0.08 and f.summer > f.base + 0.1:
        return "bahce"
    if 3 <= f.peak_month <= 6 and f.summer < f.spring - 0.05:
        return "erken_sezon"
    if f.peak_month >= 6 and f.summer > f.spring:
        return "yaz_sezonu"
    return "belirsiz"


def rotation_history(classes_by_year: list[str]) -> dict[str, object]:
    """Bir pikselin yıllık sınıf dizisinden rotasyon göstergeleri üret."""
    annual = [c for c in classes_by_year if c in ANNUAL_CROP_CLASSES]
    fallow_years = classes_by_year.count("nadas_ciplak")
    longest_run, run, previous = 0, 0, None
    for c in classes_by_year:
        run = run + 1 if c == previous and c in ANNUAL_CROP_CLASSES else (1 if c in ANNUAL_CROP_CLASSES else 0)
        longest_run, previous = max(longest_run, run), c
    if not annual:
        pattern = "tarla_degil" if fallow_years < len(classes_by_year) else "surekli_nadas"
    elif longest_run >= 4:
        pattern = "monokultur"
    elif len(set(annual)) >= 2:
        pattern = "rotasyon_var"
    elif fallow_years >= 1:
        pattern = "urun_nadas"
    else:
        pattern = "tek_sezon_tekrar"
    return {"longest_same_season_run": longest_run, "fallow_years": fallow_years,
            "distinct_seasons": len(set(annual)), "pattern": pattern}
