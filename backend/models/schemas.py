"""Request schemas (Model layer). Responses are plain dicts built in ``backend.views``
because extensions may append fields (e.g. ``pro_status``) before they are serialised."""

from typing import Optional

from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    question: str
    api_key: Optional[str] = None
    context_fallback: Optional[dict] = None
    model: Optional[str] = None


class ShortcutRequest(BaseModel):
    url: str
    mode: str = "explain"
    prompt: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None


class ChannelAnalyzeRequest(BaseModel):
    primary_url: str
    secondary_url: Optional[str] = None
    platform: Optional[str] = "auto"
    sample_urls: Optional[list[str]] = None
    secondary_sample_urls: Optional[list[str]] = None
    sample_limit: int = 20
    focus_goal: Optional[str] = "comprehensive"
    api_key: Optional[str] = None
    model: Optional[str] = None
    url: Optional[str] = None
    session_id: Optional[str] = None

