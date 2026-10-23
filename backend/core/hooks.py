"""Cross-cutting helper: wraps a handler with the extension before/after/error hooks."""

from typing import Any, Awaitable, Callable

from fastapi import Request

from backend.core.extensions import extensions


async def run_with_hooks(
    request: Request,
    action: str,
    payload: Any,
    handler: Callable[[Any], Awaitable[Any]],
) -> Any:
    """``before`` may raise to block; ``error`` runs only if ``before`` passed and ``handler`` failed."""
    await extensions.run_before(request, action, payload)
    try:
        response = await handler(payload)
    except BaseException as exc:
        await extensions.run_error(request, action, exc)
        raise
    await extensions.run_after(request, action, response)
    return response
