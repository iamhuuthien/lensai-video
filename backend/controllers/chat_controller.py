"""Follow-up questions about an analysed video."""

from fastapi import APIRouter, HTTPException, Request

from backend.core.hooks import run_with_hooks
from backend.models.schemas import ChatRequest
from backend.services.analysis_service import run_chat
from backend.views.presenters import chat_view

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat_video(req: ChatRequest, request: Request) -> dict:
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Vui lòng nhập câu hỏi.")

    async def handler(payload: ChatRequest) -> dict:
        return chat_view(await run_chat(payload), payload)

    return await run_with_hooks(request, "chat", req, handler)
