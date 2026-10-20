"""Local development server and NASA POWER climate-data proxy."""
from __future__ import annotations

import json
import os
import re
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlencode, urlparse
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
NDVI_GEOMETRIES: dict[str, dict] = {}
NDVI_RESULTS: dict[str, dict] = {}
TKGM_LOCATION_CACHE: dict[str, list[dict]] = {}


def load_env() -> None:
    path = ROOT / ".env"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"\''))


def env_value(name: str, default: str = "") -> str:
    """Read secrets from the current .env so replacing an expired token takes effect immediately."""
    path = ROOT / ".env"
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                if key.strip() == name:
                    return value.strip().strip('"\'')
    return os.environ.get(name, default)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        # The browser runs on port 5500 and sends JSON to this API on port 8000.
        # Answer its CORS preflight so NDVI POST requests reach the AppEEARS proxy.
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def app_eears_request(self, path: str, token: str, payload: dict | None = None):
        base = os.environ.get("APPEEARS_API_URL", "https://appeears.earthdatacloud.nasa.gov/api/").rstrip("/") + "/"
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        token = token.removeprefix("Bearer ").strip()
        headers = {"Accept": "application/json", "Authorization": f"Bearer {token}", "User-Agent": "TarimYol/1.0"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        request = Request(base + path.lstrip("/"), data=body, headers=headers, method="POST" if body is not None else "GET")
        try:
            with urlopen(request, timeout=45) as response:
                raw = response.read()
        except HTTPError as exc:
            # Keep NASA's useful authentication/validation message visible to the UI.
            raw = exc.read(1000).decode("utf-8", errors="replace")
            try:
                detail = json.dumps(json.loads(raw), ensure_ascii=False)
            except (ValueError, TypeError):
                detail = raw or exc.reason
            raise RuntimeError(f"AppEEARS returned HTTP {exc.code}: {detail[:400]}") from None
        return json.loads(raw.decode("utf-8")) if raw else {}

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/ndvi/task":
            return self.send_json(404, {"error": "API endpoint not found."})
        token = env_value("APPEEARS_BEARER_TOKEN").strip()
        if not token:
            return self.send_json(503, {"error": "APPEEARS_BEARER_TOKEN is missing in .env. Use an AppEEARS API bearer token; Earthdata profile tokens do not work here."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 200_000:
                raise ValueError("Invalid request size.")
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            geometry = data.get("geometry", {})
            if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
                raise ValueError("A Polygon or MultiPolygon geometry is required.")
            coordinates = geometry.get("coordinates", [])
            rings = coordinates if geometry["type"] == "Polygon" else [ring for polygon in coordinates for ring in polygon]
            if not rings or any(len(ring) < 4 or any(len(point) != 2 for point in ring) for ring in rings):
                raise ValueError("Polygon rings must contain at least three points and a closing point.")
            start = date.fromisoformat(data.get("start", ""))
            end = date.fromisoformat(data.get("end", ""))
            if start > end or (end - start).days > 366:
                raise ValueError("Choose a valid date range of at most one year.")
            parcel_name = str(data.get("name", "Parcel"))[:80]
            area_geo = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": parcel_name}, "geometry": geometry}]}
            task = {
                "task_name": f"TarimYol NDVI - {parcel_name}"[:100], "task_type": "area",
                "params": {
                    "dates": [{"startDate": start.strftime("%m-%d-%Y"), "endDate": end.strftime("%m-%d-%Y"), "recurring": False}],
                    "layers": [{"product": "MOD13Q1.061", "layer": "_250m_16_days_NDVI"}],
                    "output": {"format": {"type": "geotiff", "filename_date": "calendar"}, "projection": "geographic"},
                    "geo": area_geo,
                },
            }
            result = self.app_eears_request("task", token, task)
            if isinstance(result, list):
                task_id = result[0] if result else None
            elif isinstance(result, dict):
                task_id = result.get("task_id") or result.get("taskid") or (result.get("task_ids") or [None])[0]
            else:
                task_id = None
            if not task_id:
                raise RuntimeError("AppEEARS accepted no task id: " + json.dumps(result)[:500])
            NDVI_GEOMETRIES[str(task_id)] = geometry
            return self.send_json(202, {"task_id": task_id, "status": "submitted", "source": "NASA AppEEARS / MOD13Q1.061", "resolution_m": 250, "composite_days": 16})
        except ValueError as exc:
            return self.send_json(400, {"error": str(exc)})
        except Exception as exc:
            return self.send_json(502, {"error": "AppEEARS task submission failed.", "details": str(exc)[:500]})

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/ndvi/health":
            token = env_value("APPEEARS_BEARER_TOKEN").strip()
            if not token:
                return self.send_json(503, {"connected": False, "error": "APPEEARS_BEARER_TOKEN bulunamadı. Önce python setup_appeears.py çalıştır."})
            try:
                self.app_eears_request("product/MOD13Q1.061", token)
                return self.send_json(200, {"connected": True, "product": "MOD13Q1.061"})
            except Exception as exc:
                return self.send_json(502, {"connected": False, "error": str(exc)[:500]})
        if parsed.path == "/api/tkgm/locations":
            query = parse_qs(parsed.query)
            kind = query.get("type", [""])[0]
            parent = query.get("parent_id", [""])[0]
            if kind not in {"province", "district", "neighborhood"}:
                return self.send_json(400, {"error": "Location type must be province, district, or neighborhood."})
            paths = {"province": "ilListe", "district": "ilceListe", "neighborhood": "mahalleListe"}
            if kind != "province" and not re.fullmatch(r"\d{1,10}", parent):
                return self.send_json(400, {"error": "A valid parent location id is required."})
            path = paths[kind] + (f"/{parent}" if kind != "province" else "")
            try:
                if path in TKGM_LOCATION_CACHE:
                    return self.send_json(200, {"options": TKGM_LOCATION_CACHE[path]})
                base = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/idariYapi/"
                headers = {"Accept": "application/json", "Origin": "https://parselsorgu.tkgm.gov.tr", "Referer": "https://parselsorgu.tkgm.gov.tr/", "User-Agent": "TarimYol/1.0"}
                with urlopen(Request(base + path, headers=headers), timeout=30) as response:
                    data = json.loads(response.read().decode("utf-8"))
                options = [{"id": str(feature.get("properties", {}).get("id", "")), "name": str(feature.get("properties", {}).get("text", ""))} for feature in data.get("features", [])]
                TKGM_LOCATION_CACHE[path] = options
                return self.send_json(200, {"options": options})
            except Exception as exc:
                return self.send_json(502, {"error": "TKGM location list could not be loaded.", "details": str(exc)[:300]})
        if parsed.path == "/api/tkgm/parcel":
            query = parse_qs(parsed.query)
            neighborhood = query.get("neighborhood_id", [""])[0]
            block = query.get("block", [""])[0].strip()
            parcel_no = query.get("parcel", [""])[0].strip()
            if not re.fullmatch(r"\d{1,10}", neighborhood) or not re.fullmatch(r"[\w.-]{1,40}", block, re.UNICODE) or not re.fullmatch(r"[\w.-]{1,40}", parcel_no, re.UNICODE):
                return self.send_json(400, {"error": "Enter a valid neighborhood, block (ada), and parcel number."})
            try:
                base = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/parsel/"
                endpoint = f"{base}{quote(neighborhood)}/{quote(block)}/{quote(parcel_no)}"
                headers = {"Accept": "application/json", "Origin": "https://parselsorgu.tkgm.gov.tr", "Referer": "https://parselsorgu.tkgm.gov.tr/", "User-Agent": "TarimYol/1.0"}
                with urlopen(Request(endpoint, headers=headers), timeout=30) as response:
                    feature = json.loads(response.read().decode("utf-8"))
                if feature.get("type") != "Feature" or feature.get("geometry", {}).get("type") not in {"Polygon", "MultiPolygon"}:
                    return self.send_json(404, {"error": "TKGM did not return a mapped parcel for those identifiers."})
                properties = feature.get("properties", {})
                keep = ("ilAd", "ilceAd", "mahalleAd", "adaNo", "parselNo", "alan", "nitelik", "pafta")
                return self.send_json(200, {"type": "Feature", "geometry": feature["geometry"], "properties": {key: properties.get(key) for key in keep if properties.get(key) is not None}})
            except Exception as exc:
                return self.send_json(502, {"error": "TKGM parcel service request failed.", "details": str(exc)[:300]})
        if parsed.path == "/api/ndvi/status":
            token = env_value("APPEEARS_BEARER_TOKEN").strip()
            if not token:
                return self.send_json(503, {"error": "APPEEARS_BEARER_TOKEN is missing in .env."})
            task_id = parse_qs(parsed.query).get("task_id", [""])[0]
            if not re.fullmatch(r"[A-Za-z0-9-]{8,80}", task_id):
                return self.send_json(400, {"error": "Invalid AppEEARS task id."})
            try:
                if task_id in NDVI_RESULTS:
                    return self.send_json(200, NDVI_RESULTS[task_id])
                status = self.app_eears_request("task/" + task_id, token)
                state = str(status.get("status", "unknown")).lower()
                response = {"task_id": task_id, "status": state}
                if state == "done":
                    bundle = self.app_eears_request("bundle/" + task_id, token)
                    files = bundle.get("files", [])
                    ndvi_files = [item for item in files if str(item.get("file_name", "")).lower().endswith((".tif", ".tiff")) and "ndvi" in str(item.get("file_name", "")).lower()]
                    try:
                        import numpy as np
                        import rasterio
                        from rasterio.features import geometry_mask
                        from rasterio.io import MemoryFile
                    except ImportError:
                        return self.send_json(503, {"error": "NDVI raster processing requires rasterio and numpy. Run: pip install -r requirements.txt"})
                    geometry = NDVI_GEOMETRIES.get(task_id)
                    if geometry is None:
                        return self.send_json(409, {"error": "This server restarted after the task was submitted. Submit the NDVI request again so its parcel geometry is available for statistics."})
                    series = []
                    for item in ndvi_files[:40]:
                        file_id = str(item.get("file_id", ""))
                        if not file_id:
                            continue
                        file_url = os.environ.get("APPEEARS_API_URL", "https://appeears.earthdatacloud.nasa.gov/api/").rstrip("/") + f"/bundle/{task_id}/{file_id}"
                        request = Request(file_url, headers={"Authorization": f"Bearer {token}", "User-Agent": "TarimYol/1.0"})
                        with urlopen(request, timeout=90) as downloaded:
                            raster_bytes = downloaded.read()
                        with MemoryFile(raster_bytes) as memfile, memfile.open() as dataset:
                            band = dataset.read(1, masked=False).astype("float64")
                            inside = geometry_mask([geometry], out_shape=band.shape, transform=dataset.transform, invert=True)
                            valid = inside & np.isfinite(band)
                            if dataset.nodata is not None:
                                valid &= band != dataset.nodata
                            valid &= (band > -2000) & (band <= 10000)
                            values = band[valid]
                            if values.size:
                                # MOD13Q1 NDVI uses a 0.0001 scale factor.
                                values = values * 0.0001
                                match = re.search(r"(\d{4})(\d{3})", str(item.get("file_name", "")))
                                label = f"{match.group(1)}-{match.group(2)}" if match else str(item.get("file_name", ""))
                                series.append({"date": label, "mean": round(float(values.mean()), 4), "min": round(float(values.min()), 4), "max": round(float(values.max()), 4), "pixels": int(values.size)})
                    response["series"] = sorted(series, key=lambda item: item["date"])
                    response["source"] = "NASA AppEEARS · MOD13Q1.061"
                    response["resolution_m"] = 250
                    response["composite_days"] = 16
                    NDVI_RESULTS[task_id] = response
                return self.send_json(200, response)
            except Exception as exc:
                return self.send_json(502, {"error": "Could not retrieve AppEEARS task status or results.", "details": str(exc)[:500]})
        if parsed.path == "/api/geocode":
            query = parse_qs(parsed.query)
            place = query.get("q", [""])[0].strip()
            if len(place) < 2:
                return self.send_json(400, {"error": "En az iki karakterlik bir konum yazın."})
            try:
                geocode_url = "https://nominatim.openstreetmap.org/search?" + urlencode({"q": place, "format": "jsonv2", "limit": 1, "accept-language": "tr"})
                request = Request(geocode_url, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0 (NASA Space Apps project)"})
                with urlopen(request, timeout=20) as response:
                    places = json.loads(response.read().decode("utf-8"))
                if not places:
                    return self.send_json(404, {"error": "Bu konum bulunamadı. İl, ilçe veya köy adıyla tekrar deneyin."})
                item = places[0]
                return self.send_json(200, {"latitude": float(item["lat"]), "longitude": float(item["lon"]), "display_name": item.get("display_name", place)})
            except Exception as exc:
                return self.send_json(502, {"error": "Konum aranırken bir hata oluştu.", "details": str(exc)})
        if parsed.path == "/api/field-data":
            query = parse_qs(parsed.query)
            base = os.environ.get("FIELD_DATA_API_URL", "").strip()
            if not base:
                return self.send_json(503, {"error": "FIELD_DATA_API_URL ayarlanmamış; genel ürün takvimi kullanılıyor."})
            try:
                lat = float(query.get("latitude", [""])[0]); lon = float(query.get("longitude", [""])[0])
                crop = query.get("crop", [""])[0]
                remote_url = base + ("&" if "?" in base else "?") + urlencode({"latitude": lat, "longitude": lon, "crop": crop})
                headers = {"Accept": "application/json", "User-Agent": "TarimYol/1.0"}
                api_key = os.environ.get("FIELD_DATA_API_KEY", "").strip()
                if api_key: headers["Authorization"] = f"Bearer {api_key}"
                request = Request(remote_url, headers=headers)
                with urlopen(request, timeout=30) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                return self.send_json(200, payload)
            except Exception as exc:
                return self.send_json(502, {"error": "Tarla takvimi API'sinden veri alınamadı.", "details": str(exc)})
        if parsed.path == "/api/plant-profile":
            query = parse_qs(parsed.query)
            crop_names = {"wheat":"wheat", "barley":"barley", "corn":"corn", "sunflower":"sunflower", "chickpea":"chickpea", "lentil":"lentil", "cotton":"cotton", "tomato":"tomato", "potato":"potato"}
            crop = crop_names.get(query.get("crop", [""])[0], query.get("crop", [""])[0]).strip()
            api_key = os.environ.get("PERENUAL_API_KEY", "").strip()
            if not api_key:
                return self.send_json(503, {"error": "PERENUAL_API_KEY ayarlanmamış; Perenual profili atlandı."})
            try:
                base = os.environ.get("PERENUAL_BASE_URL", "https://perenual.com/api/v2").rstrip("/")
                list_url = base + "/species-list?" + urlencode({"key": api_key, "q": crop, "edible": 1, "page": 1})
                request = Request(list_url, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0"})
                with urlopen(request, timeout=25) as response:
                    listing = json.loads(response.read().decode("utf-8"))
                matches = listing.get("data", [])
                if not matches:
                    return self.send_json(404, {"error": "Perenual bu ürün için profil bulamadı."})
                plant = matches[0]
                plant_id = plant.get("id")
                if plant_id:
                    details_url = base + "/species/details/" + str(plant_id) + "?" + urlencode({"key": api_key})
                    request = Request(details_url, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0"})
                    with urlopen(request, timeout=25) as response:
                        details = json.loads(response.read().decode("utf-8"))
                    plant.update(details)
                return self.send_json(200, {"source": "Perenual", "plant": plant})
            except Exception as exc:
                return self.send_json(502, {"error": "Perenual ürün profili alınamadı.", "details": str(exc)})
        if parsed.path == "/api/soil":
            query = parse_qs(parsed.query)
            try:
                lat = float(query.get("latitude", [""])[0]); lon = float(query.get("longitude", [""])[0])
                if not (-90 <= lat <= 90 and -180 <= lon <= 180): raise ValueError("Koordinat aralık dışında")
                base = os.environ.get("SOILGRIDS_BASE_URL", "https://rest.isric.org/soilgrids/v2.0/properties/query")
                params = [("lon", lon), ("lat", lat)]
                for prop in ("clay", "sand", "silt", "phh2o", "soc", "nitrogen"):
                    params.append(("property", prop))
                params += [("depth", "0-5cm"), ("depth", "5-15cm"), ("depth", "15-30cm"), ("value", "mean")]
                request = Request(base + "?" + urlencode(params), headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0"})
                with urlopen(request, timeout=35) as response:
                    data = json.loads(response.read().decode("utf-8"))
                return self.send_json(200, {"source": "ISRIC SoilGrids", "coordinates": {"latitude": lat, "longitude": lon}, "properties": data.get("properties", {})})
            except Exception as exc:
                return self.send_json(502, {"error": "SoilGrids toprak verisi alınamadı.", "details": str(exc)})
        if parsed.path == "/api/forecast":
            query = parse_qs(parsed.query)
            try:
                lat = float(query.get("latitude", [""])[0]); lon = float(query.get("longitude", [""])[0])
                base = os.environ.get("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast")
                params = urlencode({"latitude": lat, "longitude": lon, "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max", "timezone": "auto", "forecast_days": 10})
                request = Request(base + "?" + params, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0"})
                with urlopen(request, timeout=20) as response:
                    data = json.loads(response.read().decode("utf-8"))
                return self.send_json(200, {"source": "Open-Meteo", "latitude": lat, "longitude": lon, "timezone": data.get("timezone"), "daily": data.get("daily", {})})
            except Exception as exc:
                return self.send_json(502, {"error": "Kısa vadeli hava tahmini alınamadı.", "details": str(exc)})
        if parsed.path == "/api/water":
            query = parse_qs(parsed.query)
            try:
                from datetime import timedelta
                import math
                lat = float(query.get("latitude", [""])[0]); lon = float(query.get("longitude", [""])[0])
                crop = query.get("crop", ["wheat"])[0]; area = float(query.get("area", ["0"])[0] or 0)
                end_date = date.today(); start_date = end_date - timedelta(days=29)
                base = os.environ.get("NASA_POWER_BASE_URL", "https://power.larc.nasa.gov/api/temporal/daily/point")
                url = f"{base}?" + urlencode({"start": start_date.strftime("%Y%m%d"), "end": end_date.strftime("%Y%m%d"), "latitude": lat, "longitude": lon, "community": "ag", "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN", "format": "JSON"})
                request = Request(url, headers={"Accept": "application/json", "User-Agent": "TarimYol/1.0"})
                with urlopen(request, timeout=35) as response: data = json.loads(response.read().decode("utf-8"))
                p = data.get("properties", {}).get("parameter", {}); tmean=p.get("T2M",{}); tmax=p.get("T2M_MAX",{}); tmin=p.get("T2M_MIN",{}); rain=p.get("PRECTOTCORR",{})
                kc={"wheat":0.85,"barley":0.85,"corn":1.10,"sunflower":0.95,"chickpea":0.75,"lentil":0.75,"cotton":1.05,"tomato":1.05,"potato":1.00}.get(crop,0.9)
                daily=[]
                for key in sorted(tmean):
                    try:
                        j=date.fromisoformat(f"{key[:4]}-{key[4:6]}-{key[6:8]}").timetuple().tm_yday; phi=math.radians(lat); dr=1+0.033*math.cos(2*math.pi*j/365); delta=0.409*math.sin(2*math.pi*j/365-1.39); ws=math.acos(max(-1,min(1,-math.tan(phi)*math.tan(delta)))); ra=24*60/math.pi*0.0820*dr*(ws*math.sin(phi)*math.sin(delta)+math.cos(phi)*math.cos(delta)*math.sin(ws)); tm=float(tmean[key]); hi=float(tmax.get(key,tm+5)); lo=float(tmin.get(key,tm-5)); et0=max(0,0.0023*(tm+17.8)*math.sqrt(max(0,hi-lo))*ra*0.408); precipitation=max(0,float(rain.get(key,0))); demand=et0*kc; deficit=max(0,demand-precipitation); daily.append({"date":key,"et0":round(et0,2),"crop_demand":round(demand,2),"rain":round(precipitation,2),"deficit":round(deficit,2)})
                    except (ValueError,TypeError): continue
                total=sum(x["deficit"] for x in daily); return self.send_json(200,{"source":"NASA POWER + Hargreaves ET0","crop":crop,"kc":kc,"area_dekar":area,"daily":daily,"total_deficit_mm":round(total,1),"suggested_liters":round(total*area*1000) if area else None})
            except Exception as exc:
                return self.send_json(502,{"error":"Su bilançosu hesaplanamadı.","details":str(exc)})
        if parsed.path == "/api/fires":
            query=parse_qs(parsed.query); key=os.environ.get("NASA_FIRMS_MAP_KEY","").strip()
            if not key:return self.send_json(503,{"error":"NASA_FIRMS_MAP_KEY ayarlanmamış."})
            try:
                lat=float(query.get("latitude",[""])[0]); lon=float(query.get("longitude",[""])[0]); box=f"{lon-.25},{lat-.25},{lon+.25},{lat+.25}"
                url=f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/{box}/1"
                with urlopen(Request(url,headers={"Accept":"text/csv","User-Agent":"TarimYol/1.0"}),timeout=25) as response: raw=response.read().decode("utf-8")
                lines=[x for x in raw.splitlines() if x.strip()]; return self.send_json(200,{"source":"NASA FIRMS","detections":max(0,len(lines)-1),"window_days":1})
            except Exception as exc:return self.send_json(502,{"error":"NASA FIRMS verisi alınamadı.","details":str(exc)})
        if parsed.path == "/api/projection":
            base=os.environ.get("NEX_GDDP_API_URL","").strip()
            if not base:return self.send_json(503,{"error":"NEX_GDDP_API_URL ayarlanmamış."})
            try:
                query=parse_qs(parsed.query); lat=float(query.get("latitude",[""])[0]); lon=float(query.get("longitude",[""])[0]); url=base+(("&" if "?" in base else "?")+urlencode({"latitude":lat,"longitude":lon}))
                with urlopen(Request(url,headers={"Accept":"application/json","User-Agent":"TarimYol/1.0"}),timeout=30) as response:data=json.loads(response.read().decode("utf-8"))
                return self.send_json(200,{"source":"NASA NEX-GDDP-CMIP6 proxy","data":data})
            except Exception as exc:return self.send_json(502,{"error":"İklim projeksiyonu alınamadı.","details":str(exc)})
        if parsed.path != "/api/climate":
            if parsed.path == "/":
                self.path = "/index.html"
            return super().do_GET()

        query = parse_qs(parsed.query)
        try:
            lat = float(query.get("latitude", [""])[0])
            lon = float(query.get("longitude", [""])[0])
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError("Koordinatlar geçerli aralıkta değil.")
        except (ValueError, TypeError):
            return self.send_json(400, {"error": "Geçerli enlem ve boylam girin."})

        today = date.today()
        end = today.replace(month=1, day=1).toordinal() - 1
        end_date = date.fromordinal(end)
        start_year = end_date.year - 2
        start = f"{start_year}0101"
        finish = end_date.strftime("%Y%m%d")
        base = os.environ.get("NASA_POWER_BASE_URL", "https://power.larc.nasa.gov/api/temporal/daily/point")
        params = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN"
        url = (f"{base}?start={start}&end={finish}&latitude={lat}&longitude={lon}"
               f"&community=ag&parameters={params}&header=true&format=JSON")
        try:
            request = Request(url, headers={"Accept": "application/json", "User-Agent": "TarimYolHaritasi/1.0"})
            with urlopen(request, timeout=45) as response:
                data = json.loads(response.read().decode("utf-8"))
            properties = data.get("properties", {})
            result = {
                "source": "NASA POWER",
                "period": {"start": start, "end": finish},
                "requested_location": {"latitude": lat, "longitude": lon},
                "parameters": properties.get("parameter", {}),
                "header": properties.get("header", {}),
            }
            if not result["parameters"]:
                return self.send_json(502, {"error": "NASA POWER yanıtında iklim verisi bulunamadı.", "details": data.get("messages", [])})
            return self.send_json(200, result)
        except Exception as exc:
            return self.send_json(502, {"error": "NASA POWER verisi alınamadı. Biraz sonra tekrar deneyin.", "details": str(exc)})


if __name__ == "__main__":
    load_env()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Tarım Yol Haritası: http://{host}:{port}")
    ThreadingHTTPServer((host, port), Handler).serve_forever()
