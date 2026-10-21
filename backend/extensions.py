"""
Extension (plugin) system for the open-source core.

The public repository contains NO billing / credit / payment logic. Instead it exposes
a few well-defined hooks. An optional, separately hosted package (by default the Python
module ``lensai_pro``) can plug into them to add things like credits, VIP codes or
premium features.

If the module is not installed, the app simply runs in community mode (BYOK: every user
brings their own Gemini API key).

Contract for an extension module::

    def register(app: FastAPI, ext: Extensions) -> None:
        ext.set_feature("pro", True)
        ext.set_frontend_script("/static/pro/pro.js")   # optional UI add-on
        ext.add_before_hook(check_access)                # async or sync
        ext.add_after_hook(charge_credits)               # async or sync

Hook signatures::

    before(request, action, payload) -> None   # raise HTTPException to block the call
    after(request, action, result)   -> None   # errors are logged, never break the response

``action`` is ``"analyze"`` or ``"chat"``.
"""

import importlib
import inspect
import logging
import os
from typing import Any, Awaitable, Callable, Dict, List, Optional, Union

from fastapi import FastAPI, Request

logger = logging.getLogger("video-explainer.extensions")

Hook = Callable[..., Union[None, Awaitable[None]]]


class Extensions:
    def __init__(self) -> None:
        self.features: Dict[str, Any] = {"pro": False}
        self.frontend_script: Optional[str] = None
        self._before: List[Hook] = []
        self._after: List[Hook] = []

    # ---- registration API (used by extension modules) ----
    def set_feature(self, name: str, value: Any = True) -> None:
        self.features[name] = value

    def set_frontend_script(self, url: str) -> None:
        self.frontend_script = url

    def add_before_hook(self, fn: Hook) -> None:
        self._before.append(fn)

    def add_after_hook(self, fn: Hook) -> None:
        self._after.append(fn)

    # ---- invocation API (used by the core) ----
    async def run_before(self, request: Request, action: str, payload: Any) -> None:
        # Exceptions propagate on purpose: a hook raising HTTPException blocks the request.
        for fn in self._before:
            result = fn(request, action, payload)
            if inspect.isawaitable(result):
                await result

    async def run_after(self, request: Request, action: str, result: Any) -> None:
        for fn in self._after:
            try:
                out = fn(request, action, result)
                if inspect.isawaitable(out):
                    await out
            except Exception:
                logger.exception("After-hook failed (ignored)")

    def public_features(self) -> Dict[str, Any]:
        return {"features": self.features, "frontend_script": self.frontend_script}


extensions = Extensions()


def load_extensions(app: FastAPI) -> bool:
    """
    Try to load the optional extension module. Returns True when one was loaded.

    Fail-closed: if the module exists but is broken, startup fails loudly instead of
    silently serving a hosted instance without its access control.
    """
    module_name = os.environ.get("LENSAI_PRO_MODULE", "lensai_pro")
    try:
        module = importlib.import_module(module_name)
    except ModuleNotFoundError as err:
        if err.name == module_name:
            logger.info("No extension module '%s' found: running in community mode.", module_name)
            return False
        raise  # the module exists but one of ITS dependencies is missing

    module.register(app, extensions)
    logger.info("Extension module '%s' loaded.", module_name)
    return True
