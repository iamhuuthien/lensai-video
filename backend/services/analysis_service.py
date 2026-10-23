"""Business logic for analysing and chatting about a video (Service layer)."""

import asyncio
import logging
from typing import Any, Dict

from fastapi import HTTPException

from backend.models.schemas import AnalyzeRequest, ChatRequest
from backend.services.ai_service import analyze_video_with_ai, chat_about_video
from backend.services.video_service import download_and_extract_video, save_analysis_markdown

logger = logging.getLogger("video-explainer.analysis")


async def run_analysis(req: AnalyzeRequest) -> Dict[str, Any]:
    """Download the video, run Gemini on it, persist the markdown next to the file.

    Blocking calls (yt-dlp, Gemini) run in worker threads so the event loop stays free.
    """
    try:
        logger.info("Downloading video: %s", req.url)
        video_info = await asyncio.to_thread(download_and_extract_video, req.url)
    except Exception as exc:
        logger.error("Download failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail=(
                f"Không thể tải video từ đường link này ({exc}). "
                "Hãy kiểm tra xem video có ở chế độ Công khai (Public) hay không."
            ),
        )

    try:
        ai_result = await asyncio.to_thread(
            analyze_video_with_ai,
            video_info=video_info,
            mode=req.mode,
            custom_prompt=req.prompt,
            api_key=req.api_key,
            model=req.model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        logger.error("AI analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích bằng AI: {exc}")

    markdown_path = save_analysis_markdown(video_info, ai_result["explanation"], ai_result["model_used"])
    return {"video_info": video_info, "ai_result": ai_result, "markdown_path": markdown_path}


async def run_chat(req: ChatRequest) -> Dict[str, Any]:
    try:
        return await asyncio.to_thread(
            chat_about_video,
            session_id=req.session_id,
            question=req.question,
            api_key=req.api_key,
            context_fallback=req.context_fallback,
            model=req.model,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except Exception as exc:
        logger.error("Chat failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Lỗi khi trả lời câu hỏi: {exc}")
