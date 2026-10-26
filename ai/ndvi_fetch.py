"""Malatya örnek alanları için MODIS MOD13Q1 NDVI zaman serisi indirici.

Kaynak: ORNL DAAC MODIS Web Service (NASA). Anahtar/token gerektirmez.
Her istek en fazla 10 tarih döndürdüğü için tarihler parçalara bölünür.
Yanıtlar data/ndvi_cache/ altında saklanır; tekrar çalıştırmak NASA'ya yük bindirmez.

Kullanım:  python -m ai.ndvi_fetch            (tüm alanlar, 2021-2025)
"""
from __future__ import annotations

import json
import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CACHE_DIR = ROOT / "data" / "ndvi_cache"
OUT_DIR = ROOT / "data" / "malatya" / "ndvi"
API = "https://modis.ornl.gov/rst/api/v1/MOD13Q1"
BANDS = ("250m_16_days_NDVI", "250m_16_days_pixel_reliability")
EARTH_RADIUS = 6371007.181  # MODIS sinüzoidal projeksiyon küresi

# Yaklaşık merkez koordinatlar; her alan merkez etrafında (2*KM) x (2*KM) km kare.
SITES: dict[str, dict[str, float | str]] = {
    "battalgazi_ova": {"lat": 38.42, "lon": 38.37, "not": "Malatya ovası, sulu tarım + kayısı bahçeleri"},
    "akcadag": {"lat": 38.34, "lon": 37.97, "not": "Akçadağ, karışık tahıl / bahçe"},
    "darende_plato": {"lat": 38.56, "lon": 37.50, "not": "Darende platosu, kuru tarım tahıl"},
    "dogansehir": {"lat": 38.09, "lon": 37.88, "not": "Doğanşehir, bahçe + tarla"},
    "yazihan": {"lat": 38.60, "lon": 38.18, "not": "Yazıhan, sulu tarla bitkileri"},
}


def _get_json(url: str, retries: int = 4) -> dict:
    for attempt in range(retries):
        try:
            request = Request(url, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0 (NASA Space Apps)"})
            with urlopen(request, timeout=90) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("unreachable")


def _cached(name: str, url: str) -> dict:
    path = CACHE_DIR / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    data = _get_json(url)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")
    time.sleep(0.5)  # servise nazik ol
    return data


def modis_dates(lat: float, lon: float, start_year: int, end_year: int) -> list[str]:
    data = _cached(f"dates_{lat}_{lon}", f"{API}/dates?" + urlencode({"latitude": lat, "longitude": lon}))
    return [d["modis_date"] for d in data["dates"] if start_year <= int(d["modis_date"][1:5]) <= end_year]


def _pixel_coords(meta: dict) -> tuple[np.ndarray, np.ndarray]:
    """Sinüzoidal ızgara merkezlerini enlem/boylama çevir (satırlar kuzeyden güneye)."""
    nrows, ncols, cell = int(meta["nrows"]), int(meta["ncols"]), float(meta["cellsize"])
    x0, y0 = float(meta["xllcorner"]), float(meta["yllcorner"])
    rows, cols = np.mgrid[0:nrows, 0:ncols]
    x = x0 + (cols + 0.5) * cell
    y = y0 + (nrows - rows - 0.5) * cell
    lat = np.degrees(y / EARTH_RADIUS)
    lon = np.degrees(x / (EARTH_RADIUS * np.cos(np.radians(lat))))
    return lat.ravel(), lon.ravel()


def fetch_site(site: str, start_year: int = 2021, end_year: int = 2025, km: int = 2) -> Path:
    """Bir alanın NDVI + piksel güvenilirlik küplerini indirip .npz olarak kaydet."""
    info = SITES[site]
    lat, lon = float(info["lat"]), float(info["lon"])
    dates = modis_dates(lat, lon, start_year, end_year)
    chunks = [dates[i:i + 10] for i in range(0, len(dates), 10)]
    cubes: dict[str, list[list[int]]] = {band: [] for band in BANDS}
    calendar: list[str] = []
    meta: dict = {}
    for band in BANDS:
        for chunk in chunks:
            params = {"latitude": lat, "longitude": lon, "band": band, "startDate": chunk[0], "endDate": chunk[-1],
                      "kmAboveBelow": km, "kmLeftRight": km}
            data = _cached(f"{site}_{band}_{chunk[0]}_{chunk[-1]}_{km}", f"{API}/subset?" + urlencode(params))
            if band == BANDS[0]:
                meta = data  # ölçek katsayısı ve ızgara bilgisi NDVI yanıtından alınır
            for item in data["subset"]:
                cubes[band].append(item["data"])
                if band == BANDS[0]:
                    calendar.append(item["calendar_date"])
    ndvi = np.array(cubes[BANDS[0]], dtype="float32")
    reliability = np.array(cubes[BANDS[1]], dtype="int16")
    if ndvi.shape != reliability.shape:
        raise RuntimeError(f"{site}: NDVI {ndvi.shape} ve güvenilirlik {reliability.shape} boyutları uyuşmuyor")
    ndvi[ndvi <= -3000] = np.nan
    ndvi *= float(meta["scale"])
    pixel_lat, pixel_lon = _pixel_coords(meta)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{site}.npz"
    np.savez_compressed(out, dates=np.array(calendar), ndvi=ndvi, reliability=reliability,
                        lat=pixel_lat, lon=pixel_lon, nrows=int(meta["nrows"]), ncols=int(meta["ncols"]))
    return out


def main() -> None:
    # Her istek ~1 dk sürüyor; alanları paralel indir (alan başına tek bağlantı).
    started = time.time()
    with ThreadPoolExecutor(max_workers=len(SITES)) as pool:
        futures = {pool.submit(fetch_site, site): site for site in SITES}
        for future in as_completed(futures):
            site, path = futures[future], future.result()
            with np.load(path) as data:
                print(f"{site:16s} {data['ndvi'].shape[0]} tarih x {data['ndvi'].shape[1]} piksel  ({time.time() - started:.0f} sn) -> {path.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
