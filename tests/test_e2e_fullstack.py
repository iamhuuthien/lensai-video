"""End-to-End Fullstack Automation Suite (Core + LensAI Pro Extension + Admin + Billing + Studio + History).

Tests the complete integrated FastAPI application with ``lensai_pro`` registered via ``load_extensions``.
"""

import pytest
from fastapi.testclient import TestClient

from backend.core.extensions import Extensions
from backend.main import create_app


@pytest.fixture()
def fullstack(tmp_path, monkeypatch):
    """Spin up the full integrated app (video-explainer + lensai_pro) with an isolated ledger."""
    import backend.core.extensions as ext_mod
    import lensai_pro

    monkeypatch.delenv("FIREBASE_CREDENTIALS_JSON", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    monkeypatch.delenv("LENSAI_REQUIRE_FIREBASE", raising=False)
    monkeypatch.delenv("RENDER", raising=False)

    monkeypatch.setenv("LENSAI_PRO_LEDGER_PATH", str(tmp_path / "e2e_ledger.json"))
    monkeypatch.setenv("GEMINI_API_KEY", "test-demo-key")
    monkeypatch.setenv("MASTER_GEMINI_API_KEY", "test-demo-key")
    monkeypatch.setenv("LENSAI_DEMO_MODE", "1")
    monkeypatch.setenv("LENSAI_ADMIN_SECRET", "test-admin-secret-fixture")
    monkeypatch.setenv("SEPAY_WEBHOOK_API_KEY", "test-sepay-secret-fixture")
    monkeypatch.setenv("VIETQR_BANK_ID", "MB")
    monkeypatch.setenv("VIETQR_ACCOUNT_NO", "0000123456")
    monkeypatch.setenv("VIETQR_ACCOUNT_NAME", "TEST MERCHANT")

    lensai_pro._store = None
    fresh_ext = Extensions()
    monkeypatch.setattr(ext_mod, "extensions", fresh_ext)
    import backend.controllers.system_controller as sys_ctrl
    import backend.core.hooks as hooks_mod

    monkeypatch.setattr(sys_ctrl, "extensions", fresh_ext)
    monkeypatch.setattr(hooks_mod, "extensions", fresh_ext)

    app = create_app()
    client = TestClient(app)
    return client, lensai_pro.get_store()


def test_e2e_01_system_discovery_and_spa_serve(fullstack):
    client, _ = fullstack
    assert client.get("/").status_code == 200
    health = client.get("/api/health").json()
    assert health["status"] == "ok" and health["has_server_api_key"] is True

    features = client.get("/api/features").json()
    assert features["features"]["pro"] is True
    assert features["features"]["billing_enabled"] is True

    models = client.get("/api/models").json()
    assert models["default_free"] == "gemini-2.5-flash"
    assert models["default_vip"] == "gemini-2.5-pro"


def test_e2e_02_free_trial_analyze_bento_chat_and_quota_exhaustion(fullstack):
    client, _ = fullstack
    headers = {"X-Device-Id": "DEV-E2E-FREE01"}

    # 1st link analysis (sample TikTok URL)
    r1 = client.post(
        "/api/analyze",
        json={"url": "https://www.tiktok.com/@vtv24news/video/7339182390123456789", "mode": "quick"},
        headers=headers,
    )
    assert r1.status_code == 200
    body1 = r1.json()
    assert body1["trial_status"]["link_remaining"] == 2
    # Verify SPA Bento Grid contract fields exist
    assert body1["video_info"]["title"]
    assert body1["key_segment"]["reason"]
    assert body1["summary"] and body1["raw_markdown"]
    assert len(body1["chapters"]) >= 1
    assert len(body1["takeaways"]) >= 1
    assert len(body1["action_items"]) >= 1
    assert len(body1["mindmap"]) >= 1

    # Follow-up chat on the analyzed session
    chat_res = client.post(
        "/api/chat",
        json={"session_id": body1["session_id"], "question": "Tóm tắt 3 bước chính trong video?"},
        headers=headers,
    )
    assert chat_res.status_code == 200
    assert "Phân tích chuyên sâu" in chat_res.json()["answer"]

    # 2nd and 3rd link analyses succeed
    for expected_rem in (1, 0):
        r = client.post(
            "/api/analyze",
            json={"url": "https://www.facebook.com/reel/1234567890123456", "mode": "deep"},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["trial_status"]["link_remaining"] == expected_rem

    # 4th link analysis is blocked with HTTP 402 Payment Required
    r4 = client.post(
        "/api/analyze",
        json={"url": "https://youtube.com/shorts/dQw4w9WgXcQ", "mode": "study"},
        headers=headers,
    )
    assert r4.status_code == 402
    assert "3/3" in r4.json()["detail"]


def test_e2e_03_failed_analysis_automatically_refunds_trial_and_vip(fullstack):
    client, store = fullstack
    dev_headers = {"X-Device-Id": "DEV-E2E-REFUND"}

    # Simulated AI failure on Free Trial -> quota stays 3/3
    fail_free = client.post(
        "/api/analyze",
        json={"url": "https://demo.lensai.vn/error-refund", "mode": "quick"},
        headers=dev_headers,
    )
    assert fail_free.status_code == 500
    ts = client.get("/api/pro/trial-status", headers=dev_headers).json()["trial_status"]
    assert ts["link_remaining"] == 3

    # Simulated AI failure on VIP Pass -> credits stay 15/15
    vip_code = store.create_pass("trial_day")["code"]
    fail_vip = client.post(
        "/api/analyze",
        json={"url": "https://demo.lensai.vn/error-refund", "mode": "quick"},
        headers={"X-Device-Id": "DEV-E2E-REFUND", "X-VIP-Code": vip_code},
    )
    assert fail_vip.status_code == 500
    assert store.get_pass(vip_code)["credits_remaining"] == 15


def test_e2e_04_vietqr_order_sepay_webhook_and_vip_activation_flow(fullstack):
    client, _ = fullstack
    headers = {"X-Device-Id": "DEV-E2E-BUYER"}

    # 1. Create order for pro_month (169,000 VND, 220 credits)
    order_res = client.post("/api/pro/order", json={"plan_id": "pro_month"}, headers=headers)
    assert order_res.status_code == 200
    order = order_res.json()["order"]
    order_code = order["order_code"]
    assert order["status"] == "pending" and order["amount_vnd"] == 169_000

    # 2. SePay webhook fires with payment notification
    wh_res = client.post(
        "/api/pro/webhook/sepay",
        json={"transferType": "in", "transferAmount": 169_000, "content": f"CHUYEN KHOAN {order_code}"},
        headers={"Authorization": "Apikey test-sepay-secret-fixture"},
    )
    assert wh_res.status_code == 200
    wh_body = wh_res.json()
    assert wh_body["order_completed"] is True
    issued_vip_code = wh_body["pass_code"]
    assert issued_vip_code.startswith("VIP-")

    # 3. Frontend polls /api/pro/order/{order_code} and receives pass_code
    poll_res = client.get(f"/api/pro/order/{order_code}").json()["order"]
    assert poll_res["status"] == "paid" and poll_res["pass_code"] == issued_vip_code

    # 4. Verify VIP pass & spend 1 credit on analysis + 1 credit on Studio SRT
    pass_check = client.get(f"/api/pro/pass/{issued_vip_code}").json()
    assert pass_check["valid"] is True and pass_check["pass"]["credits_remaining"] == 220

    vip_headers = {"X-Device-Id": "DEV-E2E-BUYER", "X-VIP-Code": issued_vip_code}
    ana = client.post(
        "/api/analyze",
        json={"url": "https://www.tiktok.com/@vtv24news/video/7339182390123456789", "mode": "clip_ideas"},
        headers=vip_headers,
    ).json()
    assert ana["pro_status"]["credits_remaining"] == 219

    srt = client.post(
        "/api/pro/capcut-srt",
        json={"session_id": ana["session_id"], "target_lang": "vi", "voice_tone": "viral"},
        headers=vip_headers,
    ).json()
    assert "-->" in srt["srt_content"]
    assert srt["pro_status"]["credits_remaining"] == 218


def test_e2e_05_admin_portal_overview_create_toggle_confirm_and_reset(fullstack):
    client, _ = fullstack
    admin_headers = {"X-Admin-Secret": "test-admin-secret-fixture", "X-Device-Id": "DEV-ADMIN-QA"}

    # 1. Admin creates a custom VIP pass
    create_res = client.post(
        "/api/pro/admin/create-pass",
        headers=admin_headers,
        json={"plan_id": "agency_month", "custom_credits": 500, "custom_days": 60, "pass_code": "VIP-QA-2026"},
    )
    assert create_res.status_code == 200
    assert create_res.json()["pass"]["code"] == "VIP-QA-2026"

    # 2. Admin locks and unlocks the pass
    lock_res = client.post(
        "/api/pro/admin/toggle-pass",
        headers=admin_headers,
        json={"code": "VIP-QA-2026", "active": False},
    )
    assert lock_res.status_code == 200 and lock_res.json()["pass"]["active"] is False
    assert client.get("/api/pro/pass/VIP-QA-2026").json()["valid"] is False

    unlock_res = client.post(
        "/api/pro/admin/toggle-pass",
        headers=admin_headers,
        json={"code": "VIP-QA-2026", "active": True},
    )
    assert unlock_res.status_code == 200 and unlock_res.json()["pass"]["active"] is True
    assert client.get("/api/pro/pass/VIP-QA-2026").json()["valid"] is True

    # 3. Admin manually confirms a pending VietQR order
    order_code = client.post("/api/pro/order", json={"plan_id": "trial_day"}).json()["order"]["order_code"]
    confirm_res = client.post(
        "/api/pro/admin/confirm-order",
        headers=admin_headers,
        json={"order_code": order_code},
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["order"]["status"] == "paid"

    # 4. Admin resets device trial quota
    client.post(
        "/api/analyze",
        json={"url": "https://www.tiktok.com/@vtv24news/video/7339182390123456789"},
        headers={"X-Device-Id": "DEV-ADMIN-QA"},
    )
    assert client.get("/api/pro/trial-status", headers={"X-Device-Id": "DEV-ADMIN-QA"}).json()["trial_status"]["link_remaining"] == 2

    reset_res = client.post("/api/pro/admin/reset-trial", headers=admin_headers, json={"device_id": "DEV-ADMIN-QA"})
    assert reset_res.status_code == 200
    assert reset_res.json()["trial_status"]["link_remaining"] == 3

    # 5. Admin fetches overview dashboard
    ov = client.get("/api/pro/admin/overview", headers=admin_headers).json()
    assert ov["status"] == "success"
    assert any(p["code"] == "VIP-QA-2026" for p in ov["passes"])
    assert any(o["order_code"] == order_code for o in ov["orders"])
    assert ov["tax_report"]["monthly_orders_count"] >= 1
