# Distributor GPS Tracking — V0 Manual Test Plan

This document details manual verification procedures to validate the Distributor GPS Tracking V0 backend.

---

## TEST 1 — Start Services

### Command:
```bash
docker compose up --build
```

### Expected Behavior:
- Docker builds the `api` image successfully.
- PostgreSQL container (`db`) starts and passes healthchecks (`service_healthy`).
- `api` container waits for `db` health check, then runs `alembic upgrade head`.
- Alembic completes revision `001_initial_v0_schema`.
- FastAPI server starts on port `8000`.

---

## TEST 2 — Health Verification

### Command:
```bash
curl -i http://localhost:8000/health
```

### Expected Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "status": "ok",
    "database": "ok"
}
```

---

## TEST 3 — Invalid Authentication Protection

### Command 3A (Missing Header):
```bash
curl -i -X POST http://localhost:8000/api/v0/shifts -H "Content-Type: application/json" -d '{}'
```
Expected: `HTTP/1.1 401 Unauthorized`

### Command 3B (Invalid Key):
```bash
curl -i -X POST http://localhost:8000/api/v0/shifts -H "Content-Type: application/json" -H "X-API-Key: invalid-key" -d '{}'
```
Expected: `HTTP/1.1 403 Forbidden`

---

## TEST 4 — Create Shift

### Command:
```bash
curl -i -X POST http://localhost:8000/api/v0/shifts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "id": "10000000-0000-0000-0000-000000000001",
    "device_id": "test-device-uuid-1",
    "started_at": "2026-09-27T08:00:00Z"
  }'
```

### Expected Response:
`HTTP/1.1 201 Created`
```json
{
    "id": "10000000-0000-0000-0000-000000000001",
    "device_id": "test-device-uuid-1",
    "started_at": "2026-09-27T08:00:00Z",
    "ended_at": null,
    "status": "ACTIVE",
    "created": true
}
```

---

## TEST 5 — Duplicate Shift (Idempotency Retry)

### Command:
Re-run the exact same `POST /api/v0/shifts` request from Test 4.

### Expected Response:
`HTTP/1.1 200 OK`
```json
{
    "id": "10000000-0000-0000-0000-000000000001",
    "device_id": "test-device-uuid-1",
    "started_at": "2026-09-27T08:00:00Z",
    "ended_at": null,
    "status": "ACTIVE",
    "created": false
}
```

---

## TEST 6 — Location Batch Ingestion

### Command:
Upload a batch of 10 valid locations referencing the created shift:
```bash
curl -i -X POST http://localhost:8000/api/v0/locations/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "locations": [
      {"id": "20000000-0000-0000-0000-000000000001", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5201, "longitude": 74.3581, "device_timestamp": "2026-09-27T08:01:00Z"},
      {"id": "20000000-0000-0000-0000-000000000002", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5202, "longitude": 74.3582, "device_timestamp": "2026-09-27T08:02:00Z"},
      {"id": "20000000-0000-0000-0000-000000000003", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5203, "longitude": 74.3583, "device_timestamp": "2026-09-27T08:03:00Z"},
      {"id": "20000000-0000-0000-0000-000000000004", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5204, "longitude": 74.3584, "device_timestamp": "2026-09-27T08:04:00Z"},
      {"id": "20000000-0000-0000-0000-000000000005", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5205, "longitude": 74.3585, "device_timestamp": "2026-09-27T08:05:00Z"},
      {"id": "20000000-0000-0000-0000-000000000006", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5206, "longitude": 74.3586, "device_timestamp": "2026-09-27T08:06:00Z"},
      {"id": "20000000-0000-0000-0000-000000000007", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5207, "longitude": 74.3587, "device_timestamp": "2026-09-27T08:07:00Z"},
      {"id": "20000000-0000-0000-0000-000000000008", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5208, "longitude": 74.3588, "device_timestamp": "2026-09-27T08:08:00Z"},
      {"id": "20000000-0000-0000-0000-000000000009", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5209, "longitude": 74.3589, "device_timestamp": "2026-09-27T08:09:00Z"},
      {"id": "20000000-0000-0000-0000-000000000010", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5210, "longitude": 74.3590, "device_timestamp": "2026-09-27T08:10:00Z"}
    ]
  }'
```

### Expected Response:
```json
{
    "received": 10,
    "inserted": 10,
    "duplicates": 0,
    "rejected": 0,
    "accepted_ids": [ ... 10 UUIDs ... ]
}
```

---

## TEST 7 — Duplicate Location Batch Retry

### Command:
Re-run the exact same location batch request from Test 6.

### Expected Response:
```json
{
    "received": 10,
    "inserted": 0,
    "duplicates": 10,
    "rejected": 0,
    "accepted_ids": [ ... 10 UUIDs ... ]
}
```

---

## TEST 8 — Partial Duplicate Batch

### Command:
Send a batch with overlapping UUIDs (2 duplicates + 3 new items):
```bash
curl -i -X POST http://localhost:8000/api/v0/locations/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "locations": [
      {"id": "20000000-0000-0000-0000-000000000009", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5209, "longitude": 74.3589, "device_timestamp": "2026-09-27T08:09:00Z"},
      {"id": "20000000-0000-0000-0000-000000000010", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5210, "longitude": 74.3590, "device_timestamp": "2026-09-27T08:10:00Z"},
      {"id": "20000000-0000-0000-0000-000000000011", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5211, "longitude": 74.3591, "device_timestamp": "2026-09-27T08:11:00Z"},
      {"id": "20000000-0000-0000-0000-000000000012", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5212, "longitude": 74.3592, "device_timestamp": "2026-09-27T08:12:00Z"},
      {"id": "20000000-0000-0000-0000-000000000013", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 31.5213, "longitude": 74.3593, "device_timestamp": "2026-09-27T08:13:00Z"}
    ]
  }'
```

### Expected Response:
```json
{
    "received": 5,
    "inserted": 3,
    "duplicates": 2,
    "rejected": 0,
    "accepted_ids": [ ... 5 UUIDs ... ]
}
```

---

## TEST 9 — Invalid Location Validation

### Command:
```bash
curl -i -X POST http://localhost:8000/api/v0/locations/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "locations": [
      {"id": "20000000-0000-0000-0000-000000000099", "shift_id": "10000000-0000-0000-0000-000000000001", "latitude": 200.0, "longitude": 74.3581, "device_timestamp": "2026-09-27T08:01:00Z"}
    ]
  }'
```

### Expected Response:
`HTTP/1.1 422 Unprocessable Entity` (Schema validation failure, 0 rows inserted).

---

## TEST 10 — Data Persistence Across Container Restarts

### Command:
```bash
docker compose restart
```

### Verification:
```bash
curl -s http://localhost:8000/api/v0/debug/stats -H "X-API-Key: v0-distributor-secret-key-change-in-prod"
```

### Expected Outcome:
Total shifts = 1, Total locations = 13 (data persisted across container restarts in named volume `postgres_data`).

---

## TEST 11 — Debug Inspection Endpoints

### Command:
```bash
curl -s "http://localhost:8000/api/v0/debug/shifts/10000000-0000-0000-0000-000000000001/locations?limit=5&order=desc" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod"
```

### Expected Outcome:
Returns array of 5 location objects with separate `device_timestamp` and server `received_at` timestamps.
