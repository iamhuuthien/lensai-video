"""Streaming of saved videos."""

import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.core.config import LEGACY_CACHE_DIR, SAVED_VIDEOS_DIR
from backend.services.ai_service import SESSIONS

router = APIRouter(prefix="/api", tags=["media"])

_VIDEO_SUFFIXES = (".mp4", ".webm", ".mkv", ".mov")


@router.get("/video/{session_id}")
async def stream_saved_video(session_id: str) -> FileResponse:
    """Serve the saved file for a session from memory, ``saved_videos/`` or the legacy cache."""
    session = SESSIONS.get(session_id)
    if session and os.path.exists(session["video_info"]["video_path"]):
        return FileResponse(session["video_info"]["video_path"], media_type="video/mp4")

    matches = list(SAVED_VIDEOS_DIR.glob(f"*__{session_id}.*")) + list(SAVED_VIDEOS_DIR.glob(f"{session_id}.*"))
    if LEGACY_CACHE_DIR.exists():
        matches += list(LEGACY_CACHE_DIR.glob(f"*{session_id}.*"))

    videos = [m for m in matches if m.suffix.lower() in _VIDEO_SUFFIXES]
    if videos:
        return FileResponse(str(videos[0]), media_type="video/mp4")

    raise HTTPException(status_code=404, detail="Không tìm thấy file video trong thư mục lưu trữ.")
