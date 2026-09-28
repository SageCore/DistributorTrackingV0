from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models.location import Location
from app.db.models.shift import Shift
from app.schemas.shift import ShiftComplete, ShiftCreate


async def register_shift(db: AsyncSession, shift_data: ShiftCreate) -> tuple[Shift, bool]:
    """Registers a shift idempotently using phone-generated UUID.

    Returns a tuple of (Shift, created_flag).
    """
    result = await db.execute(select(Shift).where(Shift.id == shift_data.id))
    existing_shift = result.scalar_one_or_none()

    if existing_shift:
        logger.info(f"Shift retry received for shift_id={shift_data.id}. Returning existing shift.")
        return existing_shift, False

    new_shift = Shift(
        id=shift_data.id,
        device_id=shift_data.device_id,
        started_at=shift_data.started_at,
        status="ACTIVE",
    )
    db.add(new_shift)
    await db.commit()
    await db.refresh(new_shift)

    logger.info(f"Shift registered successfully: shift_id={new_shift.id}, device_id={new_shift.device_id}")
    return new_shift, True


async def complete_shift(db: AsyncSession, shift_id: UUID, complete_data: ShiftComplete) -> Shift:
    """Completes a shift idempotently."""
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    shift = result.scalar_one_or_none()

    if not shift:
        logger.warning(f"Attempted to complete nonexistent shift: shift_id={shift_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Shift with ID '{shift_id}' not found",
        )

    shift.ended_at = complete_data.ended_at
    shift.status = "COMPLETED"
    shift.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(shift)

    logger.info(f"Shift completed: shift_id={shift.id}, ended_at={shift.ended_at}")
    return shift


async def get_shift_by_id(db: AsyncSession, shift_id: UUID) -> Shift | None:
    """Fetches a shift by ID."""
    result = await db.execute(select(Shift).where(Shift.id == shift_id))
    return result.scalar_one_or_none()


async def list_shifts(
    db: AsyncSession, limit: int = 100, offset: int = 0, status_filter: str | None = None
) -> list[Shift]:
    """Lists shifts with optional status filtering and pagination."""
    query = select(Shift).order_by(Shift.created_at.desc())

    if status_filter:
        query = query.where(Shift.status == status_filter.upper())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def list_shifts_with_counts(
    db: AsyncSession, limit: int = 50, offset: int = 0, status_filter: str | None = None
) -> list[dict]:
    """Lists shifts with location counts and latest point timestamps via a single grouped query."""
    query = (
        select(
            Shift,
            func.count(Location.id).label("location_count"),
            func.max(Location.device_timestamp).label("last_location_time"),
        )
        .outerjoin(Location, Shift.id == Location.shift_id)
        .group_by(Shift.id)
        .order_by(Shift.started_at.desc())
    )

    if status_filter:
        query = query.where(Shift.status == status_filter.upper())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)

    shifts_with_counts = []
    for row in result.all():
        shift_obj, loc_count, max_time = row
        shifts_with_counts.append({
            "id": shift_obj.id,
            "device_id": shift_obj.device_id,
            "started_at": shift_obj.started_at,
            "ended_at": shift_obj.ended_at,
            "status": shift_obj.status,
            "created_at": shift_obj.created_at,
            "updated_at": shift_obj.updated_at,
            "location_count": loc_count or 0,
            "last_location_time": max_time,
        })
    return shifts_with_counts


async def get_shift_with_count(db: AsyncSession, shift_id: UUID) -> dict | None:
    """Fetches a single shift by ID with location count and latest location timestamp."""
    query = (
        select(
            Shift,
            func.count(Location.id).label("location_count"),
            func.max(Location.device_timestamp).label("last_location_time"),
        )
        .outerjoin(Location, Shift.id == Location.shift_id)
        .where(Shift.id == shift_id)
        .group_by(Shift.id)
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        return None

    shift_obj, loc_count, max_time = row
    return {
        "id": shift_obj.id,
        "device_id": shift_obj.device_id,
        "started_at": shift_obj.started_at,
        "ended_at": shift_obj.ended_at,
        "status": shift_obj.status,
        "created_at": shift_obj.created_at,
        "updated_at": shift_obj.updated_at,
        "location_count": loc_count or 0,
        "last_location_time": max_time,
    }
