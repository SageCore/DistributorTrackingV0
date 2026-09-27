from fastapi import APIRouter

from app.api.routes import debug, health, locations, shifts

api_v0_router = APIRouter(prefix="/api/v0")
api_v0_router.include_router(shifts.router)
api_v0_router.include_router(locations.router)
api_v0_router.include_router(debug.router)

health_router = health.router
