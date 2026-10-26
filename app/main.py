from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles

from app.api.v1.endpoints import api_router
from app.api.v1.router import router as v1_router

app = FastAPI(title="TarımYol API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(api_router)
app.include_router(v1_router)
# Serve the existing frontend when the project root URL is opened.
PROJECT_ROOT = Path(__file__).resolve().parents[1]


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Keep validation errors in the {error: ...} shape used by the frontend."""
    return JSONResponse(status_code=422, content=jsonable_encoder({"error": "Invalid request.", "details": exc.errors()}))


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Use the API's established error key for predictable frontend handling."""
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail), "details": None}, headers=exc.headers)


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a concise JSON error without exposing a traceback to clients."""
    return JSONResponse(status_code=500, content={"error": "Internal server error."})


app.mount("/", StaticFiles(directory=str(PROJECT_ROOT), html=True), name="frontend")
