import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_shift_success(client: AsyncClient, auth_headers: dict[str, str]):
    """Test creating a shift with valid phone-generated UUID."""
    shift_id = str(uuid.uuid4())
    payload = {
        "id": shift_id,
        "device_id": "device-uuid-123",
        "started_at": "2026-09-27T08:30:00Z",
    }
    response = await client.post("/api/v0/shifts", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == shift_id
    assert data["device_id"] == "device-uuid-123"
    assert data["status"] == "ACTIVE"
    assert data["created"] is True
    assert data["ended_at"] is None


@pytest.mark.asyncio
async def test_create_shift_idempotent_retry(client: AsyncClient, auth_headers: dict[str, str]):
    """Test retrying shift creation with exact same UUID returns 200 OK and created=False."""
    shift_id = str(uuid.uuid4())
    payload = {
        "id": shift_id,
        "device_id": "device-uuid-123",
        "started_at": "2026-09-27T08:30:00Z",
    }
    
    # First attempt -> 201 Created
    res1 = await client.post("/api/v0/shifts", json=payload, headers=auth_headers)
    assert res1.status_code == 201
    assert res1.json()["created"] is True

    # Second attempt (retry) -> 200 OK, created=False
    res2 = await client.post("/api/v0/shifts", json=payload, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["id"] == shift_id
    assert res2.json()["created"] is False


@pytest.mark.asyncio
async def test_complete_shift_success(client: AsyncClient, auth_headers: dict[str, str]):
    """Test completing an existing active shift."""
    shift_id = str(uuid.uuid4())
    payload = {
        "id": shift_id,
        "device_id": "device-uuid-123",
        "started_at": "2026-09-27T08:30:00Z",
    }
    await client.post("/api/v0/shifts", json=payload, headers=auth_headers)

    complete_payload = {
        "ended_at": "2026-09-27T17:00:00Z",
    }
    response = await client.post(
        f"/api/v0/shifts/{shift_id}/complete", json=complete_payload, headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == shift_id
    assert data["status"] == "COMPLETED"
    assert data["ended_at"].startswith("2026-09-27T17:00:00")


@pytest.mark.asyncio
async def test_complete_nonexistent_shift(client: AsyncClient, auth_headers: dict[str, str]):
    """Test completing a nonexistent shift returns 404 Not Found."""
    random_id = str(uuid.uuid4())
    complete_payload = {
        "ended_at": "2026-09-27T17:00:00Z",
    }
    response = await client.post(
        f"/api/v0/shifts/{random_id}/complete", json=complete_payload, headers=auth_headers
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
