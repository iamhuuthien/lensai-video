"""Streaming & Clean Direct Video Download (0 AI Cost)."""

import asyncio
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.core.config import LEGACY_CACHE_DIR, SAVED_VIDEOS_DIR
from backend.services.ai_service import SESSIONS
from backend.services.video_service import download_and_extract_video

router = APIRouter(prefix="/api", tags=["media"])

_VIDEO_SUFFIXES = (".mp4", ".webm", ".mkv", ".mov")


class CleanDownloadRequest(BaseModel):
    url: str


@router.get("/video/{session_id}")
async def stream_saved_video(session_id: str, download: bool = False) -> FileResponse:
    """Serve the saved file for a session from memory, ``saved_videos/`` or the legacy cache."""
    session = SESSIONS.get(session_id)
    video_path = None
    filename = f"{session_id}.mp4"

    if session and os.path.exists(session["video_info"].get("video_path", "")):
        video_path = session["video_info"]["video_path"]
        filename = session["video_info"].get("filename", f"{session_id}.mp4")
    else:
        matches = list(SAVED_VIDEOS_DIR.glob(f"*__{session_id}.*")) + list(SAVED_VIDEOS_DIR.glob(f"{session_id}.*"))
        if LEGACY_CACHE_DIR.exists():
            matches += list(LEGACY_CACHE_DIR.glob(f"*{session_id}.*"))
        videos = [m for m in matches if m.suffix.lower() in _VIDEO_SUFFIXES]
        if videos:
            video_path = str(videos[0])
            filename = Path(video_path).name

    if video_path and os.path.exists(video_path):
        headers = {}
        if download:
            headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        return FileResponse(video_path, media_type="video/mp4", headers=headers)

    raise HTTPException(status_code=404, detail="Không tìm thấy file video trong thư mục lưu trữ.")


@router.post("/clean-download")
async def clean_video_download(req: CleanDownloadRequest) -> dict:
    """
    Tải video gốc chất lượng cao không logo (TikTok, Reels, Shorts).
    Tính năng miễn phí 100%, không tốn token AI và không giới hạn credit.
    """
    url = (req.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Vui lòng nhập đường link video.")

    try:
        video_info = await asyncio.to_thread(download_and_extract_video, url)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Không thể tải video từ đường link này ({exc}). Hãy kiểm tra video có công khai hay không.",
        )

    session_id = video_info["session_id"]
    return {
        "status": "success",
        "session_id": session_id,
        "title": video_info["title"],
        "filename": video_info["filename"],
        "platform": video_info["platform"],
        "duration": video_info.get("duration", 0),
        "thumbnail": video_info.get("thumbnail", ""),
        "stream_url": f"/api/video/{session_id}",
        "download_url": f"/api/video/{session_id}?download=1",
        "message": "Đã tải video gốc không logo thành công!",
    }
