from uuid import UUID
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_api_key
from app.db.session import get_db
from app.schemas.shift import ShiftComplete, ShiftCreate, ShiftCreateResponse, ShiftResponse
from app.services import shift_service

router = APIRouter(
    prefix="/shifts",
    tags=["Shifts"],
    dependencies=[Depends(verify_api_key)],
)


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


@router.post("/{shift_id}/complete", response_model=ShiftResponse)
async def complete_shift(
    shift_id: UUID,
    payload: ShiftComplete,
    db: AsyncSession = Depends(get_db),
):
    """Completes an active shift."""
    return await shift_service.complete_shift(db, shift_id, payload)
