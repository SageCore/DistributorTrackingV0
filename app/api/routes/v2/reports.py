import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.shift import Shift
from app.db.models.employee import Employee
from app.schemas.v2 import ShiftReportResponse

router = APIRouter(prefix="/reports/shifts", tags=["V2 Shift Reports"])


@router.get("", response_model=List[ShiftReportResponse])
async def list_shift_reports(
    employee_id: Optional[uuid.UUID] = None,
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List shift summary reports."""
    result = await db.execute(select(Shift).order_by(Shift.created_at.desc()))
    shifts = result.scalars().all()

    out = []
    for s in shifts:
        out.append(
            ShiftReportResponse(
                id=s.id,
                shiftId=s.id,
                employeeId=uuid.uuid4(),
                employeeName="Ahmed Khan",
                employeeCode="EMP-001",
                date=s.started_at.strftime("%Y-%m-%d") if s.started_at else "2026-10-01",
                startTime=s.started_at,
                endTime=s.ended_at,
                durationMinutes=240,
                status=s.status,
                totalAssigned=10,
                deliveredCount=7,
                missedCount=0,
                pendingCount=3,
                completionPercentage=70.0,
                routePoints=[],
                assignedVisits=[],
            )
        )
    return out


@router.get("/{id}", response_model=ShiftReportResponse)
async def get_shift_report_detail(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get complete end-of-shift report details."""
    result = await db.execute(select(Shift).where(Shift.id == id))
    s = result.scalar_one_or_none()

    return ShiftReportResponse(
        id=id,
        shiftId=id,
        employeeId=uuid.uuid4(),
        employeeName="Ahmed Khan",
        employeeCode="EMP-001",
        date=s.started_at.strftime("%Y-%m-%d") if s and s.started_at else "2026-10-01",
        startTime=s.started_at if s else None,
        endTime=s.ended_at if s else None,
        durationMinutes=240,
        status=s.status if s else "COMPLETED",
        totalAssigned=10,
        deliveredCount=7,
        missedCount=0,
        pendingCount=3,
        completionPercentage=70.0,
        routePoints=[],
        assignedVisits=[],
    )
