# Distributor GPS Tracking — Backend V0

The initial server-side backend for the **Distributor GPS Tracking** system. The purpose of this V0 backend is to prove reliable, high-integrity GPS data ingestion from Android devices, offline shift management, location batching, UUID-based deduplication, PostgreSQL persistence, and containerized deployment.

---

## 1. Project Purpose & V0 Scope

### Included in V0:
- **HTTPS API Connectivity**: Android client connection endpoints for shifts & GPS location ingestion.
- **Client-Generated Shift IDs**: Support for Android offline shift creation and registration.
- **Batch Location Uploads**: Ingestion of up to 500 GPS location points in a single HTTP request.
- **Idempotency & Deduplication**: Database primary key UUID constraints prevent duplicate records upon mobile network retries.
- **Separation of Timestamps**: Android `device_timestamp` vs server-generated `received_at`.
- **PostgreSQL Data Persistence**: Reliable relational storage using SQLAlchemy 2.x and Alembic schema migrations.
- **Developer Debugging & Inspection**: API endpoints for inspecting shifts, locations, and system statistics.
- **Containerization**: Full Docker Compose local environment with persistent named volumes.

### Excluded from V0 (Future V1+ Scope):
- Real employee user accounts / OAuth / JWT logins.
- Organizations, multi-tenancy, territories, geofence polygon alerts.
- Live maps, WebSockets, real-time tracking streams.
- Celery / Redis / Kafka queues or microservice architectures.

---

## 2. Technology Stack

- **Framework**: Python 3.11+ / FastAPI 0.115+
- **Database**: PostgreSQL 16
- **ORM & Migrations**: SQLAlchemy 2.0+ (Async engine) & Alembic
- **Data Validation & Settings**: Pydantic v2 & Pydantic Settings
- **Testing**: Pytest & HTTPX (Async test suite)
- **Containerization**: Docker & Docker Compose

---

## 3. Project Architecture & Folder Structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI application initialization & middleware
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py             # Route aggregator (/api/v0)
│   │   └── routes/
│   │       ├── health.py         # GET /health & GET /health/db
│   │       ├── shifts.py         # POST /api/v0/shifts & complete
│   │       ├── locations.py      # POST /api/v0/locations/batch
│   │       └── debug.py          # GET /api/v0/debug/*
│   ├── core/
│   │   ├── config.py             # Pydantic Settings environment configuration
│   │   ├── logging.py            # Structured logging setup
│   │   └── security.py           # Constant-time X-API-Key authentication
│   ├── db/
│   │   ├── base.py               # DeclarativeBase foundation
│   │   ├── session.py            # Async SQLAlchemy engine & session dependency
│   │   └── models/
│   │       ├── shift.py          # Shift ORM model
│   │       └── location.py       # Location ORM model
│   ├── schemas/
│   │   ├── common.py             # Health & Root response models
│   │   ├── shift.py              # Shift request/response validation schemas
│   │   └── location.py           # Location & Batch upload validation schemas
│   └── services/
│       ├── shift_service.py      # Business logic for shifts & idempotency
│       └── location_service.py   # Business logic for batch ingestion & deduplication
├── alembic/
│   ├── env.py                    # Alembic migration environment
│   └── versions/                 # Revision scripts (001_initial_v0_schema.py)
├── tests/                        # Automated unit & integration tests
├── Dockerfile                    # Container definition
├── docker-compose.yml            # Local development orchestration
├── .env.example                  # Environment configuration template
├── .gitignore
├── alembic.ini                   # Migration configuration
├── README.md                     # System documentation
└── V0_TEST_PLAN.md               # Verification test plan
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Supported Environment Variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `APP_NAME` | `Distributor Tracker API` | Application display name |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:postgres@db:5432/distributor_tracker` | Database connection string |
| `V0_API_KEY` | `v0-distributor-secret-key-change-in-prod` | Shared secret key required in `X-API-Key` header |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `DEBUG` | `true` | Enables debug endpoints and detailed exception responses |

> **Security Note**: Never commit `.env` or production API keys to git repository.

---

## 5. Local Execution via Docker Compose

To build and launch the application and PostgreSQL database containers:

```bash
docker compose up --build
```

The container automatically executes Alembic database migrations (`alembic upgrade head`) on startup before launching the FastAPI application server on port `8000`.

To stop the services while preserving data:
```bash
docker compose down
```

To stop services and remove local persistent database volumes (**Destructive**):
```bash
docker compose down -v
```

---

## 6. Database Migrations

Database migrations are managed via Alembic.

### Running Migrations Manually:
```bash
# Inside Docker container
docker compose exec api alembic upgrade head

# Locally (if connected to database)
alembic upgrade head
```

### Generating New Migrations:
```bash
alembic revision -m "description_of_change"
```

---

## 7. Running Automated Tests

Run the test suite using pytest:

```bash
python -m pytest -v
```

---

## 8. API Documentation & Authentication

Interactive API documentation is generated automatically by OpenAPI:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Authentication Mechanism:
All endpoints under `/api/v0/` require the `X-API-Key` header.

Example Header:
```http
X-API-Key: v0-distributor-secret-key-change-in-prod
```
- Missing key returns `401 Unauthorized`.
- Invalid key returns `403 Forbidden`.

Public endpoints (no key required):
- `GET /`
- `GET /health`
- `GET /health/db`

---

## 9. API Endpoint Summary & Example Curl Commands

### 9.1 Public Health Check
```bash
curl -X GET http://localhost:8000/health
```
Response:
```json
{
  "status": "ok",
  "database": "ok"
}
```

### 9.2 Register Shift (Idempotent)
```bash
curl -X POST http://localhost:8000/api/v0/shifts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "id": "a0000000-0000-0000-0000-000000000001",
    "device_id": "phone-device-uuid-123",
    "started_at": "2026-09-27T08:30:00Z"
  }'
```
Response (201 Created on first attempt, 200 OK on retry):
```json
{
  "id": "a0000000-0000-0000-0000-000000000001",
  "device_id": "phone-device-uuid-123",
  "started_at": "2026-09-27T08:30:00Z",
  "ended_at": null,
  "status": "ACTIVE",
  "created_at": "2026-09-27T08:30:01Z",
  "updated_at": "2026-09-27T08:30:01Z",
  "created": true
}
```

### 9.3 Complete Shift
```bash
curl -X POST http://localhost:8000/api/v0/shifts/a0000000-0000-0000-0000-000000000001/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "ended_at": "2026-09-27T17:00:00Z"
  }'
```

### 9.4 Batch Location Ingestion
```bash
curl -X POST http://localhost:8000/api/v0/locations/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod" \
  -d '{
    "locations": [
      {
        "id": "b0000000-0000-0000-0000-000000000001",
        "shift_id": "a0000000-0000-0000-0000-000000000001",
        "latitude": 31.5204,
        "longitude": 74.3587,
        "accuracy_meters": 5.2,
        "altitude_meters": 210.0,
        "speed_mps": 3.1,
        "bearing_degrees": 120.0,
        "device_timestamp": "2026-09-27T08:41:12Z",
        "recorded_timestamp": "2026-09-27T08:41:12Z",
        "is_mock": false
      }
    ]
  }'
```
Response:
```json
{
  "received": 1,
  "inserted": 1,
  "duplicates": 0,
  "rejected": 0,
  "accepted_ids": [
    "b0000000-0000-0000-0000-000000000001"
  ]
}
```

### 9.5 Debug Inspection Stats
```bash
curl -X GET http://localhost:8000/api/v0/debug/stats \
  -H "X-API-Key: v0-distributor-secret-key-change-in-prod"
```

---

## 10. Direct Database Inspection

To connect directly to the running PostgreSQL container:

```bash
docker compose exec db psql -U postgres -d distributor_tracker
```

Useful SQL queries:
```sql
-- View all registered shifts
SELECT id, device_id, started_at, ended_at, status FROM shifts;

-- View location counts grouped by shift
SELECT shift_id, COUNT(*) FROM locations GROUP BY shift_id;

-- View latest 10 uploaded locations
SELECT id, shift_id, latitude, longitude, device_timestamp, received_at FROM locations ORDER BY received_at DESC LIMIT 10;
```

---

## 11. AWS Deployment & Production Database Transition

### AWS Lightsail Deployment Overview:
1. Provision Ubuntu 22.04 LTS Lightsail instance.
2. Install Docker and Docker Compose plugin.
3. Clone repository and configure `.env` with production `V0_API_KEY` and database credentials.
4. Launch via `docker compose up -d`.
5. Place a reverse proxy (e.g., Caddy or Nginx) in front of port 8000 for TLS/HTTPS termination (Let's Encrypt).

### Transition to AWS Managed Database (RDS / Lightsail Database):
To switch from containerized PostgreSQL to a managed cloud database, simply update the `DATABASE_URL` environment variable:

```ini
DATABASE_URL=postgresql+asyncpg://dbuser:dbpass@managed-db-endpoint.rds.amazonaws.com:5432/distributor_tracker
```
Zero code changes are required in models, services, or controllers.
