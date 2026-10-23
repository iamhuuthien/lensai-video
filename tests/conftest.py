import pytest
from fastapi.testclient import TestClient

from backend.core.extensions import extensions
from backend.main import create_app


@pytest.fixture()
def client(monkeypatch):
    # Community mode: no private extension, no leaked hooks between tests.
    monkeypatch.setenv("LENSAI_PRO_MODULE", "module_that_does_not_exist")
    monkeypatch.setattr(extensions, "_before", [])
    monkeypatch.setattr(extensions, "_after", [])
    monkeypatch.setattr(extensions, "_error", [])
    monkeypatch.setattr(extensions, "features", {"pro": False})
    monkeypatch.setattr(extensions, "frontend_script", None)
    return TestClient(create_app())
