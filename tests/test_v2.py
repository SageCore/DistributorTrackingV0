import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_v2_auth_login():
    """Test V2 admin login endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v2/auth/login",
            json={"username": "admin@distributor.com", "password": "password123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["username"] == "admin@distributor.com"
        assert data["user"]["distributor_name"] == "Al-Rehman Distribution"


@pytest.mark.asyncio
async def test_v2_dashboard_summary():
    """Test V2 dashboard summary endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v2/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "totalEmployees" in data
        assert "activeShifts" in data
        assert "totalAssignedToday" in data
        assert "deliveredToday" in data
        assert "pendingToday" in data
        assert "missedToday" in data


@pytest.mark.asyncio
async def test_v2_list_employees():
    """Test V2 employees list endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v2/employees")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_v2_create_employee():
    """Test V2 employee creation endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "name": "Tariq Mahmood",
            "employeeCode": "EMP-999",
            "phone": "+92 300 9998877",
            "active": True,
        }
        response = await ac.post("/api/v2/employees", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Tariq Mahmood"
        assert data["employee_code"] == "EMP-999"


@pytest.mark.asyncio
async def test_v2_locations_crud():
    """Test V2 customer location creation and listing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "name": "Al-Madina Store",
            "code": "SHOP-101",
            "address": "Commercial Area, Lahore",
            "latitude": 31.5204,
            "longitude": 74.3587,
            "active": True,
        }
        create_res = await ac.post("/api/v2/locations", json=payload)
        assert create_res.status_code == 201
        loc_data = create_res.json()
        assert loc_data["name"] == "Al-Madina Store"
        assert loc_data["latitude"] == 31.5204

        list_res = await ac.get("/api/v2/locations")
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1


@pytest.mark.asyncio
async def test_v2_alerts_list():
    """Test V2 alerts listing endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v2/alerts")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        assert len(alerts) >= 1
        assert "message" in alerts[0]
