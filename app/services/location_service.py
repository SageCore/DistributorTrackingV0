from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.db.models.location import Location
from app.db.models.shift import Shift
from app.schemas.common import DebugStatsResponse
from app.schemas.location import LocationBatchCreate, LocationBatchResponse


async def process_location_batch(
    db: AsyncSession, batch: LocationBatchCreate
) -> LocationBatchResponse:
    """Processes location batch with FK validation and UUID deduplication."""
    total_received = len(batch.locations)
    if total_received == 0:
        return LocationBatchResponse(
            received=0, inserted=0, duplicates=0, rejected=0, accepted_ids=[]
        )

    # 1. Validate that all referenced shifts exist in the database
    referenced_shift_ids = {loc.shift_id for loc in batch.locations}
    shifts_query = select(Shift.id).where(Shift.id.in_(referenced_shift_ids))
    result = await db.execute(shifts_query)
    existing_shift_ids = set(result.scalars().all())

    missing_shift_ids = referenced_shift_ids - existing_shift_ids
    if missing_shift_ids:
        missing_id_str = str(list(missing_shift_ids)[0])
        logger.warning(f"Batch rejected: referenced shift_id '{missing_id_str}' does not exist.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Referenced shift with ID '{missing_id_str}' does not exist",
        )

    # 2. Check for duplicate location UUIDs already present in DB
    all_location_ids = [loc.id for loc in batch.locations]
    locations_query = select(Location.id).where(Location.id.in_(all_location_ids))
    result = await db.execute(locations_query)
    existing_location_ids = set(result.scalars().all())

    now_utc = datetime.now(timezone.utc)
    new_locations: list[Location] = []

    # Filter out already existing location UUIDs to achieve idempotent insertions
    seen_in_batch: set[UUID] = set()
    duplicate_count = 0

    for loc in batch.locations:
        if loc.id in existing_location_ids or loc.id in seen_in_batch:
            duplicate_count += 1
            continue

        seen_in_batch.add(loc.id)
        new_locations.append(
            Location(
                id=loc.id,
                shift_id=loc.shift_id,
                latitude=loc.latitude,
                longitude=loc.longitude,
                accuracy_meters=loc.accuracy_meters,
                altitude_meters=loc.altitude_meters,
                speed_mps=loc.speed_mps,
                bearing_degrees=loc.bearing_degrees,
                device_timestamp=loc.device_timestamp,
                recorded_timestamp=loc.recorded_timestamp,
                is_mock=loc.is_mock,
                received_at=now_utc,
            )
        )

    if new_locations:
        db.add_all(new_locations)
        await db.commit()

    inserted_count = len(new_locations)
    logger.info(
        f"Location batch processed: received={total_received}, "
        f"inserted={inserted_count}, duplicates={duplicate_count}"
    )

    return LocationBatchResponse(
        received=total_received,
        inserted=inserted_count,
        duplicates=duplicate_count,
        rejected=0,
        accepted_ids=all_location_ids,
    )


async def list_locations_for_shift(
    db: AsyncSession,
    shift_id: UUID,
    limit: int = 100,
    offset: int = 0,
    order: str = "desc",
) -> list[Location]:
    """Lists location records for a specific shift with pagination."""
    query = select(Location).where(Location.shift_id == shift_id)

    if order.lower() == "asc":
        query = query.order_by(Location.device_timestamp.asc())
    else:
        query = query.order_by(Location.device_timestamp.desc())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_debug_stats(db: AsyncSession) -> DebugStatsResponse:
    """Computes summary statistics for testing and debugging."""
    total_shifts_res = await db.execute(select(func.count(Shift.id)))
    total_shifts = total_shifts_res.scalar() or 0

    active_shifts_res = await db.execute(
        select(func.count(Shift.id)).where(Shift.status == "ACTIVE")
    )
    active_shifts = active_shifts_res.scalar() or 0

    completed_shifts_res = await db.execute(
        select(func.count(Shift.id)).where(Shift.status == "COMPLETED")
    )
    completed_shifts = completed_shifts_res.scalar() or 0

    total_locations_res = await db.execute(select(func.count(Location.id)))
    total_locations = total_locations_res.scalar() or 0

    latest_loc_res = await db.execute(
        select(func.max(Location.received_at))
    )
    latest_loc_time = latest_loc_res.scalar()
    latest_str = latest_loc_time.isoformat() if latest_loc_time else None

    return DebugStatsResponse(
        total_shifts=total_shifts,
        active_shifts=active_shifts,
        completed_shifts=completed_shifts,
        total_locations=total_locations,
        latest_location_received_at=latest_str,
    )
