"""Deprecated import path kept for extensions built against v3. Use ``backend.services.ai_service``."""

from backend.services.ai_service import (  # noqa: F401
    SESSIONS,
    _create_video_part,
    _generate_with_best_model,
    analyze_video_with_ai,
    chat_about_video,
    get_genai_client,
)
