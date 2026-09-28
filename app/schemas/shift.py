from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ShiftCreate(BaseModel):
    """Schema for registering/creating a shift (phone-generated UUID)."""

    id: UUID = Field(..., description="UUID generated locally by the Android application")
    device_id: str = Field(..., min_length=1, max_length=255, description="Device UUID or installation identifier")
    started_at: datetime = Field(..., description="ISO 8601 shift start timestamp")


class ShiftComplete(BaseModel):
    """Schema for completing a shift."""

    ended_at: datetime = Field(..., description="ISO 8601 shift end timestamp")


class ShiftResponse(BaseModel):
    """Response schema for shift details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_id: str
    started_at: datetime
    ended_at: datetime | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ShiftCreateResponse(ShiftResponse):
    """Response schema when registering a shift, including idempotency indicator."""

    created: bool = Field(..., description="True if new shift created, False if existing shift returned")


class ShiftWithCountResponse(ShiftResponse):
    """Response schema for shift details including total synchronized location count."""

    location_count: int = Field(default=0, description="Total synchronized location points for this shift")
    last_location_time: datetime | None = Field(default=None, description="Device timestamp of the latest route point")

