import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.shift import Shift
from app.db.models.employee import Employee
from app.db.models.location import Location as GPSPoint
from app.db.models.daily_assignment import DailyAssignment
from app.db.models.assigned_visit import AssignedVisit
from app.db.models.customer_location import CustomerLocation
from app.schemas.v2 import ShiftReportResponse, RoutePointResponse, AssignedVisitResponse, LocationResponse

router = APIRouter(prefix="/reports/shifts", tags=["V2 Shift Reports"])


@router.get("", response_model=List[ShiftReportResponse])
async def list_shift_reports(
    employee_id: Optional[uuid.UUID] = None,
    date: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List shift summary reports from database."""
    query = select(Shift)
    if employee_id:
        query = query.where(Shift.employee_id == employee_id)
    result = await db.execute(query.order_by(Shift.started_at.desc()))
    shifts = result.scalars().all()

    out = []
    for s in shifts:
        # Fetch associated employee
        emp = None
        if s.employee_id:
            emp_res = await db.execute(select(Employee).where(Employee.id == s.employee_id))
            emp = emp_res.scalar_one_or_none()

        emp_name = emp.name if emp else "Demo Employee"
        emp_code = emp.employee_code if emp else "EMP-001"
        emp_id = emp.id if emp else (s.employee_id or uuid.uuid4())

        # Duration calculation
        start_t = s.started_at
        end_t = s.ended_at or datetime.now(timezone.utc)
        duration_mins = max(0, int((end_t - start_t).total_seconds() / 60)) if start_t else 0
        date_str = start_t.strftime("%Y-%m-%d") if start_t else "2026-10-01"

        # Check daily assignments for visit metrics
        asgn_res = await db.execute(
            select(DailyAssignment).where(
                DailyAssignment.employee_id == emp_id,
                DailyAssignment.date == date_str,
            )
        )
        asgn = asgn_res.scalar_one_or_none()

        delivered = 0
        missed = 0
        pending = 0
        total_assigned = 0

        if asgn:
            visits_res = await db.execute(select(AssignedVisit).where(AssignedVisit.assignment_id == asgn.id))
            visits = visits_res.scalars().all()
            total_assigned = len(visits)
            for v in visits:
                if v.status == "DELIVERED":
                    delivered += 1
                elif v.status == "MISSED":
                    missed += 1
                else:
                    pending += 1

        completion_pct = round((delivered / total_assigned * 100), 1) if total_assigned > 0 else 0.0

        out.append(
            ShiftReportResponse(
                id=s.id,
                shiftId=s.id,
                employeeId=emp_id,
                employeeName=emp_name,
                employeeCode=emp_code,
                date=date_str,
                startTime=s.started_at,
                endTime=s.ended_at,
                durationMinutes=duration_mins,
                status=s.status,
                totalAssigned=total_assigned,
                deliveredCount=delivered,
                missedCount=missed,
                pendingCount=pending,
                completionPercentage=completion_pct,
                routePoints=[],
                assignedVisits=[],
            )
        )
    return out


@router.get("/{id}", response_model=ShiftReportResponse)
async def get_shift_report_detail(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get complete end-of-shift report details including route polyline and visit markers."""
    result = await db.execute(select(Shift).where(Shift.id == id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift report not found")

    emp = None
    if s.employee_id:
        emp_res = await db.execute(select(Employee).where(Employee.id == s.employee_id))
        emp = emp_res.scalar_one_or_none()

    emp_name = emp.name if emp else "Demo Employee"
    emp_code = emp.employee_code if emp else "EMP-001"
    emp_id = emp.id if emp else (s.employee_id or uuid.uuid4())

    start_t = s.started_at
    end_t = s.ended_at or datetime.now(timezone.utc)
    duration_mins = max(0, int((end_t - start_t).total_seconds() / 60)) if start_t else 0
    date_str = start_t.strftime("%Y-%m-%d") if start_t else "2026-10-01"

    # Fetch chronological route points from locations table
    pts_res = await db.execute(
        select(GPSPoint)
        .where(GPSPoint.shift_id == id)
        .order_by(GPSPoint.device_timestamp.asc())
    )
    points = pts_res.scalars().all()
    route_responses = [
        RoutePointResponse(
            id=pt.id,
            shift_id=pt.shift_id,
            latitude=pt.latitude,
            longitude=pt.longitude,
            accuracy_meters=pt.accuracy_meters,
            gpsAccuracyMeters=pt.accuracy_meters,
            device_timestamp=pt.device_timestamp,
            deviceTimestamp=pt.device_timestamp,
        )
        for pt in points
    ]

    # Fetch assigned visits for this employee & date
    asgn_res = await db.execute(
        select(DailyAssignment).where(
            DailyAssignment.employee_id == emp_id,
            DailyAssignment.date == date_str,
        )
    )
    asgn = asgn_res.scalar_one_or_none()

    delivered = 0
    missed = 0
    pending = 0
    total_assigned = 0
    visit_responses = []

    if asgn:
        visits_res = await db.execute(select(AssignedVisit).where(AssignedVisit.assignment_id == asgn.id))
        visits = visits_res.scalars().all()
        total_assigned = len(visits)
        for v in visits:
            if v.status == "DELIVERED":
                delivered += 1
            elif v.status == "MISSED":
                missed += 1
            else:
                pending += 1

            loc_res = await db.execute(select(CustomerLocation).where(CustomerLocation.id == v.location_id))
            loc = loc_res.scalar_one_or_none()
            loc_data = (
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
                if loc
                else None
            )
            visit_responses.append(
                AssignedVisitResponse(
                    id=v.id,
                    assignment_id=v.assignment_id,
                    location_id=v.location_id,
                    location=loc_data,
                    status=v.status,
                    delivered_at=v.delivered_at,
                    deliveredAt=v.delivered_at,
                    verified_distance_meters=v.verified_distance_meters,
                    verifiedDistanceMeters=v.verified_distance_meters,
                    gps_accuracy_meters=v.gps_accuracy_meters,
                    gpsAccuracyMeters=v.gps_accuracy_meters,
                )
            )

    completion_pct = round((delivered / total_assigned * 100), 1) if total_assigned > 0 else 0.0

    return ShiftReportResponse(
        id=s.id,
        shiftId=s.id,
        employeeId=emp_id,
        employeeName=emp_name,
        employeeCode=emp_code,
        date=date_str,
        startTime=s.started_at,
        endTime=s.ended_at,
        durationMinutes=duration_mins,
        status=s.status,
        totalAssigned=total_assigned,
        deliveredCount=delivered,
        missedCount=missed,
        pendingCount=pending,
        completionPercentage=completion_pct,
        routePoints=route_responses,
        assignedVisits=visit_responses,
    )
