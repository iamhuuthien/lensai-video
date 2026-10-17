import os
import re
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Bộ nhớ đệm phiên làm việc
SESSIONS: Dict[str, Dict[str, Any]] = {}

# Ưu tiên các dòng Model PRO mạnh nhất trước để phân tích sâu, sau đó mới fallback sang Flash
PRIORITY_PRO_MODELS: List[str] = [
    "gemini-3.8-pro",
    "gemini-3.8-pro-preview",
    "gemini-3.5-pro",
    "gemini-3.0-pro",
    "gemini-2.5-pro",
]

FALLBACK_FLASH_MODELS: List[str] = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.0-flash",
]

_CACHED_AVAILABLE_MODELS: List[str] = []

KEY_SEGMENT_INSTRUCTION = """
QUAN TRỌNG: Ngay dòng đầu tiên của câu trả lời, bạn BẮT BUỘC phải xuất ra 1 dòng đánh dấu đoạn thời gian giá trị nhất trong video (nơi tác giả thực sự hướng dẫn hoặc đi vào trọng tâm của tiêu đề, bỏ qua phần mở đầu câu giờ) theo đúng định dạng sau:
[KEY_SEGMENT: MM:SS - MM:SS | Mô tả ngắn gọn 1 câu về nội dung hướng dẫn quan trọng nhất ở đoạn này]
Ví dụ:
[KEY_SEGMENT: 00:12 - 00:45 | Hướng dẫn trực tiếp 3 bước cài đặt công cụ và cấu hình thông số chính]
"""

MODE_PROMPTS: Dict[str, str] = {
    "explain": KEY_SEGMENT_INSTRUCTION + """
Hãy xem kỹ cả HÌNH ẢNH (hành động, thao tác trên màn hình, chữ chèn trên video) lẫn ÂM THANH (lời thoại) và phân tích chuyên sâu bằng tiếng Việt theo cấu trúc:

### 🎯 1. Đoạn hướng dẫn trọng tâm & Tóm tắt cốt lõi
- Chỉ rõ ở mốc thời gian `[MM:SS - MM:SS]` nào tác giả bắt đầu đi vào hướng dẫn chính của tiêu đề và tóm tắt nhanh nội dung cốt lõi trong 2–3 câu.

### 🛠️ 2. Phân tích chi tiết từng bước / Diễn biến trong Video
- Trích xuất đầy đủ các bước hướng dẫn, công cụ, câu lệnh, tên phần mềm hoặc hành động xuất hiện trên hình ảnh và lời nói (kèm mốc thời gian `[MM:SS]`).
- Ghi chú lại toàn bộ chữ quan trọng xuất hiện trên màn hình (OCR).

### 💡 3. Giải thích Ý nghĩa & Đánh giá tính hiệu quả
- Cách làm hoặc nội dung trong video giải quyết vấn đề gì? Có điểm nào hay hoặc điểm nào video đang nói lướt/phóng đại không?

### 🧠 4. AI Mở rộng & Phân tích chuyên sâu về Chủ đề (Deep-Dive Expansion)
- **Bản chất & Nguyên lý:** Giải thích sâu hơn về chủ đề/công nghệ/mẹo được nhắc tới trong tiêu đề video.
- **Bổ sung phần bị thiếu trong video ngắn:** Các bước chi tiết, lưu ý thực tế, hoặc các công cụ/phương pháp thay thế tốt hơn mà video ngắn chưa kịp nói tới để người xem có thể áp dụng trọn vẹn 100%.""",

    "transcript": KEY_SEGMENT_INSTRUCTION + """
Hãy nghe kỹ âm thanh và quan sát toàn bộ chữ xuất hiện trên màn hình (on-screen text/captions) trong video này, sau đó trình bày bằng tiếng Việt:

### 📝 1. Lời thoại & Phụ đề theo dòng thời gian
- Ghi lại lời nói trong video kèm mốc thời gian `[MM:SS]` (nếu là tiếng nước ngoài, hãy ghi câu gốc kèm bản dịch tiếng Việt tự nhiên).

### 🔤 2. Chữ xuất hiện trên màn hình (On-screen Text / OCR)
- Liệt kê và dịch (nếu cần) các dòng chữ, tên công cụ, đường link hoặc ghi chú quan trọng hiển thị trong khung hình.

### 🧠 3. AI Mở rộng kiến thức từ nội dung lời thoại
- Giải thích sâu hơn các thuật ngữ hoặc chủ đề được nhắc tới trong lời thoại.""",

    "meme": KEY_SEGMENT_INSTRUCTION + """
Hãy đóng vai một chuyên gia phân tích nội dung mạng xã hội để giải thích video này bằng tiếng Việt:

### 😂 1. Khoảnh khắc đắt giá nhất (`[MM:SS]`)
- Chỉ ra chính xác khoảnh khắc, câu nói hoặc biểu cảm nào tạo nên điểm nhấn / sự hài hước / bất ngờ (plot twist) trong video.

### 🌐 2. Nguồn gốc Trend / Meme & Mở rộng Ngữ cảnh
- Video này đang bắt trend gì, nhại lại tình huống nào, hay phản ánh hiện tượng gì?
- Mở rộng phân tích về trào lưu hoặc chủ đề liên quan để người xem hiểu sâu toàn bộ câu chuyện.""",

    "factcheck": KEY_SEGMENT_INSTRUCTION + """
Hãy phân tích chuyên sâu, kiểm chứng và mở rộng kiến thức về chủ đề trong video này bằng tiếng Việt:

### 🔍 1. Các luận điểm / Hướng dẫn được đưa ra trong video (`[MM:SS]`)
- Liệt kê các thông tin, hướng dẫn, mẹo vặt hoặc khẳng định xuất hiện trong video.

### ⚖️ 2. Kiểm chứng độ chính xác (Fact-check)
- Phân tích xem hướng dẫn/thông tin trong video có thực sự hiệu quả và chính xác không? Có rủi ro hay hạn chế nào bị ẩn đi không?

### 🧠 3. AI Mở rộng Kiến thức Chuyên sâu & Giải pháp Chuẩn xác nhất
- Cung cấp kiến thức chuẩn xác, toàn diện và hướng dẫn thực hành tốt nhất (Best Practices) về chủ đề của video.""",
}


def get_genai_client(api_key: Optional[str] = None) -> genai.Client:
    """Khởi tạo Gemini Client từ API key truyền vào hoặc biến môi trường."""
    key = (api_key or os.environ.get("GEMINI_API_KEY") or "").strip()
    if not key:
        raise ValueError(
            "Chưa có GEMINI_API_KEY. Vui lòng nhập Gemini API Key trong phần Cài đặt (⚙️ API Key) "
            "hoặc thiết lập biến môi trường GEMINI_API_KEY."
        )
    return genai.Client(api_key=key)


def _discover_ranked_models(client: genai.Client) -> List[str]:
    """
    Lấy danh sách model khả dụng từ tài khoản Gemini API và sắp xếp ưu tiên:
    1. Các model dòng PRO mới nhất (VD: gemini-3.8-pro, gemini-3.5-pro...) để phân tích sâu nhất.
    2. Các model dòng FLASH mới nhất (VD: gemini-3.8-flash) làm dự phòng tốc độ cao.
    """
    global _CACHED_AVAILABLE_MODELS
    if _CACHED_AVAILABLE_MODELS:
        return _CACHED_AVAILABLE_MODELS

    pro_models: List[str] = []
    flash_models: List[str] = []

    try:
        for m in client.models.list():
            name = (getattr(m, "name", "") or "").replace("models/", "")
            low = name.lower()
            if not low.startswith("gemini"):
                continue
            if any(skip in low for skip in ["tts", "image", "embedding", "aqa", "vision-latest", "1.0", "1.5", "2.0", "2.5"]):
                continue
            if "pro" in low:
                pro_models.append(name)
            elif "flash" in low and "lite" not in low:
                flash_models.append(name)
    except Exception as e:
        logger.warning(f"Không thể liệt kê danh sách model từ API: {e}")

    # Sắp xếp giảm dần theo tên phiên bản để bản mới nhất (3.8 > 3.5 > 3.0) đứng đầu
    pro_models.sort(reverse=True)
    flash_models.sort(reverse=True)

    combined: List[str] = []
    for candidate in pro_models + PRIORITY_PRO_MODELS + flash_models + FALLBACK_FLASH_MODELS:
        if candidate not in combined:
            combined.append(candidate)

    _CACHED_AVAILABLE_MODELS = combined
    logger.info(f"Danh sách thứ tự ưu tiên Model AI (Ưu tiên PRO): {_CACHED_AVAILABLE_MODELS[:6]}")
    return _CACHED_AVAILABLE_MODELS


def _parse_mmss_to_seconds(ts: str) -> int:
    """Chuyển chuỗi MM:SS hoặc HH:MM:SS thành tổng số giây."""
    parts = [int(p) for p in ts.strip().split(":") if p.strip().isdigit()]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0


def extract_key_segment(raw_text: str) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Tách dòng [KEY_SEGMENT: MM:SS - MM:SS | Tóm tắt] ra khỏi văn bản trả về của AI
    để tạo dữ liệu tua nhanh video tới đúng đoạn hướng dẫn quan trọng nhất.
    """
    pattern = r"\[KEY_SEGMENT:\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*\|\s*(.*?)\]"
    match = re.search(pattern, raw_text)
    if not match:
        return None, raw_text.strip()

    start_str = match.group(1).strip()
    end_str = match.group(2).strip()
    summary = match.group(3).strip()

    cleaned_text = re.sub(pattern, "", raw_text, count=1).strip()
    segment_info = {
        "start_time": start_str,
        "end_time": end_str,
        "start_seconds": _parse_mmss_to_seconds(start_str),
        "end_seconds": _parse_mmss_to_seconds(end_str),
        "summary": summary,
    }
    return segment_info, cleaned_text


def _build_metadata_context(video_info: Dict[str, Any]) -> str:
    """Tạo chuỗi thông tin ngữ cảnh từ metadata của video."""
    parts = [
        f"- Nền tảng: {video_info.get('platform', 'Video')}",
        f"- Kênh / Tác giả: {video_info.get('uploader', 'Không rõ')}",
        f"- Tiêu đề chính của video: {video_info.get('title', '')}",
        f"- Tên file đã lưu: {video_info.get('filename', '')}",
    ]
    desc = video_info.get("description", "").strip()
    if desc and desc != video_info.get("title", "").strip():
        parts.append(f"- Mô tả / Caption đầy đủ: {desc[:1200]}")
    tags = video_info.get("tags", [])
    if tags:
        parts.append(f"- Hashtags / Tags: {', '.join(str(t) for t in tags[:15])}")
    duration = video_info.get("duration")
    if duration:
        parts.append(f"- Thời lượng tổng: {duration} giây")
    return "\n".join(parts)


def _create_video_part(client: genai.Client, video_path: str) -> Any:
    """Tạo đối tượng Part chứa video cho Gemini."""
    file_size = os.path.getsize(video_path)
    if file_size <= 18 * 1024 * 1024:
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        return types.Part.from_bytes(data=video_bytes, mime_type="video/mp4")

    uploaded_file = client.files.upload(file=video_path)
    max_wait = 45
    waited = 0
    while uploaded_file.state.name == "PROCESSING" and waited < max_wait:
        time.sleep(2)
        waited += 2
        uploaded_file = client.files.get(name=uploaded_file.name)
    return uploaded_file


def _generate_with_best_model(
    client: genai.Client,
    contents: List[Any],
    system_instruction: str,
) -> Tuple[str, str]:
    """
    Ưu tiên gọi Model PRO mạnh nhất hiện có để phân tích sâu.
    Trả về (response_text, model_used).
    """
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.35,
    )
    ranked_models = _discover_ranked_models(client)

    last_err: Optional[Exception] = None
    for model_name in ranked_models:
        try:
            logger.info(f"Đang phân tích video với model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config,
            )
            text = response.text or "Không nhận được phản hồi từ AI."
            return text, model_name
        except Exception as err:
            last_err = err
            logger.warning(f"Model {model_name} không khả dụng ({err}), tự động chuyển sang model tiếp theo...")

    if last_err:
        raise last_err
    raise RuntimeError("Không tìm thấy model Gemini khả dụng.")


def analyze_video_with_ai(
    video_info: Dict[str, Any],
    mode: str = "explain",
    custom_prompt: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Phân tích video bằng model Gemini mạnh nhất (ưu tiên dòng Pro),
    xác định đoạn thời gian hướng dẫn trọng tâm khớp với tiêu đề nhất,
    và tự động mở rộng kiến thức chuyên sâu về chủ đề đó.
    """
    client = get_genai_client(api_key)
    video_path = video_info["video_path"]
    session_id = video_info["session_id"]

    video_part = _create_video_part(client, video_path)
    metadata_text = _build_metadata_context(video_info)

    base_instruction = MODE_PROMPTS.get(mode, MODE_PROMPTS["explain"])
    if custom_prompt and custom_prompt.strip():
        user_task = (
            f"{base_instruction}\n\n"
            f"👉 **Yêu cầu cụ thể từ người xem:** {custom_prompt.strip()}"
        )
    else:
        user_task = base_instruction

    prompt_text = (
        f"Dưới đây là thông tin metadata của video:\n{metadata_text}\n\n"
        f"{user_task}"
    )

    system_instruction = (
        "Bạn là Chuyên gia Phân tích Video & Mở rộng Kiến thức hàng đầu. "
        "Nhiệm vụ của bạn gồm 3 phần cốt lõi: "
        "(1) Quan sát từng khung hình, đọc chữ trên video và nghe lời thoại để tìm ra CHÍNH XÁC khoảng thời gian [MM:SS - MM:SS] "
        "mà video hướng dẫn hoặc giải quyết trực tiếp chủ đề ở tiêu đề (bỏ qua phần intro câu giờ). "
        "(2) Giải thích chi tiết, rõ ràng toàn bộ nội dung trong video kèm mốc thời gian [MM:SS]. "
        "(3) Tự động MỞ RỘNG phân tích chuyên sâu về chủ đề của video (bổ sung nguyên lý, các bước chi tiết bị lược bỏ, "
        "công cụ liên quan và kinh nghiệm thực tế) để mang lại giá trị cao nhất cho người xem."
    )

    raw_explanation, model_used = _generate_with_best_model(
        client=client,
        contents=[video_part, prompt_text],
        system_instruction=system_instruction,
    )

    key_segment, cleaned_explanation = extract_key_segment(raw_explanation)

    SESSIONS[session_id] = {
        "video_info": video_info,
        "metadata_text": metadata_text,
        "model_used": model_used,
        "key_segment": key_segment,
        "explanation": cleaned_explanation,
        "history": [
            {"role": "user", "text": custom_prompt or f"Phân tích chuyên sâu & mở rộng ({mode})"},
            {"role": "assistant", "text": cleaned_explanation},
        ],
        "created_at": time.time(),
    }

    return {
        "explanation": cleaned_explanation,
        "key_segment": key_segment,
        "model_used": model_used,
    }


def _restore_session_from_disk(session_id: str) -> Optional[Dict[str, Any]]:
    """Tự động khôi phục phiên từ file video và markdown đã lưu trên ổ cứng nếu server vừa khởi động lại."""
    from pathlib import Path
    base_dir = Path(__file__).resolve().parent.parent
    search_dirs = [base_dir / "saved_videos", base_dir / "cache"]

    for folder in search_dirs:
        if not folder.exists():
            continue
        matches = list(folder.glob(f"*__{session_id}.*")) + list(folder.glob(f"{session_id}.*"))
        video_files = [m for m in matches if m.suffix.lower() in (".mp4", ".webm", ".mkv", ".mov")]
        if video_files:
            vfile = video_files[0]
            md_file = vfile.with_suffix(".md")
            prev_explanation = ""
            if md_file.exists():
                try:
                    prev_explanation = md_file.read_text(encoding="utf-8")
                except Exception:
                    pass
            restored = {
                "video_info": {
                    "session_id": session_id,
                    "filename": vfile.name,
                    "video_path": str(vfile),
                    "title": vfile.stem.split("__")[0].replace("_", " "),
                },
                "metadata_text": f"- Tên file video đã lưu: {vfile.name}",
                "history": (
                    [{"role": "assistant", "text": prev_explanation}] if prev_explanation else []
                ),
                "created_at": time.time(),
            }
            SESSIONS[session_id] = restored
            return restored
    return None


def chat_about_video(
    session_id: str,
    question: str,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Trả lời câu hỏi tiếp theo của người dùng về video hoặc mở rộng sâu hơn về chủ đề."""
    session = SESSIONS.get(session_id) or _restore_session_from_disk(session_id)
    if not session:
        raise KeyError("Phiên làm việc không tồn tại. Vui lòng bấm phân tích lại video.")

    client = get_genai_client(api_key)
    video_info = session["video_info"]
    video_path = video_info["video_path"]

    contents: List[Any] = []
    if os.path.exists(video_path):
        video_part = _create_video_part(client, video_path)
        contents.append(video_part)

    history_lines = []
    for turn in session["history"][-6:]:
        role_label = "Người xem" if turn["role"] == "user" else "AI"
        history_lines.append(f"**{role_label}:** {turn['text']}")
    history_context = "\n\n".join(history_lines)

    prompt_text = (
        f"Thông tin video:\n{session['metadata_text']}\n\n"
        f"Lịch sử trao đổi trước đó:\n{history_context}\n\n"
        f"Câu hỏi / Yêu cầu mới của người xem: **{question.strip()}**\n"
        f"Hãy trả lời thật sâu sắc, chi tiết (kèm mốc thời gian [MM:SS] nếu liên quan tới cảnh trong video) và mở rộng thêm kiến thức hữu ích."
    )
    contents.append(prompt_text)

    system_instruction = (
        "Bạn là Chuyên gia AI đang trao đổi chuyên sâu với người xem về một video và chủ đề liên quan. "
        "Hãy kết hợp quan sát trực tiếp trong video với kiến thức chuyên môn sâu rộng của bạn để trả lời bằng tiếng Việt."
    )

    answer, model_used = _generate_with_best_model(
        client=client,
        contents=contents,
        system_instruction=system_instruction,
    )

    session["history"].append({"role": "user", "text": question.strip()})
    session["history"].append({"role": "assistant", "text": answer})
    return {
        "answer": answer,
        "model_used": model_used,
    }
