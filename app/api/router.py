from fastapi import APIRouter

from app.api.routes import debug, health, locations, shifts
from app.api.routes.v2 import auth, employees, locations as v2_locations, assignments, reports, dashboard, alerts

api_v0_router = APIRouter(prefix="/api/v0")
api_v0_router.include_router(shifts.router)
api_v0_router.include_router(locations.router)
api_v0_router.include_router(debug.router)

api_v2_router = APIRouter(prefix="/api/v2")
api_v2_router.include_router(auth.router)
api_v2_router.include_router(employees.router)
api_v2_router.include_router(v2_locations.router)
api_v2_router.include_router(assignments.router)
api_v2_router.include_router(reports.router)
api_v2_router.include_router(dashboard.router)
api_v2_router.include_router(alerts.router)

health_router = health.router
