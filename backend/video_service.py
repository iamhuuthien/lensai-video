"""Deprecated import path kept for extensions built against v3. Use ``backend.services.video_service``."""

from backend.services.video_service import (  # noqa: F401
    SAVED_VIDEOS_DIR,
    download_and_extract_video,
    save_analysis_markdown,
)
