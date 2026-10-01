import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.customer_location import CustomerLocation
from app.schemas.v2 import LocationCreate, LocationResponse, LocationUpdate

router = APIRouter(prefix="/locations", tags=["V2 Customer Locations"])


@router.get("", response_model=List[LocationResponse])
async def list_locations(db: AsyncSession = Depends(get_db)):
    """List all customer / shop business locations."""
    result = await db.execute(select(CustomerLocation).order_by(CustomerLocation.created_at.desc()))
    locations = result.scalars().all()

    out = []
    for loc in locations:
        out.append(
            LocationResponse(
                id=loc.id,
                distributor_id=loc.distributor_id,
                name=loc.name,
                code=loc.code,
                address=loc.address,
                contact_name=loc.contact_name,
                contactName=loc.contact_name,
                phone=loc.phone,
                notes=loc.notes,
                latitude=loc.latitude,
                longitude=loc.longitude,
                active=loc.active,
            )
        )
    return out


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(body: LocationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new customer location with lat/lng coordinates."""
    code = body.code or f"LOC-{uuid.uuid4().hex[:4].upper()}"
    contact = body.contact_name or body.contactName

    loc = CustomerLocation(
        name=body.name,
        code=code,
        address=body.address,
        contact_name=contact,
        phone=body.phone,
        notes=body.notes,
        latitude=body.latitude,
        longitude=body.longitude,
        active=body.active,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)

    return LocationResponse(
        id=loc.id,
        distributor_id=loc.distributor_id,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        contact_name=loc.contact_name,
        contactName=loc.contact_name,
        phone=loc.phone,
        notes=loc.notes,
        latitude=loc.latitude,
        longitude=loc.longitude,
        active=loc.active,
    )


@router.get("/{id}", response_model=LocationResponse)
async def get_location(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get location detail by ID."""
    result = await db.execute(select(CustomerLocation).where(CustomerLocation.id == id))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    return LocationResponse(
        id=loc.id,
        distributor_id=loc.distributor_id,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        contact_name=loc.contact_name,
        contactName=loc.contact_name,
        phone=loc.phone,
        notes=loc.notes,
        latitude=loc.latitude,
        longitude=loc.longitude,
        active=loc.active,
    )


@router.patch("/{id}", response_model=LocationResponse)
async def update_location(id: uuid.UUID, body: LocationUpdate, db: AsyncSession = Depends(get_db)):
    """Update location coordinates or activate/deactivate."""
    result = await db.execute(select(CustomerLocation).where(CustomerLocation.id == id))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    if body.name is not None:
        loc.name = body.name
    if body.code is not None:
        loc.code = body.code
    if body.address is not None:
        loc.address = body.address
    if body.contact_name is not None:
        loc.contact_name = body.contact_name
    if body.phone is not None:
        loc.phone = body.phone
    if body.notes is not None:
        loc.notes = body.notes
    if body.latitude is not None:
        loc.latitude = body.latitude
    if body.longitude is not None:
        loc.longitude = body.longitude
    if body.active is not None:
        loc.active = body.active

    await db.commit()
    await db.refresh(loc)

    return LocationResponse(
        id=loc.id,
        distributor_id=loc.distributor_id,
        name=loc.name,
        code=loc.code,
        address=loc.address,
        contact_name=loc.contact_name,
        contactName=loc.contact_name,
        phone=loc.phone,
        notes=loc.notes,
        latitude=loc.latitude,
        longitude=loc.longitude,
        active=loc.active,
    )
