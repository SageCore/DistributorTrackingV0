import uuid
import pytest
from httpx import AsyncClient


async def create_test_shift(client: AsyncClient, headers: dict[str, str]) -> str:
    """Helper fixture to create an active shift for testing locations."""
    shift_id = str(uuid.uuid4())
    payload = {
        "id": shift_id,
        "device_id": "test-device-uuid",
        "started_at": "2026-09-27T08:00:00Z",
    }
    res = await client.post("/api/v0/shifts", json=payload, headers=headers)
    assert res.status_code in (200, 201)
    return shift_id


@pytest.mark.asyncio
async def test_batch_location_upload_success(client: AsyncClient, auth_headers: dict[str, str]):
    """Test uploading a valid batch of 10 location records."""
    shift_id = await create_test_shift(client, auth_headers)

    locations = [
        {
            "id": str(uuid.uuid4()),
            "shift_id": shift_id,
            "latitude": 31.5204 + (i * 0.001),
            "longitude": 74.3587 + (i * 0.001),
            "accuracy_meters": 5.0,
            "altitude_meters": 210.0,
            "speed_mps": 2.5,
            "bearing_degrees": 90.0,
            "device_timestamp": f"2026-09-27T08:41:{10+i:02d}Z",
            "recorded_timestamp": f"2026-09-27T08:41:{10+i:02d}Z",
            "is_mock": False,
        }
        for i in range(10)
    ]

    payload = {"locations": locations}
    response = await client.post("/api/v0/locations/batch", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["received"] == 10
    assert data["inserted"] == 10
    assert data["duplicates"] == 0
    assert len(data["accepted_ids"]) == 10


@pytest.mark.asyncio
async def test_mandatory_idempotency_duplicate_retry(client: AsyncClient, auth_headers: dict[str, str]):
    """Mandatory test: Upload location UUID A, then send exact same UUID A again.

    Verify database contains 1 location and response indicates duplicate duplicate recognized.
    """
    shift_id = await create_test_shift(client, auth_headers)
    loc_id = str(uuid.uuid4())

    loc_payload = {
        "locations": [
            {
                "id": loc_id,
                "shift_id": shift_id,
                "latitude": 31.5204,
                "longitude": 74.3587,
                "accuracy_meters": 5.0,
                "device_timestamp": "2026-09-27T08:41:12Z",
                "is_mock": False,
            }
        ]
    }

    # Upload first time -> 1 inserted, 0 duplicates
    res1 = await client.post("/api/v0/locations/batch", json=loc_payload, headers=auth_headers)
    assert res1.status_code == 200
    assert res1.json()["inserted"] == 1
    assert res1.json()["duplicates"] == 0

    # Upload exact same payload second time -> 0 inserted, 1 duplicate
    res2 = await client.post("/api/v0/locations/batch", json=loc_payload, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["received"] == 1
    assert res2.json()["inserted"] == 0
    assert res2.json()["duplicates"] == 1
    assert loc_id in res2.json()["accepted_ids"]


@pytest.mark.asyncio
async def test_partial_duplicate_batch(client: AsyncClient, auth_headers: dict[str, str]):
    """Test uploading batch [A,B,C,D,E] then batch [D,E,F,G,H].

    Expected result: total 8 unique location records.
    """
    shift_id = await create_test_shift(client, auth_headers)

    ids = [str(uuid.uuid4()) for _ in range(8)]
    # A, B, C, D, E -> indices 0, 1, 2, 3, 4
    # D, E, F, G, H -> indices 3, 4, 5, 6, 7

    def build_location(loc_id: str, idx: int):
        return {
            "id": loc_id,
            "shift_id": shift_id,
            "latitude": 31.50 + idx * 0.01,
            "longitude": 74.30 + idx * 0.01,
            "device_timestamp": f"2026-09-27T09:{idx:02d}:00Z",
            "is_mock": False,
        }

    batch1 = {"locations": [build_location(ids[i], i) for i in range(5)]}  # A, B, C, D, E
    batch2 = {"locations": [build_location(ids[i], i) for i in range(3, 8)]}  # D, E, F, G, H

    res1 = await client.post("/api/v0/locations/batch", json=batch1, headers=auth_headers)
    assert res1.status_code == 200
    assert res1.json()["inserted"] == 5
    assert res1.json()["duplicates"] == 0

    res2 = await client.post("/api/v0/locations/batch", json=batch2, headers=auth_headers)
    assert res2.status_code == 200
    assert res2.json()["received"] == 5
    assert res2.json()["inserted"] == 3
    assert res2.json()["duplicates"] == 2
    assert len(res2.json()["accepted_ids"]) == 5


@pytest.mark.asyncio
async def test_invalid_latitude_rejection(client: AsyncClient, auth_headers: dict[str, str]):
    """Test sending invalid latitude 200 returns 422 Unprocessable Entity."""
    shift_id = await create_test_shift(client, auth_headers)
    payload = {
        "locations": [
            {
                "id": str(uuid.uuid4()),
                "shift_id": shift_id,
                "latitude": 200.0,  # Invalid!
                "longitude": 74.3587,
                "device_timestamp": "2026-09-27T08:41:12Z",
            }
        ]
    }
    response = await client.post("/api/v0/locations/batch", json=payload, headers=auth_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_nonexistent_shift_rejection(client: AsyncClient, auth_headers: dict[str, str]):
    """Test location batch referencing a nonexistent shift returns 400 Bad Request."""
    nonexistent_shift_id = str(uuid.uuid4())
    payload = {
        "locations": [
            {
                "id": str(uuid.uuid4()),
                "shift_id": nonexistent_shift_id,
                "latitude": 31.5204,
                "longitude": 74.3587,
                "device_timestamp": "2026-09-27T08:41:12Z",
            }
        ]
    }
    response = await client.post("/api/v0/locations/batch", json=payload, headers=auth_headers)
    assert response.status_code == 400
    assert "does not exist" in response.json()["detail"]


@pytest.mark.asyncio
async def test_batch_size_limit_exceeded(client: AsyncClient, auth_headers: dict[str, str]):
    """Test sending batch with 501 locations (exceeding 500 max limit) returns 422."""
    shift_id = await create_test_shift(client, auth_headers)
    locations = [
        {
            "id": str(uuid.uuid4()),
            "shift_id": shift_id,
            "latitude": 31.5204,
            "longitude": 74.3587,
            "device_timestamp": "2026-09-27T08:41:12Z",
        }
        for _ in range(501)
    ]
    payload = {"locations": locations}
    response = await client.post("/api/v0/locations/batch", json=payload, headers=auth_headers)
    assert response.status_code == 422
    assert "500" in str(response.json())


@pytest.mark.asyncio
async def test_server_side_received_at_timestamp(client: AsyncClient, auth_headers: dict[str, str]):
    """Test that server generates received_at timestamp server-side."""
    shift_id = await create_test_shift(client, auth_headers)
    loc_id = str(uuid.uuid4())
    payload = {
        "locations": [
            {
                "id": loc_id,
                "shift_id": shift_id,
                "latitude": 31.5204,
                "longitude": 74.3587,
                "device_timestamp": "2026-09-27T08:41:12Z",
            }
        ]
    }
    await client.post("/api/v0/locations/batch", json=payload, headers=auth_headers)

    # Fetch stored location via debug endpoint to inspect received_at
    debug_res = await client.get(
        f"/api/v0/debug/shifts/{shift_id}/locations", headers=auth_headers
    )
    assert debug_res.status_code == 200
    loc_list = debug_res.json()
    assert len(loc_list) == 1
    assert loc_list[0]["id"] == loc_id
    assert loc_list[0]["received_at"] is not None
