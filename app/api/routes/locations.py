from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_api_key
from app.db.session import get_db
from app.schemas.location import LocationBatchCreate, LocationBatchResponse
from app.services import location_service

router = APIRouter(
    prefix="/locations",
    tags=["Locations"],
    dependencies=[Depends(verify_api_key)],
)


@router.post("/batch", response_model=LocationBatchResponse)
async def upload_location_batch(
    payload: LocationBatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """Ingests a batch of GPS location records (maximum 500 records per request).

    Supports idempotent updates and client-side room synchronization.
    """
    return await location_service.process_location_batch(db, payload)
