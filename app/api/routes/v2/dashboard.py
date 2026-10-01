from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.employee import Employee
from app.db.models.shift import Shift
from app.db.models.daily_assignment import DailyAssignment
from app.db.models.assigned_visit import AssignedVisit
from app.schemas.v2 import DashboardSummaryResponse, EmployeeResponse

router = APIRouter(prefix="/dashboard", tags=["V2 Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Get today's operational workforce summary metrics calculated directly from database."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    emp_count_res = await db.execute(select(func.count(Employee.id)))
    total_emp = emp_count_res.scalar() or 0

    active_shift_res = await db.execute(select(func.count(Shift.id)).where(Shift.status == "ACTIVE"))
    active_shifts = active_shift_res.scalar() or 0

    # Count today's assigned visits
    asgn_res = await db.execute(select(DailyAssignment.id).where(DailyAssignment.date == today_str))
    asgn_ids = [r for r in asgn_res.scalars().all()]

    total_assigned = 0
    delivered = 0
    pending = 0
    missed = 0

    if asgn_ids:
        v_res = await db.execute(select(AssignedVisit).where(AssignedVisit.assignment_id.in_(asgn_ids)))
        visits = v_res.scalars().all()
        total_assigned = len(visits)
        for v in visits:
            if v.status == "DELIVERED":
                delivered += 1
            elif v.status == "MISSED":
                missed += 1
            else:
                pending += 1

    return DashboardSummaryResponse(
        total_employees=total_emp,
        totalEmployees=total_emp,
        on_shift=active_shifts,
        activeShifts=active_shifts,
        visits_assigned_today=total_assigned,
        totalAssignedToday=total_assigned,
        delivered_today=delivered,
        deliveredToday=delivered,
        pending_today=pending,
        pendingToday=pending,
        missed_today=missed,
        missedToday=missed,
    )


@router.get("/today-progress", response_model=List[EmployeeResponse])
async def get_today_progress(db: AsyncSession = Depends(get_db)):
    """Get today employee progress table data from database."""
    result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
    employees = result.scalars().all()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    out = []
    for emp in employees:
        shift_res = await db.execute(
            select(Shift).where(Shift.employee_id == emp.id, Shift.status == "ACTIVE").order_by(Shift.started_at.desc())
        )
        active_shift = shift_res.scalar_one_or_none()
        current_status = "ACTIVE" if active_shift else (emp.current_shift_status or "NOT_STARTED")

        # Get assigned visits today
        asgn_res = await db.execute(
            select(DailyAssignment).where(DailyAssignment.employee_id == emp.id, DailyAssignment.date == today_str)
        )
        asgn = asgn_res.scalar_one_or_none()

        delivered_cnt = 0
        assigned_cnt = 0
        pending_cnt = 0
        missed_cnt = 0

        if asgn:
            v_res = await db.execute(select(AssignedVisit).where(AssignedVisit.assignment_id == asgn.id))
            visits = v_res.scalars().all()
            assigned_cnt = len(visits)
            for v in visits:
                if v.status == "DELIVERED":
                    delivered_cnt += 1
                elif v.status == "MISSED":
                    missed_cnt += 1
                else:
                    pending_cnt += 1

        last_seen = active_shift.started_at if active_shift else emp.last_seen_at
        freshness = "OFFLINE"
        if last_seen:
            diff_min = (datetime.now(timezone.utc) - last_seen).total_seconds() / 60
            freshness = "FRESH" if diff_min < 2 else ("STALE" if diff_min <= 10 else "OFFLINE")

        out.append(
            EmployeeResponse(
                id=emp.id,
                distributor_id=emp.distributor_id,
                employee_code=emp.employee_code,
                employeeCode=emp.employee_code,
                name=emp.name,
                phone=emp.phone,
                active=emp.active,
                current_shift_status=current_status,
                currentShiftStatus=current_status,
                last_seen_at=last_seen,
                lastSeenAt=last_seen,
                freshness=freshness,
                app_version=emp.app_version or "v1.4.2",
                device_info=emp.device_info or "Android Device",
                assignedCount=assigned_cnt,
                deliveredCount=delivered_cnt,
                pendingCount=pending_cnt,
                missedCount=missed_cnt,
            )
        )
    return out
