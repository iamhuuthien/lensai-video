"""Unit & Integration tests for Multi-Platform Channel & Cross-Page Intelligence Engine."""

from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_channel_presets_endpoint():
    resp = client.get("/api/channel/presets")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["presets"]) == 3
    platforms = {p["platform"] for p in data["presets"]}
    assert platforms == {"tiktok", "facebook", "youtube"}


def test_analyze_single_tiktok_channel(monkeypatch):
    monkeypatch.setenv("LENSAI_SKIP_LIVE_CHANNEL_SCRAPE", "1")
    monkeypatch.setenv("LENSAI_SKIP_LIVE_GEMINI_CHANNEL", "1")
    resp = client.post(
        "/api/channel/analyze",
        json={
            "primary_url": "https://www.tiktok.com/@vtv24news_creator",
            "platform": "tiktok",
            "api_key": "AIzaSyTestByokKey123456",
        },
        headers={"X-Device-Id": "DEV-CH-TEST1"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["platform"] == "tiktok"
    assert body["mode"] == "single_channel"
    ch = body["primary_channel"]
    assert ch["sample_size"] >= 10
    assert ch["median_views"] > 0
    assert ch["channel_health_score"] >= 40
    assert len(ch["pillar_distribution"]) >= 3
    assert len(ch["viral_outliers"]) >= 2
    assert set(ch["platform_scorecards"].keys()) == {"tiktok", "facebook", "youtube"}
    strat = body["strategy"]
    assert "core_niche" in strat["positioning"]
    assert len(strat["next_5_video_scripts"]) == 5


def test_analyze_two_facebook_pages_head_to_head(monkeypatch):
    monkeypatch.setenv("LENSAI_SKIP_LIVE_CHANNEL_SCRAPE", "1")
    monkeypatch.setenv("LENSAI_SKIP_LIVE_GEMINI_CHANNEL", "1")
    resp = client.post(
        "/api/channel/analyze",
        json={
            "primary_url": "https://www.facebook.com/TechStudioVN",
            "secondary_url": "https://www.facebook.com/DigitalCreatorLabVN",
            "platform": "facebook",
            "api_key": "AIzaSyTestByokKey123456",
        },
        headers={"X-Device-Id": "DEV-CH-TEST2"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["platform"] == "facebook"
    assert body["mode"] == "head_to_head"
    assert body["secondary_channel"] is not None
    h2h = body["head_to_head"]
    assert h2h is not None
    assert len(h2h["metrics_table"]) >= 6
    assert len(h2h["content_gaps"]) >= 2
    assert body["strategy"]["competitor_strategy"] is not None
    assert len(body["strategy"]["competitor_strategy"]["page_a_counter_attack"]) >= 2


def test_analyze_youtube_channel_funnel(monkeypatch):
    monkeypatch.setenv("LENSAI_SKIP_LIVE_CHANNEL_SCRAPE", "1")
    monkeypatch.setenv("LENSAI_SKIP_LIVE_GEMINI_CHANNEL", "1")
    resp = client.post(
        "/api/channel/analyze",
        json={
            "primary_url": "https://www.youtube.com/@CreatorAcademyVN",
            "platform": "youtube",
            "api_key": "AIzaSyTestByokKey123456",
        },
        headers={"X-Device-Id": "DEV-CH-TEST3"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["platform"] == "youtube"
    ch = body["primary_channel"]
    assert ch["subscribers"] > 0
    assert len(ch["platform_scorecards"]["youtube"]) == 4
    assert "youtube_key" in body["strategy"]["platform_keys_analysis"]
