import os
import re
import logging
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.video_service import (
    download_and_extract_video,
    save_analysis_markdown,
    SAVED_VIDEOS_DIR,
)
from backend.ai_service import analyze_video_with_ai, chat_about_video, SESSIONS

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("video-explainer")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="LensAI — Giải thích & Mở rộng Kiến thức Video (Pro)",
    description="Công cụ AI xem trực tiếp video, tìm đoạn hướng dẫn trọng tâm, lưu video theo tên + session và mở rộng kiến thức chuyên sâu.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    question: str
    api_key: Optional[str] = None


class ShortcutRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None


@app.get("/api/health")
async def health_check():
    """Kiểm tra trạng thái hệ thống và cấu hình API Key trên server."""
    has_server_key = bool(os.environ.get("GEMINI_API_KEY", "").strip())
    return {
        "status": "ok",
        "has_server_api_key": has_server_key,
        "saved_videos_dir": str(SAVED_VIDEOS_DIR),
    }


@app.get("/api/saved")
async def list_saved_videos():
    """Liệt kê tất cả video đã lưu trong thư mục saved_videos/ kèm tên file và session_id."""
    items = []
    for mp4_file in sorted(SAVED_VIDEOS_DIR.glob("*.mp4"), key=lambda p: p.stat().st_mtime, reverse=True):
        stem = mp4_file.stem
        if "__" in stem:
            title_part, sess_id = stem.rsplit("__", 1)
        else:
            title_part, sess_id = stem, stem
        md_file = mp4_file.with_suffix(".md")
        items.append({
            "filename": mp4_file.name,
            "session_id": sess_id,
            "title_slug": title_part,
            "size_mb": round(mp4_file.stat().st_size / (1024 * 1024), 2),
            "stream_url": f"/api/video/{sess_id}",
            "has_markdown": md_file.exists(),
        })
    return {"saved_dir": str(SAVED_VIDEOS_DIR), "videos": items[:30]}


@app.post("/api/analyze")
async def api_analyze_video(req: AnalyzeRequest):
    """
    1. Tải video và lưu vào saved_videos/<Ten_Video>__<session_id>.mp4
    2. Dùng Gemini Pro tìm đoạn hướng dẫn trọng tâm [MM:SS - MM:SS] & mở rộng phân tích chuyên sâu
    3. Lưu kèm file bài phân tích .md cùng tên trong thư mục saved_videos/
    """
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập đường link video hợp lệ.")

    try:
        logger.info(f"Đang tải và lưu video từ URL: {req.url}")
        video_info = download_and_extract_video(req.url)
    except Exception as e:
        logger.error(f"Lỗi khi tải video: {e}")
        raise HTTPException(
            status_code=422,
            detail=(
                f"Không thể tải video từ đường link này ({str(e)}). "
                "Hãy kiểm tra xem video có ở chế độ Công khai (Public) hay không."
            ),
        )

    try:
        logger.info(
            f"Đã lưu file '{video_info['filename']}'. Đang gửi sang Gemini (ưu tiên Pro) phân tích..."
        )
        ai_result = analyze_video_with_ai(
            video_info=video_info,
            mode=req.mode,
            custom_prompt=req.prompt,
            api_key=req.api_key,
        )
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        logger.error(f"Lỗi khi gọi AI phân tích: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi phân tích bằng AI: {str(e)}")

    explanation = ai_result["explanation"]
    key_segment = ai_result["key_segment"]
    model_used = ai_result["model_used"]

    # Lưu kèm file Markdown phân tích chung với file video trong saved_videos/
    md_path = save_analysis_markdown(video_info, explanation, model_used)

    session_id = video_info["session_id"]
    return {
        "session_id": session_id,
        "model_used": model_used,
        "key_segment": key_segment,
        "video": {
            "url": video_info["url"],
            "filename": video_info["filename"],
            "saved_path": video_info["video_path"],
            "markdown_path": md_path,
            "platform": video_info["platform"],
            "title": video_info["title"],
            "description": video_info["description"],
            "uploader": video_info["uploader"],
            "duration": video_info["duration"],
            "thumbnail": video_info["thumbnail"],
            "tags": video_info["tags"],
            "stream_url": f"/api/video/{session_id}",
        },
        "mode": req.mode,
        "explanation": explanation,
    }


@app.post("/api/chat")
async def api_chat_video(req: ChatRequest):
    """Hỏi thêm các câu hỏi hoặc yêu cầu mở rộng sâu hơn về chủ đề của video."""
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập câu hỏi.")

    try:
        chat_res = chat_about_video(
            session_id=req.session_id,
            question=req.question,
            api_key=req.api_key,
        )
        return {
            "session_id": req.session_id,
            "question": req.question,
            "answer": chat_res["answer"],
            "model_used": chat_res["model_used"],
        }
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        logger.error(f"Lỗi khi chat về video: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi trả lời câu hỏi: {str(e)}")


@app.post("/api/shortcut")
async def api_ios_shortcut(req: ShortcutRequest):
    """Endpoint tối ưu sẵn cho Apple Shortcuts (Phím tắt iOS trên Share Sheet)."""
    result = await api_analyze_video(
        AnalyzeRequest(
            url=req.url,
            mode=req.mode,
            prompt=req.prompt,
            api_key=req.api_key,
        )
    )
    explanation_md = result["explanation"]
    plain_text = re.sub(r"#{1,6}\s*", "", explanation_md)
    plain_text = re.sub(r"\*\*(.*?)\*\*", r"\1", plain_text)

    seg = result.get("key_segment")
    seg_header = ""
    if seg:
        seg_header = f"🎯 Đoạn trọng tâm: [{seg['start_time']} - {seg['end_time']}] {seg['summary']}\n\n"

    return {
        "session_id": result["session_id"],
        "filename": result["video"]["filename"],
        "model_used": result["model_used"],
        "title": result["video"]["title"],
        "platform": result["video"]["platform"],
        "uploader": result["video"]["uploader"],
        "key_segment": seg,
        "explanation_markdown": explanation_md,
        "plain_text": f"🎬 {result['video']['title']} ({result['video']['platform']})\n{seg_header}{plain_text}",
    }


@app.get("/api/video/{session_id}")
async def stream_saved_video(session_id: str):
    """Phát trực tiếp file video đã lưu trong saved_videos/ hoặc cache/ theo session_id."""
    session = SESSIONS.get(session_id)
    if session and os.path.exists(session["video_info"]["video_path"]):
        return FileResponse(session["video_info"]["video_path"], media_type="video/mp4")

    legacy_cache_dir = BASE_DIR / "cache"
    matches = (
        list(SAVED_VIDEOS_DIR.glob(f"*__{session_id}.*"))
        + list(SAVED_VIDEOS_DIR.glob(f"{session_id}.*"))
        + (list(legacy_cache_dir.glob(f"*{session_id}.*")) if legacy_cache_dir.exists() else [])
    )
    mp4_matches = [m for m in matches if m.suffix.lower() in (".mp4", ".webm", ".mkv", ".mov")]
    if mp4_matches:
        return FileResponse(str(mp4_matches[0]), media_type="video/mp4")

    raise HTTPException(status_code=404, detail="Không tìm thấy file video trong thư mục lưu trữ.")


@app.get("/")
async def serve_index():
    """Trả về trang chủ Web App (PWA)."""
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
