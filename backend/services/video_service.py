import os
import re
import time
import uuid
import unicodedata
import logging
from pathlib import Path
from typing import Dict, Any, List
import yt_dlp

logger = logging.getLogger(__name__)

# Thư mục lưu trữ video kèm tên video + session_id để dễ dàng tìm lại
from backend.core.config import SAVED_VIDEOS_DIR, ensure_runtime_dirs

ensure_runtime_dirs()

# Giữ biến CACHE_DIR trỏ về SAVED_VIDEOS_DIR để tương thích ngược
CACHE_DIR = SAVED_VIDEOS_DIR


def sanitize_filename(title: str, max_length: int = 70) -> str:
    """
    Làm sạch tiêu đề video để đặt tên file an toàn, dễ đọc và dễ tìm kiếm trong thư mục.
    Ví dụ: 'Hướng dẫn làm AI tại nhà! #ai' -> 'Huong_dan_lam_AI_tai_nha_ai'
    """
    if not title:
        return "Video"
    # Chuyển chữ Đ/đ sang D/d và bỏ dấu tiếng Việt để tương thích mọi hệ điều hành (Linux/macOS/Windows/Cloud)
    text = title.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    # Chỉ giữ lại chữ cái, chữ số, khoảng trắng và dấu gạch ngang
    text = re.sub(r"[^\w\s-]", "", text).strip()
    text = re.sub(r"[\s_-]+", "_", text)
    text = text[:max_length].strip("_")
    return text or "Video"


def detect_platform(url: str) -> str:
    """Nhận diện nền tảng từ URL."""
    u = url.lower()
    if "tiktok.com" in u:
        return "TikTok"
    if "facebook.com" in u or "fb.watch" in u or "fb.com" in u:
        return "Facebook Reels"
    if "youtube.com" in u or "youtu.be" in u:
        return "YouTube Shorts"
    if "instagram.com" in u:
        return "Instagram Reels"
    return "Video"


def extract_url_from_text(raw_text: str) -> str:
    """
    Trích xuất URL thực sự khi người dùng copy từ nút Share của TikTok/Facebook
    (thường dính kèm caption hoặc chữ phía trước đường link).
    """
    raw_text = raw_text.strip()
    match = re.search(r"(https?://[^\s]+)", raw_text)
    if match:
        return match.group(1)
    return raw_text


def download_and_extract_video(raw_url: str) -> Dict[str, Any]:
    """
    Tải video và đổi tên file theo cấu trúc:
    <Ten_Video_Da_Lam_Sach>__<session_id>.mp4
    Lưu trực tiếp vào thư mục saved_videos/ để người dùng dễ tìm lại.
    """
    url = extract_url_from_text(raw_url)
    session_id = uuid.uuid4().hex[:10]
    temp_template = str(SAVED_VIDEOS_DIR / f"temp_{session_id}.%(ext)s")

    ydl_opts: Dict[str, Any] = {
        "format": (
            "best[height<=720][ext=mp4]/"
            "best[height<=480][ext=mp4]/"
            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/"
            "best[ext=mp4]/"
            "best"
        ),
        "merge_output_format": "mp4",
        "outtmpl": temp_template,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "geo_bypass": True,
        "socket_timeout": 25,
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            )
        },
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded_path = ydl.prepare_filename(info)
            if not os.path.exists(downloaded_path):
                matches = list(SAVED_VIDEOS_DIR.glob(f"temp_{session_id}.*"))
                if matches:
                    downloaded_path = str(matches[0])
                else:
                    raise FileNotFoundError("Không tìm thấy file video sau khi tải.")
    except Exception as first_err:
        logger.warning(f"Thử lại với User-Agent Desktop do lỗi đầu tiên: {first_err}")
        ydl_opts["http_headers"]["User-Agent"] = (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            downloaded_path = ydl.prepare_filename(info)
            if not os.path.exists(downloaded_path):
                matches = list(SAVED_VIDEOS_DIR.glob(f"temp_{session_id}.*"))
                if matches:
                    downloaded_path = str(matches[0])
                else:
                    raise FileNotFoundError("Không tìm thấy file video sau khi tải.")

    title = info.get("title") or info.get("description") or "Video_Khong_Tieu_De"
    # Lấy dòng đầu tiên nếu tiêu đề quá dài nhiều dòng
    first_line_title = title.strip().splitlines()[0] if title.strip() else "Video"
    clean_title = sanitize_filename(first_line_title)

    ext = Path(downloaded_path).suffix or ".mp4"
    final_filename = f"{clean_title}__{session_id}{ext}"
    final_path = SAVED_VIDEOS_DIR / final_filename

    try:
        os.replace(downloaded_path, final_path)
    except Exception as rename_err:
        logger.warning(f"Không thể đổi tên file {downloaded_path} -> {final_path}: {rename_err}")
        final_path = Path(downloaded_path)
        final_filename = final_path.name

    description = info.get("description") or ""
    uploader = info.get("uploader") or info.get("channel") or info.get("creator") or "Không rõ tác giả"
    duration = info.get("duration") or 0
    thumbnail = info.get("thumbnail") or ""
    webpage_url = info.get("webpage_url") or url
    platform = detect_platform(webpage_url)
    tags = info.get("tags") or []

    return {
        "session_id": session_id,
        "filename": final_filename,
        "video_path": str(final_path),
        "saved_dir": str(SAVED_VIDEOS_DIR),
        "url": webpage_url,
        "platform": platform,
        "title": first_line_title[:160],
        "description": description,
        "uploader": uploader,
        "duration": duration,
        "thumbnail": thumbnail,
        "tags": tags[:15] if isinstance(tags, list) else [],
    }


def save_analysis_markdown(video_info: Dict[str, Any], explanation: str, model_used: str) -> str:
    """
    Lưu thêm một file Markdown (.md) cùng tên với file video trong thư mục saved_videos/
    để người dùng khi mở thư mục có thể đọc lại ngay bài phân tích của video đó.
    """
    video_path = Path(video_info["video_path"])
    md_path = video_path.with_suffix(".md")
    content = (
        f"# 🎬 {video_info.get('title', 'Video')}\n\n"
        f"- **Mã phiên (Session ID):** `{video_info.get('session_id')}`\n"
        f"- **File video đã lưu:** `{video_info.get('filename')}`\n"
        f"- **Nền tảng:** {video_info.get('platform')} | **Tác giả:** {video_info.get('uploader')}\n"
        f"- **Link gốc:** {video_info.get('url')}\n"
        f"- **Model AI phân tích:** `{model_used}`\n\n"
        f"---\n\n"
        f"{explanation}\n"
    )
    try:
        md_path.write_text(content, encoding="utf-8")
    except Exception as e:
        logger.warning(f"Không thể lưu file markdown {md_path}: {e}")
    return str(md_path)
