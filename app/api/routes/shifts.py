from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_api_key
from app.db.session import get_db
from app.schemas.location import LocationResponse
from app.schemas.shift import ShiftComplete, ShiftCreate, ShiftCreateResponse, ShiftResponse, ShiftWithCountResponse
from app.services import location_service, shift_service

router = APIRouter(
    prefix="/shifts",
    tags=["Shifts"],
    dependencies=[Depends(verify_api_key)],
)


@router.get("", response_model=list[ShiftWithCountResponse])
async def list_shifts(
    limit: int = Query(50, ge=1, le=200, description="Max number of shifts to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    status_filter: str | None = Query(None, alias="status", description="Filter by shift status (ACTIVE/COMPLETED)"),
    db: AsyncSession = Depends(get_db),
):
    """Lists synchronized shifts with location counts."""
    return await shift_service.list_shifts_with_counts(db, limit=limit, offset=offset, status_filter=status_filter)


@router.post("", response_model=ShiftCreateResponse)
async def register_shift(
    payload: ShiftCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Registers a new shift idempotently using a phone-generated UUID.

    Returns HTTP 201 Created if shift is newly registered, or HTTP 200 OK on retry.
    """
    shift, created = await shift_service.register_shift(db, payload)
    
    if created:
        response.status_code = status.HTTP_201_CREATED
    else:
        response.status_code = status.HTTP_200_OK

    return ShiftCreateResponse(
        id=shift.id,
        device_id=shift.device_id,
        started_at=shift.started_at,
        ended_at=shift.ended_at,
        status=shift.status,
        created_at=shift.created_at,
        updated_at=shift.updated_at,
        created=created,
    )


@router.get("/{shift_id}", response_model=ShiftWithCountResponse)
async def get_shift_detail(
    shift_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves shift summary details and location count by shift UUID."""
    shift_data = await shift_service.get_shift_with_count(db, shift_id)
    if not shift_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID '{shift_id}' not found",
        )
    return shift_data


@router.post("/{shift_id}/complete", response_model=ShiftResponse)
async def complete_shift(
    shift_id: UUID,
    payload: ShiftComplete,
    db: AsyncSession = Depends(get_db),
):
    """Completes an active shift."""
    return await shift_service.complete_shift(db, shift_id, payload)


@router.get("/{shift_id}/locations", response_model=list[LocationResponse])
async def list_shift_locations(
    shift_id: UUID,
    limit: int = Query(1000, ge=1, le=5000, description="Max location points to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order by device_timestamp (asc for route chronological order)"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves persistent route points associated with a specific shift in device timestamp order."""
    shift = await shift_service.get_shift_by_id(db, shift_id)
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID '{shift_id}' not found",
        )
    return await location_service.list_locations_for_shift(
        db, shift_id=shift_id, limit=limit, offset=offset, order=order
    )
