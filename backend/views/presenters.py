"""Response presenters (View layer): turn service results into the JSON the SPA consumes."""

import re
from typing import Any, Dict

from backend.models.schemas import AnalyzeRequest, ChatRequest


def analysis_view(result: Dict[str, Any], req: AnalyzeRequest) -> Dict[str, Any]:
    video = result["video_info"]
    ai = result["ai_result"]
    session_id = video["session_id"]
    return {
        "session_id": session_id,
        "model_used": ai["model_used"],
        "key_segment": ai["key_segment"],
        "video": {
            "url": video["url"],
            "filename": video["filename"],
            "saved_path": video["video_path"],
            "markdown_path": result["markdown_path"],
            "platform": video["platform"],
            "title": video["title"],
            "description": video["description"],
            "uploader": video["uploader"],
            "duration": video["duration"],
            "thumbnail": video["thumbnail"],
            "tags": video["tags"],
            "stream_url": f"/api/video/{session_id}",
        },
        "mode": req.mode,
        "explanation": ai["explanation"],
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
