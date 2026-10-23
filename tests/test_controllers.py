from unittest.mock import patch

from fastapi import HTTPException


def test_health_reports_version_and_key_flag(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["has_server_api_key"] is False
    monkeypatch.setenv("GEMINI_API_KEY", "abc")
    assert client.get("/api/health").json()["has_server_api_key"] is True


def test_features_is_community_mode_without_extension(client):
    body = client.get("/api/features").json()
    assert body == {"features": {"pro": False}, "frontend_script": None}


def test_saved_listing_hidden_by_default(client):
    assert client.get("/api/saved").status_code == 404


def test_analyze_and_chat_validate_input(client):
    assert client.post("/api/analyze", json={"url": "  "}).status_code == 400
    assert client.post("/api/chat", json={"session_id": "s", "question": " "}).status_code == 400


def test_video_stream_404_for_unknown_session(client):
    assert client.get("/api/video/doesnotexist").status_code == 404


def test_analyze_pipeline_goes_through_view_and_hooks(client):
    from backend.core.extensions import extensions

    seen = []
    extensions.add_before_hook(lambda req, action, payload: seen.append(("before", action)))
    extensions.add_after_hook(lambda req, action, result: result.update(extra="ok"))

    fake = {
        "video_info": {
            "session_id": "abc", "url": "https://t.co/x", "filename": "f.mp4", "video_path": "/tmp/f.mp4",
            "platform": "TikTok", "title": "T", "description": "", "uploader": "u", "duration": 9,
            "thumbnail": "", "tags": [],
        },
        "ai_result": {"explanation": "## Hi", "key_segment": None, "model_used": "gemini-x"},
        "markdown_path": "/tmp/f.md",
    }

    async def fake_run(_req):
        return fake

    with patch("backend.controllers.analysis_controller.run_analysis", fake_run):
        body = client.post("/api/analyze", json={"url": "https://t.co/x"}).json()

    assert seen == [("before", "analyze")]
    assert body["session_id"] == "abc" and body["video"]["stream_url"] == "/api/video/abc"
    assert body["extra"] == "ok"  # after-hook can still enrich the response


def test_error_hook_runs_when_handler_fails(client):
    from backend.core.extensions import extensions

    errors = []
    extensions.add_error_hook(lambda req, action, exc: errors.append((action, type(exc).__name__)))

    async def boom(_req):
        raise HTTPException(status_code=422, detail="no")

    with patch("backend.controllers.analysis_controller.run_analysis", boom):
        assert client.post("/api/analyze", json={"url": "https://t.co/x"}).status_code == 422
    assert errors == [("analyze", "HTTPException")]


def test_before_hook_can_block(client):
    from backend.core.extensions import extensions

    def deny(req, action, payload):
        raise HTTPException(status_code=402, detail="pay")

    extensions.add_before_hook(deny)
    assert client.post("/api/analyze", json={"url": "https://t.co/x"}).status_code == 402
