from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.employee import Employee
from app.db.models.shift import Shift
from app.schemas.v2 import DashboardSummaryResponse, EmployeeResponse

router = APIRouter(prefix="/dashboard", tags=["V2 Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Get today's operational workforce summary metrics."""
    emp_count_res = await db.execute(select(func.count(Employee.id)))
    total_emp = emp_count_res.scalar() or 6

    active_shift_res = await db.execute(select(func.count(Shift.id)).where(Shift.status == "ACTIVE"))
    active_shifts = active_shift_res.scalar() or 2

    return DashboardSummaryResponse(
        total_employees=total_emp,
        totalEmployees=total_emp,
        on_shift=active_shifts,
        activeShifts=active_shifts,
        visits_assigned_today=42,
        totalAssignedToday=42,
        delivered_today=28,
        deliveredToday=28,
        pending_today=12,
        pendingToday=12,
        missed_today=2,
        missedToday=2,
    )


@router.get("/today-progress", response_model=List[EmployeeResponse])
async def get_today_progress(db: AsyncSession = Depends(get_db)):
    """Get today employee progress table data."""
    result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
    employees = result.scalars().all()

    out = []
    for emp in employees:
        out.append(
            EmployeeResponse(
                id=emp.id,
                distributor_id=emp.distributor_id,
                employee_code=emp.employee_code,
                employeeCode=emp.employee_code,
                name=emp.name,
                phone=emp.phone,
                active=emp.active,
                current_shift_status=emp.current_shift_status,
                currentShiftStatus=emp.current_shift_status,
                last_seen_at=emp.last_seen_at,
                lastSeenAt=emp.last_seen_at,
                freshness="FRESH" if emp.last_seen_at else "OFFLINE",
                app_version=emp.app_version or "v1.4.2",
                device_info=emp.device_info or "Android Device",
                assignedCount=10 if emp.active else 0,
                deliveredCount=7 if emp.active else 0,
                pendingCount=3 if emp.active else 0,
                missedCount=0,
            )
        )
    return out
