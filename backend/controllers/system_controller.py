"""Health, feature discovery and the optional saved-video listing."""

from fastapi import APIRouter, HTTPException

from backend.core import config
from backend.core.extensions import extensions

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "version": config.APP_VERSION,
        "has_server_api_key": config.has_server_api_key(),
    }


@router.get("/models")
async def list_models() -> dict:
    """Trả về danh mục AI model được hỗ trợ chính thức, phân tầng theo gói dịch vụ."""
    from backend.services.ai_service import SUPPORTED_MODELS
    return {
        "status": "ok",
        "models": SUPPORTED_MODELS,
        "default_free": "gemini-2.5-flash",
        "default_vip": "gemini-2.5-pro",
    }


@router.get("/features")
async def get_features() -> dict:
    """Tells the SPA which extensions are active (community mode reports ``pro: false``)."""
    return extensions.public_features()


@router.get("/saved")
async def list_saved_videos() -> dict:
    """List saved videos. Disabled by default: on a shared server it would expose everyone's files."""
    if not config.saved_listing_enabled():
        raise HTTPException(status_code=404, detail="Not found")

    items = []
    files = sorted(config.SAVED_VIDEOS_DIR.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True)
    for video in files:
        title_part, _, session_id = video.stem.rpartition("__")
        if not title_part:
            title_part = session_id = video.stem
        items.append({
            "filename": video.name,
            "session_id": session_id,
            "title_slug": title_part,
            "size_mb": round(video.stat().st_size / (1024 * 1024), 2),
            "stream_url": f"/api/video/{session_id}",
            "has_markdown": video.with_suffix(".md").exists(),
        })
    return {"saved_dir": str(config.SAVED_VIDEOS_DIR), "videos": items[:30]}
