from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """Public health check endpoint testing application and database status."""
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "error", "database": db_status},
        )

    return HealthResponse(status="ok", database=db_status)


@router.get("/health/db", response_model=HealthResponse)
async def health_db_check(db: AsyncSession = Depends(get_db)):
    """Dedicated database health check endpoint."""
    return await health_check(db)


@router.get("/api/health", response_model=HealthResponse)
async def health_api_check(db: AsyncSession = Depends(get_db)):
    """Alias for /health under /api prefix."""
    return await health_check(db)
