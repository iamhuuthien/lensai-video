"""Application factory: wires middleware, controllers, extensions and the built SPA."""

import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from backend.controllers import (
    analysis_controller,
    chat_controller,
    media_controller,
    system_controller,
)
from backend.core import config
from backend.core.extensions import load_extensions

logger = logging.getLogger("video-explainer")

_FRONTEND_MISSING = (
    "<h1>Frontend chưa được build</h1>"
    "<p>Chạy <code>cd frontend &amp;&amp; npm ci &amp;&amp; npm run build</code> rồi tải lại trang.</p>"
)


class ImmutableStaticFiles(StaticFiles):
    """Vite emits content-hashed filenames, so assets can be cached forever."""

    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        if response.status_code == 200:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


def _mount_frontend(app: FastAPI) -> None:
    dist = config.FRONTEND_DIST_DIR
    index = dist / "index.html"

    if (dist / "assets").is_dir():
        app.mount("/assets", ImmutableStaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        if not index.is_file():
            return HTMLResponse(_FRONTEND_MISSING, status_code=503)
        return FileResponse(index, headers={"Cache-Control": "no-cache"})

    @app.get("/{filename:path}", include_in_schema=False)
    async def serve_root_file(filename: str):
        """Root-level public files (icon.svg, manifest.json, ...). Never escapes ``dist``."""
        target = (dist / filename).resolve()
        if not (dist.resolve() in target.parents and target.is_file()):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(Path(target))


def create_app() -> FastAPI:
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    config.ensure_runtime_dirs()

    app = FastAPI(
        title="LensAI Video Explainer",
        description="AI watches a video, finds the key segment and expands the topic.",
        version=config.APP_VERSION,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for module in (system_controller, analysis_controller, chat_controller, media_controller):
        app.include_router(module.router)

    # Optional private extension (billing, credits, ...). No-op when it is not installed.
    # Must run before the SPA catch-all so the extension's own routes win.
    load_extensions(app)
    _mount_frontend(app)
    return app


app = create_app()
