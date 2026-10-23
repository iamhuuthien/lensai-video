"""Central configuration: filesystem layout and environment-driven settings."""

import os
from pathlib import Path

# <repo>/backend/core/config.py -> <repo>
BASE_DIR = Path(__file__).resolve().parents[2]

SAVED_VIDEOS_DIR = BASE_DIR / "saved_videos"
LEGACY_CACHE_DIR = BASE_DIR / "cache"

# Output of `npm run build` in ./frontend (Vite). Override for custom deployments.
FRONTEND_DIST_DIR = Path(os.environ.get("LENSAI_FRONTEND_DIST", BASE_DIR / "frontend" / "dist"))

APP_VERSION = "4.0.0"


def has_server_api_key() -> bool:
    """Whether the server itself holds a Gemini key (read at call time, not import time)."""
    return bool(os.environ.get("GEMINI_API_KEY", "").strip())


def saved_listing_enabled() -> bool:
    return os.environ.get("LENSAI_ENABLE_SAVED_LISTING", "").strip().lower() in ("1", "true", "yes")


def ensure_runtime_dirs() -> None:
    SAVED_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
