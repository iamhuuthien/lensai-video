"""Request schemas (Model layer). Responses are plain dicts built in ``backend.views``
because extensions may append fields (e.g. ``pro_status``) before they are serialised."""

from typing import Optional

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    question: str
    api_key: Optional[str] = None
    context_fallback: Optional[dict] = None


class ShortcutRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None
