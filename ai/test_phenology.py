"""Sentetik NDVI eğrileriyle fenoloji kurallarının akıl sağlığı testleri.  Çalıştır: python -m pytest ai"""
import numpy as np
import pytest

from ai.phenology import classify_year, rotation_history, year_features

# MOD13Q1 yılda 23 kompozit: 1., 17., 33. ... gün
DOY = np.arange(1, 366, 16)
MONTHS = np.array([min(12, 1 + int((d - 1) / 30.5)) for d in DOY])


def bump(center_doy: float, width: float, height: float) -> np.ndarray:
    return height * np.exp(-0.5 * ((DOY - center_doy) / width) ** 2)


CURVES = {
    # Kışlık buğday: sonbaharda hafif çıkış, Mayıs tepe, Temmuz hasat
    "erken_sezon": 0.15 + bump(130, 30, 0.45),
    # Mısır / ayçiçeği: Mayıs ekim, Ağustos tepe
    "yaz_sezonu": 0.14 + bump(220, 28, 0.55),
    # Buğday sonrası ikinci ürün
    "cift_urun": 0.14 + bump(120, 22, 0.40) + bump(245, 22, 0.40),
    # Kayısı bahçesi: Nisan yapraklanma, Ekim'e kadar yeşil
    "bahce": 0.20 + 0.35 / (1 + np.exp(-(DOY - 105) / 8)) * (1 - 1 / (1 + np.exp(-(DOY - 295) / 10))),
    # Nadas: hep çıplak
    "nadas_ciplak": 0.13 + 0.02 * np.sin(DOY / 58),
    # Orman: yıl boyu yüksek, az değişken
    "sabit_yesil": 0.55 + 0.03 * np.sin(DOY / 58),
}


@pytest.mark.parametrize("expected", list(CURVES))
def test_synthetic_curve_class(expected):
    assert classify_year(year_features(MONTHS, CURVES[expected])) == expected


def test_rotation_patterns():
    assert rotation_history(["erken_sezon"] * 5)["pattern"] == "monokultur"
    assert rotation_history(["erken_sezon", "nadas_ciplak"] * 2 + ["erken_sezon"])["pattern"] == "urun_nadas"
    assert rotation_history(["erken_sezon", "yaz_sezonu", "erken_sezon", "yaz_sezonu", "erken_sezon"])["pattern"] == "rotasyon_var"
    assert rotation_history(["bahce"] * 5)["pattern"] == "tarla_degil"
