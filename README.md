# TarımYol

TarımYol is a FastAPI-powered agricultural decision-support application. The web interface is served by the same application.

The Field Management workspace brings together field planning, parcel mapping, and weather-informed operational guidance. A separate Crop Guide provides practical information for field and horticultural crops. Crop cards describe planting and harvest windows, growing regions, and cultivation considerations; horticultural crops are grouped into fruit, nuts, citrus, viticulture, and vegetables.

The location search in Field Management resolves coordinates automatically. Once a valid crop and field area are provided, the application generates a seasonal plan. Selecting a saved field fills in its location, crop, and area, then updates the plan and field view for that selection.

The parcel map can display NASA GIBS layers for NDVI, EVI, SMAP surface soil moisture, MODIS daytime land-surface temperature, and SRTM elevation. The same five layers are also available as synchronized mini-maps focused on the selected field. Satellite pixel resolution should be considered when interpreting results for small parcels.

Parcel area is taken from the official TKGM area where available (m² converted to decares); otherwise, it is estimated from the drawn boundary using a geodesic area calculation. The application does not assume a default size when area data is unavailable and asks the user to enter the actual area before saving.

## Installation and launch

From the project directory, run these commands in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Web app: `http://127.0.0.1:8000`  
Swagger UI: `http://127.0.0.1:8000/docs`

## Crop rotation and SQLite cache

Request a rotation recommendation with `POST /api/v1/rotation/calculate`. Inputs are `selected_crop`, optional `previous_crop`, `priority`, and `irrigation_available`. `priority` can be `soil`, `water`, or `risk`. Supported crop keys are `wheat`, `barley`, `corn`, `sunflower`, `chickpea`, `lentil`, `cotton`, `tomato`, and `potato`.

Example request:

```json
{
  "selected_crop": "wheat",
  "previous_crop": "barley",
  "priority": "soil",
  "irrigation_available": false
}
```

Results are cached for six hours by default in `data/cache.sqlite3`. Set `CACHE_DB_PATH` to change the database path. Each cache entry stores a SHA-256 key for the request inputs, the JSON result, its creation time, and its TTL. The response's `cached` field indicates whether the result came from SQLite.

SQLite is included in Python's standard library and requires no additional package.

## Other API endpoints

- `GET /api/climate`, `/api/geocode`, `/api/soil`, `/api/forecast`, `/api/water`
- `GET /api/field-data`, `/api/plant-profile`, `/api/fires`, `/api/projection`
- `GET /api/tkgm/locations`, `/api/tkgm/parcel`
- `GET /api/ndvi/health`, `POST /api/ndvi/task`, `GET /api/ndvi/status`

Configure external service keys in the `.env` file at the project root. Use `.env.example` as a starting point.

NDVI raster processing requires `numpy` and `rasterio`. Crop rotation recommendations are decision support; validate them against local rotation practices, disease history, and soil test results.
