import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_missing_api_key(client: AsyncClient):
    """Test calling protected endpoint without X-API-Key returns HTTP 401."""
    response = await client.post("/api/v0/shifts", json={})
    assert response.status_code == 401
    assert "API Key missing" in response.json()["detail"]


@pytest.mark.asyncio
async def test_invalid_api_key(client: AsyncClient):
    """Test calling protected endpoint with invalid X-API-Key returns HTTP 403."""
    response = await client.post(
        "/api/v0/shifts",
        json={},
        headers={"X-API-Key": "invalid-secret-key"},
    )
    assert response.status_code == 403
    assert "Invalid API Key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_valid_api_key_passes_security(client: AsyncClient, auth_headers: dict[str, str]):
    """Test calling protected endpoint with valid API key passes security check."""
    payload = {
        "id": str(uuid.uuid4()),
        "device_id": "test-device-uuid",
        "started_at": "2026-09-27T08:00:00Z",
    }
    response = await client.post("/api/v0/shifts", json=payload, headers=auth_headers)
    assert response.status_code == 201
