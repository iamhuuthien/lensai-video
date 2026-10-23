from fastapi.testclient import TestClient
from backend.main import create_app
from backend.core import config

def test_serves_built_frontend_spa():
    app = create_app()
    client = TestClient(app)

    # Root index
    res = client.get("/")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "LensAI" in res.text
    assert "/assets/" in res.text

    # Manifest and icon
    res_manifest = client.get("/manifest.json")
    assert res_manifest.status_code == 200
    assert "LensAI" in res_manifest.text

    res_icon = client.get("/icon.svg")
    assert res_icon.status_code == 200

    # Static assets immutable caching
    assets = list((config.FRONTEND_DIST_DIR / "assets").glob("*.js"))
    assert len(assets) > 0
    asset_name = assets[0].name
    res_asset = client.get(f"/assets/{asset_name}")
    assert res_asset.status_code == 200
    assert "immutable" in res_asset.headers.get("cache-control", "")
