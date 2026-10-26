"""HTTP endpoints and external data proxies used by the TarımYol frontend."""
from __future__ import annotations

import json
import math
import re
from datetime import date, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_settings
from app.schemas.item import (
    GeocodeResponse, ItemResponse, LocationOptionsResponse, NdviTaskRequest,
    NdviTaskResponse, ParcelResponse,
)

api_router = APIRouter()
_location_cache: dict[str, list[dict[str, str]]] = {}
_ndvi_geometries: dict[str, dict[str, Any]] = {}
_ndvi_results: dict[str, dict[str, Any]] = {}
_UA = "TarimYol/1.0"


def _json_request(url: str, *, headers: dict[str, str] | None = None,
                  payload: dict[str, Any] | None = None, timeout: int = 30) -> Any:
    request_headers = {"Accept": "application/json", "User-Agent": _UA, **(headers or {})}
    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    request = Request(url, data=body, headers=request_headers, method="POST" if body else "GET")
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read()
        return json.loads(raw.decode("utf-8")) if raw else {}
    except HTTPError as exc:
        detail = exc.read(1000).decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Upstream returned HTTP {exc.code}: {detail[:400]}") from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(exc)[:300]}") from exc


def _appeears(path: str, token: str, payload: dict[str, Any] | None = None) -> Any:
    base = get_settings().appeears_api_url.rstrip("/") + "/"
    clean_token = token.removeprefix("Bearer ").strip()
    return _json_request(base + path.lstrip("/"), headers={"Authorization": f"Bearer {clean_token}"}, payload=payload, timeout=45)


def _valid_coordinates(latitude: float, longitude: float) -> None:
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Enter valid latitude and longitude.")


@api_router.get("/api/ndvi/health", response_model=ItemResponse)
def ndvi_health() -> dict[str, Any]:
    token = get_settings().appeears_bearer_token.strip()
    if not token:
        raise HTTPException(status_code=503, detail="APPEEARS_BEARER_TOKEN is missing in .env.")
    _appeears("product/MOD13Q1.061", token)
    return {"connected": True, "product": "MOD13Q1.061"}


@api_router.post("/api/ndvi/task", status_code=202, response_model=NdviTaskResponse)
def create_ndvi_task(data: NdviTaskRequest) -> dict[str, Any]:
    token = get_settings().appeears_bearer_token.strip()
    if not token:
        raise HTTPException(status_code=503, detail="APPEEARS_BEARER_TOKEN is missing in .env.")
    geometry = data.geometry
    if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
        raise HTTPException(status_code=400, detail="A Polygon or MultiPolygon geometry is required.")
    coordinates = geometry.get("coordinates", [])
    rings = coordinates if geometry["type"] == "Polygon" else [ring for polygon in coordinates for ring in polygon]
    if not rings or any(len(ring) < 4 or any(len(point) != 2 for point in ring) for ring in rings):
        raise HTTPException(status_code=400, detail="Polygon rings need three points and a closing point.")
    try:
        start, end = date.fromisoformat(data.start), date.fromisoformat(data.end)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format.") from exc
    if start > end or (end - start).days > 366:
        raise HTTPException(status_code=400, detail="Choose a valid date range of at most one year.")
    feature_collection = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": data.name}, "geometry": geometry}]}
    task = {"task_name": f"TarimYol NDVI - {data.name}"[:100], "task_type": "area", "params": {
        "dates": [{"startDate": start.strftime("%m-%d-%Y"), "endDate": end.strftime("%m-%d-%Y"), "recurring": False}],
        "layers": [{"product": "MOD13Q1.061", "layer": "_250m_16_days_NDVI"}],
        "output": {"format": {"type": "geotiff", "filename_date": "calendar"}, "projection": "geographic"}, "geo": feature_collection}}
    result = _appeears("task", token, task)
    task_id = result[0] if isinstance(result, list) and result else None
    if isinstance(result, dict):
        task_id = result.get("task_id") or result.get("taskid") or next(iter(result.get("task_ids", [])), None)
    if not task_id:
        raise HTTPException(status_code=502, detail="AppEEARS accepted no task id.")
    _ndvi_geometries[str(task_id)] = geometry
    return {"task_id": str(task_id), "status": "submitted", "source": "NASA AppEEARS / MOD13Q1.061", "resolution_m": 250, "composite_days": 16}


@api_router.get("/api/ndvi/status", response_model=ItemResponse)
def ndvi_status(task_id: str = Query(...)) -> dict[str, Any]:
    token = get_settings().appeears_bearer_token.strip()
    if not token:
        raise HTTPException(status_code=503, detail="APPEEARS_BEARER_TOKEN is missing in .env.")
    if not re.fullmatch(r"[A-Za-z0-9-]{8,80}", task_id):
        raise HTTPException(status_code=400, detail="Invalid AppEEARS task id.")
    if task_id in _ndvi_results:
        return _ndvi_results[task_id]
    result = _appeears("task/" + task_id, token)
    response: dict[str, Any] = {"task_id": task_id, "status": str(result.get("status", "unknown")).lower()}
    if response["status"] != "done":
        return response
    geometry = _ndvi_geometries.get(task_id)
    if geometry is None:
        raise HTTPException(status_code=409, detail="Server restarted; submit the NDVI request again for parcel statistics.")
    try:
        import numpy as np
        import rasterio
        from rasterio.features import geometry_mask
        from rasterio.io import MemoryFile
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="NDVI raster processing requires rasterio and numpy.") from exc
    files = _appeears("bundle/" + task_id, token).get("files", [])
    selected = [item for item in files if str(item.get("file_name", "")).lower().endswith((".tif", ".tiff")) and "ndvi" in str(item.get("file_name", "")).lower()]
    series: list[dict[str, Any]] = []
    base = get_settings().appeears_api_url.rstrip("/")
    for item in selected[:40]:
        file_id = str(item.get("file_id", ""))
        if not file_id:
            continue
        request = Request(f"{base}/bundle/{task_id}/{file_id}", headers={"Authorization": f"Bearer {token}", "User-Agent": _UA})
        with urlopen(request, timeout=90) as downloaded:
            raster_bytes = downloaded.read()
        with MemoryFile(raster_bytes) as memory_file, memory_file.open() as dataset:
            band = dataset.read(1, masked=False).astype("float64")
            inside = geometry_mask([geometry], out_shape=band.shape, transform=dataset.transform, invert=True)
            valid = inside & np.isfinite(band)
            if dataset.nodata is not None:
                valid &= band != dataset.nodata
            valid &= (band > -2000) & (band <= 10000)
            values = band[valid]
            if values.size:
                values *= 0.0001
                match = re.search(r"(\d{4})(\d{3})", str(item.get("file_name", "")))
                series.append({"date": f"{match.group(1)}-{match.group(2)}" if match else str(item.get("file_name", "")), "mean": round(float(values.mean()), 4), "min": round(float(values.min()), 4), "max": round(float(values.max()), 4), "pixels": int(values.size)})
    response.update({"series": sorted(series, key=lambda row: row["date"]), "source": "NASA AppEEARS · MOD13Q1.061", "resolution_m": 250, "composite_days": 16})
    _ndvi_results[task_id] = response
    return response


@api_router.get("/api/tkgm/locations", response_model=LocationOptionsResponse)
def tkgm_locations(type: str = Query(...), parent_id: str = "") -> dict[str, Any]:
    paths = {"province": "ilListe", "district": "ilceListe", "neighborhood": "mahalleListe"}
    if type not in paths:
        raise HTTPException(status_code=400, detail="Location type must be province, district, or neighborhood.")
    if type != "province" and not re.fullmatch(r"\d{1,10}", parent_id):
        raise HTTPException(status_code=400, detail="A valid parent location id is required.")
    path = paths[type] + (f"/{parent_id}" if type != "province" else "")
    if path not in _location_cache:
        url = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/idariYapi/" + path
        headers = {"Origin": "https://parselsorgu.tkgm.gov.tr", "Referer": "https://parselsorgu.tkgm.gov.tr/"}
        data = _json_request(url, headers=headers)
        _location_cache[path] = [{"id": str(item.get("properties", {}).get("id", "")), "name": str(item.get("properties", {}).get("text", ""))} for item in data.get("features", [])]
    return {"options": _location_cache[path]}


@api_router.get("/api/tkgm/parcel", response_model=ParcelResponse)
def tkgm_parcel(neighborhood_id: str, block: str, parcel: str) -> dict[str, Any]:
    block, parcel = block.strip(), parcel.strip()
    if not re.fullmatch(r"\d{1,10}", neighborhood_id) or not re.fullmatch(r"[\w.-]{1,40}", block) or not re.fullmatch(r"[\w.-]{1,40}", parcel):
        raise HTTPException(status_code=400, detail="Enter a valid neighborhood, block, and parcel number.")
    url = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/parsel/" + "/".join(map(quote, (neighborhood_id, block, parcel)))
    feature = _json_request(url, headers={"Origin": "https://parselsorgu.tkgm.gov.tr", "Referer": "https://parselsorgu.tkgm.gov.tr/"})
    if feature.get("type") != "Feature" or feature.get("geometry", {}).get("type") not in {"Polygon", "MultiPolygon"}:
        raise HTTPException(status_code=404, detail="TKGM did not return a mapped parcel for those identifiers.")
    keys = ("ilAd", "ilceAd", "mahalleAd", "adaNo", "parselNo", "alan", "nitelik", "pafta")
    return {"type": "Feature", "geometry": feature["geometry"], "properties": {key: feature.get("properties", {})[key] for key in keys if feature.get("properties", {}).get(key) is not None}}


@api_router.get("/api/geocode", response_model=GeocodeResponse)
def geocode(q: str = Query(..., min_length=2)) -> dict[str, Any]:
    url = "https://nominatim.openstreetmap.org/search?" + urlencode({"q": q.strip(), "format": "jsonv2", "limit": 1, "accept-language": "tr"})
    places = _json_request(url, headers={"User-Agent": "TarimYol/1.0 (NASA Space Apps project)"}, timeout=20)
    if not places:
        raise HTTPException(status_code=404, detail="Location not found.")
    item = places[0]
    return {"latitude": float(item["lat"]), "longitude": float(item["lon"]), "display_name": item.get("display_name", q)}


@api_router.get("/api/field-data", response_model=ItemResponse)
def field_data(latitude: float, longitude: float, crop: str) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    settings = get_settings()
    if not settings.field_data_api_url.strip():
        raise HTTPException(status_code=503, detail="FIELD_DATA_API_URL is not configured.")
    url = settings.field_data_api_url + ("&" if "?" in settings.field_data_api_url else "?") + urlencode({"latitude": latitude, "longitude": longitude, "crop": crop})
    headers = {"Authorization": f"Bearer {settings.field_data_api_key}"} if settings.field_data_api_key else {}
    return _json_request(url, headers=headers)


@api_router.get("/api/plant-profile", response_model=ItemResponse)
def plant_profile(crop: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.perenual_api_key:
        raise HTTPException(status_code=503, detail="PERENUAL_API_KEY is not configured.")
    base = settings.perenual_base_url.rstrip("/")
    listing = _json_request(base + "/species-list?" + urlencode({"key": settings.perenual_api_key, "q": crop, "edible": 1, "page": 1}))
    matches = listing.get("data", [])
    if not matches:
        raise HTTPException(status_code=404, detail="Perenual profile not found for this crop.")
    plant = matches[0]
    if plant.get("id"):
        details = _json_request(base + "/species/details/" + str(plant["id"]) + "?" + urlencode({"key": settings.perenual_api_key}))
        plant.update(details)
    return {"source": "Perenual", "plant": plant}


@api_router.get("/api/soil", response_model=ItemResponse)
def soil(latitude: float, longitude: float) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    params: list[tuple[str, str | float]] = [("lon", longitude), ("lat", latitude)]
    params.extend(("property", prop) for prop in ("clay", "sand", "silt", "phh2o", "soc", "nitrogen"))
    params.extend(("depth", depth) for depth in ("0-5cm", "5-15cm", "15-30cm"))
    params.append(("value", "mean"))
    data = _json_request(get_settings().soilgrids_base_url + "?" + urlencode(params))
    return {"source": "ISRIC SoilGrids", "coordinates": {"latitude": latitude, "longitude": longitude}, "properties": data.get("properties", {})}


@api_router.get("/api/forecast", response_model=ItemResponse)
def forecast(latitude: float, longitude: float) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    params = urlencode({"latitude": latitude, "longitude": longitude, "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max", "timezone": "auto", "forecast_days": 10})
    data = _json_request(get_settings().open_meteo_base_url + "?" + params, timeout=20)
    return {"source": "Open-Meteo", "latitude": latitude, "longitude": longitude, "timezone": data.get("timezone"), "daily": data.get("daily", {})}


@api_router.get("/api/water", response_model=ItemResponse)
def water(latitude: float, longitude: float, crop: str = "wheat", area: float = 0) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    if area < 0:
        raise HTTPException(status_code=400, detail="Area cannot be negative.")
    end = date.today(); start = end - timedelta(days=29)
    params = urlencode({"start": start.strftime("%Y%m%d"), "end": end.strftime("%Y%m%d"), "latitude": latitude, "longitude": longitude, "community": "ag", "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN", "format": "JSON"})
    data = _json_request(get_settings().nasa_power_base_url + "?" + params, timeout=35)
    props = data.get("properties", {}).get("parameter", {})
    tmean, tmax, tmin, rain = (props.get(key, {}) for key in ("T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"))
    kc = {"wheat": .85, "barley": .85, "corn": 1.1, "sunflower": .95, "chickpea": .75, "lentil": .75, "cotton": 1.05, "tomato": 1.05, "potato": 1.0}.get(crop, .9)
    daily: list[dict[str, Any]] = []
    for key in sorted(tmean):
        try:
            day = date.fromisoformat(f"{key[:4]}-{key[4:6]}-{key[6:8]}").timetuple().tm_yday
            phi = math.radians(latitude); dr = 1 + .033 * math.cos(2 * math.pi * day / 365); delta = .409 * math.sin(2 * math.pi * day / 365 - 1.39)
            ws = math.acos(max(-1, min(1, -math.tan(phi) * math.tan(delta))))
            ra = 24 * 60 / math.pi * .0820 * dr * (ws * math.sin(phi) * math.sin(delta) + math.cos(phi) * math.cos(delta) * math.sin(ws))
            tm = float(tmean[key]); hi = float(tmax.get(key, tm + 5)); lo = float(tmin.get(key, tm - 5))
            et0 = max(0, .0023 * (tm + 17.8) * math.sqrt(max(0, hi - lo)) * ra * .408); precipitation = max(0, float(rain.get(key, 0)))
            demand = et0 * kc; daily.append({"date": key, "et0": round(et0, 2), "crop_demand": round(demand, 2), "rain": round(precipitation, 2), "deficit": round(max(0, demand - precipitation), 2)})
        except (ValueError, TypeError):
            continue
    total = sum(row["deficit"] for row in daily)
    return {"source": "NASA POWER + Hargreaves ET0", "crop": crop, "kc": kc, "area_dekar": area, "daily": daily, "total_deficit_mm": round(total, 1), "suggested_liters": round(total * area * 1000) if area else None}


@api_router.get("/api/fires", response_model=ItemResponse)
def fires(latitude: float, longitude: float) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    key = get_settings().nasa_firms_map_key.strip()
    if not key:
        raise HTTPException(status_code=503, detail="NASA_FIRMS_MAP_KEY is not configured.")
    box = f"{longitude-.25},{latitude-.25},{longitude+.25},{latitude+.25}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/{box}/1"
    request = Request(url, headers={"Accept": "text/csv", "User-Agent": _UA})
    try:
        with urlopen(request, timeout=25) as response:
            lines = [line for line in response.read().decode("utf-8").splitlines() if line.strip()]
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NASA FIRMS request failed: {exc}") from exc
    return {"source": "NASA FIRMS", "detections": max(0, len(lines) - 1), "window_days": 1}


@api_router.get("/api/projection", response_model=ItemResponse)
def projection(latitude: float, longitude: float) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    base = get_settings().nex_gddp_api_url.strip()
    if not base:
        raise HTTPException(status_code=503, detail="NEX_GDDP_API_URL is not configured.")
    url = base + ("&" if "?" in base else "?") + urlencode({"latitude": latitude, "longitude": longitude})
    return {"source": "NASA NEX-GDDP-CMIP6 proxy", "data": _json_request(url)}


@api_router.get("/api/climate", response_model=ItemResponse)
def climate(latitude: float, longitude: float) -> dict[str, Any]:
    _valid_coordinates(latitude, longitude)
    today = date.today(); end = date(today.year, 1, 1) - timedelta(days=1)
    start_text, end_text = f"{end.year - 2}0101", end.strftime("%Y%m%d")
    params = urlencode({"start": start_text, "end": end_text, "latitude": latitude, "longitude": longitude, "community": "ag", "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN", "header": "true", "format": "JSON"})
    data = _json_request(get_settings().nasa_power_base_url + "?" + params, timeout=45)
    properties = data.get("properties", {})
    parameters = properties.get("parameter", {})
    if not parameters:
        raise HTTPException(status_code=502, detail="NASA POWER response contained no climate data.")
    return {"source": "NASA POWER", "period": {"start": start_text, "end": end_text}, "requested_location": {"latitude": latitude, "longitude": longitude}, "parameters": parameters, "header": properties.get("header", {})}
