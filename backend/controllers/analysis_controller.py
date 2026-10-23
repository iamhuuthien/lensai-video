"""Analysis endpoints: /api/analyze and the Apple Shortcuts variant /api/shortcut."""

from fastapi import APIRouter, HTTPException, Request

from backend.core.hooks import run_with_hooks
from backend.models.schemas import AnalyzeRequest, ShortcutRequest
from backend.services.analysis_service import run_analysis
from backend.views.presenters import analysis_view, shortcut_view

router = APIRouter(prefix="/api", tags=["analysis"])


async def _analyze(request: Request, req: AnalyzeRequest) -> dict:
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập đường link video hợp lệ.")

    async def handler(payload: AnalyzeRequest) -> dict:
        return analysis_view(await run_analysis(payload), payload)

    return await run_with_hooks(request, "analyze", req, handler)


@router.post("/analyze")
async def analyze_video(req: AnalyzeRequest, request: Request) -> dict:
    """Download the video, find the key segment, expand the topic and persist the result."""
    return await _analyze(request, req)


@router.post("/shortcut")
async def ios_shortcut(req: ShortcutRequest, request: Request) -> dict:
    """Same pipeline as /api/analyze, shaped for the iOS Share Sheet."""
    analysis = await _analyze(
        request,
        AnalyzeRequest(url=req.url, mode=req.mode, prompt=req.prompt, api_key=req.api_key),
    )
    return shortcut_view(analysis)
