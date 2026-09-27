from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check endpoint response schema."""

    status: str = "ok"
    database: str = "ok"


class RootResponse(BaseModel):
    """Root endpoint response schema."""

    name: str
    version: str


class DebugStatsResponse(BaseModel):
    """Debug statistics response schema."""

    total_shifts: int
    active_shifts: int
    completed_shifts: int
    total_locations: int
    latest_location_received_at: str | None
