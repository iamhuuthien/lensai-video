"""Channel & Cross-Page Competitor Intelligence endpoints (/api/channel/*)."""

from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from backend.core.hooks import run_with_hooks
from backend.models.schemas import ChannelAnalyzeRequest
from backend.services.channel_ai_service import generate_channel_strategy_with_ai
from backend.services.channel_quant_service import (
    compute_channel_quant_metrics,
    compute_head_to_head_comparison,
)
from backend.services.channel_scraper_service import collect_channel_data, detect_channel_platform

logger = logging.getLogger("video-explainer.channel_controller")

router = APIRouter(prefix="/api/channel", tags=["channel-intelligence"])

# In-memory TTL cache (6 hours) to prevent redundant scraping & AI token drain
_CHANNEL_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_CACHE_TTL_SEC = 6 * 3600


def _build_cache_key(req: ChannelAnalyzeRequest) -> str:
    p1 = (req.primary_url or "").strip().lower()
    p2 = (req.secondary_url or "").strip().lower()
    plat = (req.platform or "auto").strip().lower()
    s1 = ",".join((req.sample_urls or [])[:5])
    s2 = ",".join((req.secondary_sample_urls or [])[:5])
    return f"{plat}|{p1}|{p2}|{req.sample_limit}|{s1}|{s2}"


def _execute_channel_audit_sync(req: ChannelAnalyzeRequest) -> Dict[str, Any]:
    cache_key = _build_cache_key(req)
    now = time.time()
    cached = _CHANNEL_CACHE.get(cache_key)
    if cached and (now - cached[0]) < _CACHE_TTL_SEC:
        res = dict(cached[1])
        res["cached"] = True
        return res

    platform = detect_channel_platform(
        req.primary_url, None if req.platform == "auto" else req.platform
    )

    primary_raw = collect_channel_data(
        raw_url=req.primary_url,
        explicit_platform=platform,
        sample_limit=req.sample_limit,
        sample_urls=req.sample_urls,
        seed_variant=0,
    )
    primary_metrics = compute_channel_quant_metrics(primary_raw)

    secondary_metrics = None
    comparison = None
    has_secondary = bool(req.secondary_url and req.secondary_url.strip())
    if has_secondary:
        secondary_raw = collect_channel_data(
            raw_url=req.secondary_url.strip(),
            explicit_platform=platform,
            sample_limit=req.sample_limit,
            sample_urls=req.secondary_sample_urls,
            seed_variant=1,
        )
        secondary_metrics = compute_channel_quant_metrics(secondary_raw)
        comparison = compute_head_to_head_comparison(primary_metrics, secondary_metrics)

    strategy = generate_channel_strategy_with_ai(
        primary_metrics=primary_metrics,
        secondary_metrics=secondary_metrics,
        comparison=comparison,
        focus_goal=req.focus_goal or "comprehensive",
        api_key=req.api_key,
        model=req.model,
    )

    audit_result = {
        "audit_id": f"AUD-{uuid.uuid4().hex[:10].upper()}",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "platform": platform,
        "mode": "head_to_head" if has_secondary else "single_channel",
        "cached": False,
        "resource_status": {
            "youtube_api_configured": bool(os.environ.get("YOUTUBE_API_KEY", "").strip()),
            "apify_token_configured": bool(os.environ.get("APIFY_TOKEN", "").strip()),
            "ytdlp_enabled": True,
            "data_source_used": primary_metrics.get("data_source", "ytdlp_live"),
        },
        "primary_channel": primary_metrics,
        "secondary_channel": secondary_metrics,
        "head_to_head": comparison,
        "strategy": strategy,
    }
    _CHANNEL_CACHE[cache_key] = (now, audit_result)
    return audit_result


@router.post("/analyze")
async def analyze_channel(req: ChannelAnalyzeRequest, request: Request) -> Dict[str, Any]:
    """Analyze 1 full channel (TikTok / YouTube / Facebook) or compare 2 Facebook Pages head-to-head."""
    if not req.primary_url or not req.primary_url.strip():
        raise HTTPException(
            status_code=400,
            detail="Vui lòng nhập đường link kênh hoặc tên @handle cần phân tích.",
        )

    # Provide compat fields on req so access_hooks can log url & session_id seamlessly
    setattr(req, "url", req.primary_url.strip())
    setattr(req, "session_id", f"ch_{uuid.uuid4().hex[:8]}")

    async def handler(payload: ChannelAnalyzeRequest) -> Dict[str, Any]:
        try:
            return await asyncio.to_thread(_execute_channel_audit_sync, payload)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
        except Exception as exc:
            logger.error("Channel analysis failed: %s", exc)
            raise HTTPException(status_code=500, detail=f"Không thể phân tích kênh lúc này: {exc}")

    return await run_with_hooks(request, "channel_analyze", req, handler)


@router.get("/presets")
async def channel_presets() -> Dict[str, Any]:
    """Return sample channels & 2-Page comparison presets for instant 1-click showcase."""
    return {
        "presets": [
            {
                "id": "tiktok_ai_creator",
                "label": "🎵 Kênh TikTok: @vtv24news_creator (AI & Content Viral)",
                "platform": "tiktok",
                "primary_url": "https://www.tiktok.com/@vtv24news_creator",
                "secondary_url": "",
                "description": "Phân tích định hướng kênh, tỷ lệ 5 trụ cột nội dung, công thức Hook 3s đầu và TikTok SEO.",
            },
            {
                "id": "fb_head_to_head",
                "label": "📘 So Sánh 2 Fanpage Facebook: TechStudioVN vs DigitalCreatorLabVN",
                "platform": "facebook",
                "primary_url": "https://www.facebook.com/TechStudioVN",
                "secondary_url": "https://www.facebook.com/DigitalCreatorLabVN",
                "description": "Đối đầu trực diện 2 Fanpage theo khung REACH Framework: Tỷ trọng Reels, thảo luận giờ đầu, kỷ luật gắn link và khoảng trống chủ đề.",
            },
            {
                "id": "youtube_creator_academy",
                "label": "▶️ Kênh YouTube: @CreatorAcademyVN (Shorts + Long-form Funnel)",
                "platform": "youtube",
                "primary_url": "https://www.youtube.com/@CreatorAcademyVN",
                "secondary_url": "",
                "description": "Phân tích phễu chuyển đổi Shorts sang Video dài, tỷ lệ View/Sub, công thức Title/Thumbnail và Hidden Gems.",
            },
        ],
        "resource_status": {
            "youtube_api_configured": bool(os.environ.get("YOUTUBE_API_KEY", "").strip()),
            "apify_token_configured": bool(os.environ.get("APIFY_TOKEN", "").strip()),
            "ytdlp_enabled": True,
        },
    }
