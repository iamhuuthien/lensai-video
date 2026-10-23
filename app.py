"""ASGI entrypoint (`uvicorn app:app`). Application wiring lives in ``backend/main.py``."""

import os

from backend.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
