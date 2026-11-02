"""Response presenters (View layer): turn service results into the JSON the SPA consumes."""

import re
from typing import Any, Dict, List

from backend.models.schemas import AnalyzeRequest, ChatRequest


def _mmss_to_seconds(ts: str) -> int:
    parts = [int(p) for p in ts.strip().split(":") if p.strip().isdigit()]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0


def _extract_bento_fields(markdown: str, title: str = "Video") -> Dict[str, Any]:
    """Parse markdown explanation into structured Bento Grid fields for the React SPA."""
    text = (markdown or "").strip()
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    # 1. Chapters: lines containing [MM:SS] or MM:SS
    chapters: List[Dict[str, Any]] = []
    seen_times = set()
    ts_pattern = re.compile(r"\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?(?:\s*-\s*\d{1,2}:\d{2}(?::\d{2})?)?\s*[:\-–—]?\s*(.+)")
    for ln in lines:
        clean_ln = re.sub(r"^[-*•\d.)+\s]+", "", ln)
        m = ts_pattern.search(clean_ln)
        if m:
            t_str = m.group(1)
            desc = re.sub(r"\*\*(.*?)\*\*", r"\1", m.group(2)).strip(" -–—:*")
            if t_str not in seen_times and len(desc) > 3:
                seen_times.add(t_str)
                chapters.append({
                    "time": t_str,
                    "seconds": _mmss_to_seconds(t_str),
                    "title": desc[:90],
                    "summary": desc if len(desc) > 90 else "",
                })
    if not chapters:
        chapters = [
            {"time": "00:00", "seconds": 0, "title": "Mở đầu & Đặt vấn đề (Hook)", "summary": "Thu hút sự chú ý 3 giây đầu"},
            {"time": "00:05", "seconds": 5, "title": "Nội dung hướng dẫn trọng tâm", "summary": title},
            {"time": "00:20", "seconds": 20, "title": "Tổng kết & Lời kêu gọi hành động (CTA)", "summary": "Chốt thông điệp cốt lõi"},
        ]

    # 2. Headings -> Mindmap nodes
    headings: List[str] = []
    for ln in lines:
        if ln.startswith("#"):
            h = re.sub(r"^#+\s*", "", ln).strip()
            h = re.sub(r"\*\*(.*?)\*\*", r"\1", h)
            if h:
                headings.append(h[:60])
    mindmap = headings if headings else [
        f"Chủ đề: {title[:40]}",
        "Hook 3 giây đầu",
        "Luận điểm cốt lõi",
        "Công cụ & Quy trình",
        "Ứng dụng thực tế",
    ]

    # 3. Bullet items -> Takeaways & Action items
    bullets: List[str] = []
    for ln in lines:
        if ln.startswith(("- ", "* ", "• ")) or re.match(r"^\d+\.\s+", ln):
            b = re.sub(r"^([-*•]|\d+\.)\s+", "", ln)
            b = re.sub(r"\*\*(.*?)\*\*", r"\1", b).strip()
            if len(b) > 10:
                bullets.append(b)

    takeaways = bullets[:4] if bullets else [
        "Đi thẳng vào giải pháp thực tế ngay từ những giây đầu tiên.",
        "Kết hợp hình ảnh trực quan và chữ chèn trên màn hình (OCR) để giữ chân người xem.",
    ]
    action_items = bullets[4:8] if len(bullets) > 4 else (bullets[:3] if bullets else [
        "Áp dụng cấu trúc Hook 3 giây đầu cho video cùng chủ đề.",
        "Xuất phụ đề .SRT chuẩn nhịp độ cho CapCut Studio.",
    ])

    # 4. Executive Summary: first meaningful paragraphs
    paragraphs = [
        re.sub(r"\*\*(.*?)\*\*", r"\1", ln)
        for ln in lines
        if not ln.startswith("#") and len(ln) > 20
    ]
    summary = "\n\n".join(paragraphs[:4]) if paragraphs else text

    return {
        "summary": summary,
        "chapters": chapters[:8],
        "takeaways": takeaways,
        "action_items": action_items,
        "mindmap": mindmap[:8],
        "raw_markdown": text,
    }


def analysis_view(result: Dict[str, Any], req: AnalyzeRequest) -> Dict[str, Any]:
    video = result["video_info"]
    ai = result["ai_result"]
    session_id = video["session_id"]
    explanation = ai["explanation"]

    raw_seg = ai.get("key_segment")
    key_segment = None
    if raw_seg:
        reason = raw_seg.get("reason") or raw_seg.get("summary") or "Đoạn nội dung trọng tâm giá trị nhất trong video."
        key_segment = {
            **raw_seg,
            "summary": raw_seg.get("summary") or reason,
            "reason": reason,
            "title": raw_seg.get("title") or "Đoạn hướng dẫn trọng tâm",
        }

    video_payload = {
        "url": video["url"],
        "filename": video["filename"],
        "saved_path": video["video_path"],
        "video_path": video["video_path"],
        "markdown_path": result["markdown_path"],
        "platform": video["platform"],
        "title": video["title"],
        "description": video["description"],
        "uploader": video["uploader"],
        "author": video["uploader"],
        "duration": video["duration"],
        "thumbnail": video["thumbnail"],
        "tags": video["tags"],
        "stream_url": f"/api/video/{session_id}",
    }

    bento = _extract_bento_fields(explanation, title=video.get("title", "Video"))

    return {
        "session_id": session_id,
        "model_used": ai["model_used"],
        "key_segment": key_segment,
        "video": video_payload,
        "video_info": video_payload,
        "mode": req.mode,
        "explanation": explanation,
        **bento,
    }


def chat_view(chat_result: Dict[str, Any], req: ChatRequest) -> Dict[str, Any]:
    return {
        "session_id": req.session_id,
        "question": req.question,
        "answer": chat_result["answer"],
        "model_used": chat_result["model_used"],
    }


def shortcut_view(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Compact payload for Apple Shortcuts, including a markdown-free ``plain_text``."""
    markdown = analysis["explanation"]
    plain = re.sub(r"#{1,6}\s*", "", markdown)
    plain = re.sub(r"\*\*(.*?)\*\*", r"\1", plain)

    segment = analysis.get("key_segment")
    segment_line = ""
    if segment:
        segment_line = f"Đoạn trọng tâm: [{segment['start_time']} - {segment['end_time']}] {segment['summary']}\n\n"

    video = analysis["video"]
    return {
        "session_id": analysis["session_id"],
        "filename": video["filename"],
        "model_used": analysis["model_used"],
        "title": video["title"],
        "platform": video["platform"],
        "uploader": video["uploader"],
        "key_segment": segment,
        "explanation_markdown": markdown,
        "plain_text": f"{video['title']} ({video['platform']})\n{segment_line}{plain}",
    }
