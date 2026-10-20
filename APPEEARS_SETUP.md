# NASA AppEEARS NDVI setup

The server submits an AppEEARS `area` task for each saved parcel, requests the `MOD13Q1.061` NDVI layer, waits for completion, downloads the GeoTIFF outputs, and calculates parcel mean/minimum/maximum values with `rasterio` and `numpy`.

## Configure the server

1. Install the Python packages once from the project folder: `python -m pip install -r requirements.txt`.
2. Run `python setup_appeears.py`. It prompts for the NASA Earthdata username and password locally, calls the AppEEARS `/api/login` endpoint, then saves the resulting short-lived API bearer token in `.env`. The password is not saved. NASA documents that the API token expires in about 48 hours.
3. Restart `python server.py` after generating or refreshing the token.

Do not put tokens in browser JavaScript, commit them, or share them in chat. The Earthdata profile user token from `urs.earthdata.nasa.gov/users/.../user_tokens` is not the AppEEARS API token.

Each saved polygon has a `NASA'dan NDVI getir` button and a selectable date range (maximum one year). The app polls the AppEEARS task, calculates a mean/min/max for each available MODIS composite, and colors the parcel using the latest mean. MOD13Q1 is 250 m and 16-day; small parcels may contain few or no usable pixels. AppEEARS tasks can take several minutes. If the server restarts while a task is running, submit it again so the in-memory parcel geometry is available for statistics.

The map can now query TKGM's currently used MEGSIS web service for province/district/neighborhood lists and parcel geometry. TKGM documents the public Parcel Query workflow, but does not publish this backend endpoint as a supported third-party API; it may change or restrict automated requests. The manual polygon tool remains available as a fallback.
