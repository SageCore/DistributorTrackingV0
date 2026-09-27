from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_api_key
from app.db.session import get_db
from app.schemas.common import DebugStatsResponse
from app.schemas.location import LocationResponse
from app.schemas.shift import ShiftResponse
from app.services import location_service, shift_service

router = APIRouter(
    prefix="/debug",
    tags=["Debug"],
    dependencies=[Depends(verify_api_key)],
)


def verify_debug_enabled():
    """Dependency ensuring debug endpoints are only accessible in debug/dev mode."""
    if not settings.DEBUG and settings.APP_ENV != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debug endpoints are disabled in production environment",
        )


@router.get("/shifts", response_model=list[ShiftResponse], dependencies=[Depends(verify_debug_enabled)])
async def list_shifts_debug(
    limit: int = Query(100, ge=1, le=500, description="Max number of records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    status_filter: str | None = Query(None, alias="status", description="Filter by shift status (ACTIVE/COMPLETED)"),
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint to list all shifts."""
    return await shift_service.list_shifts(db, limit=limit, offset=offset, status_filter=status_filter)


@router.get("/shifts/{shift_id}", response_model=ShiftResponse, dependencies=[Depends(verify_debug_enabled)])
async def get_shift_debug(
    shift_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint to retrieve shift details by ID."""
    shift = await shift_service.get_shift_by_id(db, shift_id)
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID '{shift_id}' not found",
        )
    return shift


@router.get("/shifts/{shift_id}/locations", response_model=list[LocationResponse], dependencies=[Depends(verify_debug_enabled)])
async def list_shift_locations_debug(
    shift_id: UUID,
    limit: int = Query(100, ge=1, le=500, description="Max location points to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order by device_timestamp"),
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint to retrieve locations belonging to a specific shift."""
    # Ensure shift exists
    shift = await shift_service.get_shift_by_id(db, shift_id)
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID '{shift_id}' not found",
        )
    return await location_service.list_locations_for_shift(
        db, shift_id=shift_id, limit=limit, offset=offset, order=order
    )


@router.get("/stats", response_model=DebugStatsResponse, dependencies=[Depends(verify_debug_enabled)])
async def get_debug_stats(
    db: AsyncSession = Depends(get_db),
):
    """Debug endpoint returning summary statistics of shifts and locations."""
    return await location_service.get_debug_stats(db)
