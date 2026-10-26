"""Small SQLite-backed JSON cache with per-entry expiration."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator

from app.core.config import get_settings

_DEFAULT_DB_PATH = Path(__file__).resolve().parents[2] / "data" / "cache.sqlite3"


def _database_path() -> Path:
    """Resolve the cache database path from the environment or project default."""
    raw_path = get_settings().cache_db_path.strip()
    return Path(raw_path).expanduser() if raw_path else _DEFAULT_DB_PATH


def _connect() -> sqlite3.Connection:
    """Open a short-lived SQLite connection and ensure the cache table exists."""
    db_path = _database_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path, timeout=10)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute(
        """CREATE TABLE IF NOT EXISTS cache_entries (
            cache_key TEXT PRIMARY KEY,
            cache_value TEXT NOT NULL,
            created_at TEXT NOT NULL,
            ttl_seconds INTEGER NOT NULL CHECK (ttl_seconds > 0)
        )"""
    )
    return connection


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    """Yield a connection and always commit or roll back and close it."""
    connection = _connect()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def get_cache(cache_key: str) -> Any | None:
    """Return a decoded cache value if present and unexpired; otherwise ``None``."""
    if not cache_key:
        raise ValueError("cache_key cannot be empty")
    with _connection() as connection:
        row = connection.execute(
            "SELECT cache_value, created_at, ttl_seconds FROM cache_entries WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
        if row is None:
            return None
        value_json, created_at, ttl_seconds = row
        try:
            created = datetime.fromisoformat(created_at)
        except ValueError:
            connection.execute("DELETE FROM cache_entries WHERE cache_key = ?", (cache_key,))
            return None
        if datetime.now(timezone.utc) >= created + timedelta(seconds=int(ttl_seconds)):
            connection.execute("DELETE FROM cache_entries WHERE cache_key = ?", (cache_key,))
            return None
        try:
            return json.loads(value_json)
        except json.JSONDecodeError:
            connection.execute("DELETE FROM cache_entries WHERE cache_key = ?", (cache_key,))
            return None


def set_cache(cache_key: str, cache_value: Any, ttl_seconds: int = 3600) -> None:
    """Store a JSON-serializable value with a positive time-to-live in seconds."""
    if not cache_key:
        raise ValueError("cache_key cannot be empty")
    if ttl_seconds <= 0:
        raise ValueError("ttl_seconds must be greater than zero")
    serialized_value = json.dumps(cache_value, ensure_ascii=False, separators=(",", ":"))
    created_at = datetime.now(timezone.utc).isoformat()
    with _connection() as connection:
        connection.execute(
            """INSERT INTO cache_entries (cache_key, cache_value, created_at, ttl_seconds)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(cache_key) DO UPDATE SET
                   cache_value = excluded.cache_value,
                   created_at = excluded.created_at,
                   ttl_seconds = excluded.ttl_seconds""",
            (cache_key, serialized_value, created_at, ttl_seconds),
        )


def delete_expired_cache() -> int:
    """Delete expired entries and return the number of removed rows."""
    cutoff = datetime.now(timezone.utc)
    removed = 0
    with _connection() as connection:
        rows = connection.execute(
            "SELECT cache_key, created_at, ttl_seconds FROM cache_entries"
        ).fetchall()
        expired_keys = [
            key
            for key, created_at, ttl_seconds in rows
            if _is_expired(created_at, int(ttl_seconds), cutoff)
        ]
        if expired_keys:
            connection.executemany(
                "DELETE FROM cache_entries WHERE cache_key = ?",
                ((key,) for key in expired_keys),
            )
            removed = len(expired_keys)
    return removed


def _is_expired(created_at: str, ttl_seconds: int, now: datetime) -> bool:
    """Check one cache timestamp, treating malformed values as expired."""
    try:
        created = datetime.fromisoformat(created_at)
    except ValueError:
        return True
    return now >= created + timedelta(seconds=ttl_seconds)
