from backend.services.video_service import detect_platform, extract_url_from_text, sanitize_filename
from backend.views.presenters import shortcut_view


def test_sanitize_filename_strips_diacritics_and_symbols():
    assert sanitize_filename("Hướng dẫn làm AI tại nhà! #ai") == "Huong_dan_lam_AI_tai_nha_ai"
    assert sanitize_filename("") == "Video"


def test_detect_platform():
    assert detect_platform("https://vm.tiktok.com/abc") == "TikTok"
    assert detect_platform("https://youtu.be/xyz") == "YouTube Shorts"
    assert detect_platform("https://example.com") == "Video"


def test_extract_url_from_shared_text():
    assert extract_url_from_text("Xem này nhé https://vt.tiktok.com/ZS1/ hay lắm") == "https://vt.tiktok.com/ZS1/"


def test_shortcut_view_is_markdown_free_without_emoji():
    out = shortcut_view({
        "session_id": "s", "model_used": "m", "explanation": "## Tiêu đề\n**đậm** text",
        "key_segment": {"start_time": "00:05", "end_time": "00:20", "summary": "bước chính"},
        "video": {"filename": "f.mp4", "title": "T", "platform": "TikTok", "uploader": "u"},
    })
    assert "#" not in out["plain_text"] and "**" not in out["plain_text"]
    assert "Đoạn trọng tâm: [00:05 - 00:20]" in out["plain_text"]
    assert out["explanation_markdown"].startswith("##")
