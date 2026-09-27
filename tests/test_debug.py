import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_debug_shifts_list_and_detail(client: AsyncClient, auth_headers: dict[str, str]):
    """Test debug listing of shifts and retrieving shift detail."""
    shift_id = str(uuid.uuid4())
    payload = {
        "id": shift_id,
        "device_id": "debug-device-uuid",
        "started_at": "2026-09-27T08:00:00Z",
    }
    await client.post("/api/v0/shifts", json=payload, headers=auth_headers)

    # List shifts
    res_list = await client.get("/api/v0/debug/shifts", headers=auth_headers)
    assert res_list.status_code == 200
    shifts = res_list.json()
    assert len(shifts) >= 1
    assert any(s["id"] == shift_id for s in shifts)

    # Get shift by ID
    res_detail = await client.get(f"/api/v0/debug/shifts/{shift_id}", headers=auth_headers)
    assert res_detail.status_code == 200
    assert res_detail.json()["id"] == shift_id


@pytest.mark.asyncio
async def test_debug_stats_endpoint(client: AsyncClient, auth_headers: dict[str, str]):
    """Test debug stats endpoint returning counts of total shifts and locations."""
    shift_id = str(uuid.uuid4())
    await client.post(
        "/api/v0/shifts",
        json={"id": shift_id, "device_id": "dev1", "started_at": "2026-09-27T08:00:00Z"},
        headers=auth_headers,
    )

    # Upload 2 locations
    loc_payload = {
        "locations": [
            {
                "id": str(uuid.uuid4()),
                "shift_id": shift_id,
                "latitude": 31.52,
                "longitude": 74.35,
                "device_timestamp": "2026-09-27T08:10:00Z",
            },
            {
                "id": str(uuid.uuid4()),
                "shift_id": shift_id,
                "latitude": 31.53,
                "longitude": 74.36,
                "device_timestamp": "2026-09-27T08:11:00Z",
            },
        ]
    }
    await client.post("/api/v0/locations/batch", json=loc_payload, headers=auth_headers)

    # Check stats
    stats_res = await client.get("/api/v0/debug/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_shifts"] >= 1
    assert data["active_shifts"] >= 1
    assert data["total_locations"] >= 2
    assert data["latest_location_received_at"] is not None
