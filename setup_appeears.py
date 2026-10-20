"""Create a short-lived AppEEARS API token and save it to the local .env file."""
from __future__ import annotations

import base64
import getpass
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
API = os.environ.get("APPEEARS_API_URL", "https://appeears.earthdatacloud.nasa.gov/api/").rstrip("/") + "/"


def main() -> None:
    username = input("NASA Earthdata username: ").strip()
    password = getpass.getpass("NASA Earthdata password (not saved): ")
    if not username or not password:
        raise SystemExit("Username and password are required.")
    basic = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
    request = Request(
        API + "login",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "TarimYol/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise SystemExit(f"AppEEARS login failed (HTTP {exc.code}). Check credentials and Earthdata access.") from None
    except (URLError, TimeoutError) as exc:
        raise SystemExit(f"Could not reach AppEEARS: {exc.reason if isinstance(exc, URLError) else exc}") from None
    token = str(result.get("token", "")).strip()
    if not token:
        raise SystemExit("AppEEARS did not return a bearer token.")

    env_path = ROOT / ".env"
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
    lines = [line for line in lines if not line.startswith("APPEEARS_API_URL=") and not line.startswith("APPEEARS_BEARER_TOKEN=")]
    lines.extend([f"APPEEARS_API_URL={API}", f"APPEEARS_BEARER_TOKEN={token}"])
    env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    expiration = result.get("expiration") or "about 48 hours"
    print(f"AppEEARS token saved to {env_path.name}. Expires: {expiration}")
    print("Restart the server with: python server.py")


if __name__ == "__main__":
    main()
