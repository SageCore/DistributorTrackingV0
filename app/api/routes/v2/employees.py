import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.employee import Employee
from app.db.models.shift import Shift
from app.db.models.location import Location as GPSPoint
from app.db.models.daily_assignment import DailyAssignment
from app.db.models.assigned_visit import AssignedVisit
from app.db.models.customer_location import CustomerLocation
from app.schemas.v2 import (
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    LiveEmployeeTrackingResponse,
    RoutePointResponse,
    AssignedVisitResponse,
    LocationResponse,
    ShiftReportResponse,
)

router = APIRouter(tags=["V2 Employees"])


@router.get("/employees", response_model=List[EmployeeResponse])
async def list_employees(db: AsyncSession = Depends(get_db)):
    """List all workforce employees from database."""
    result = await db.execute(select(Employee).order_by(Employee.created_at.desc()))
    employees = result.scalars().all()
    
    out = []
    for emp in employees:
        # Check active shift
        shift_res = await db.execute(
            select(Shift).where(Shift.employee_id == emp.id, Shift.status == "ACTIVE").order_by(Shift.started_at.desc())
        )
        active_shift = shift_res.scalar_one_or_none()
        current_status = "ACTIVE" if active_shift else (emp.current_shift_status or "NOT_STARTED")

        # Get latest GPS point
        last_point = None
        if active_shift:
            pt_res = await db.execute(
                select(GPSPoint)
                .where(GPSPoint.shift_id == active_shift.id)
                .order_by(GPSPoint.device_timestamp.desc())
                .limit(1)
            )
            last_point = pt_res.scalar_one_or_none()

        last_seen = last_point.device_timestamp if last_point else emp.last_seen_at
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
                assignedCount=0,
                deliveredCount=0,
                pendingCount=0,
                missedCount=0,
            )
        )
    return out


@router.get("/employees/live", response_model=List[LiveEmployeeTrackingResponse])
async def get_live_employees(db: AsyncSession = Depends(get_db)):
    """Get near-live tracking payload for active employees using real database locations."""
    result = await db.execute(select(Employee).where(Employee.active == True))
    employees = result.scalars().all()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    out = []
    for emp in employees:
        shift_res = await db.execute(
            select(Shift).where(Shift.employee_id == emp.id, Shift.status == "ACTIVE").order_by(Shift.started_at.desc())
        )
        active_shift = shift_res.scalar_one_or_none()
        shift_status = "ACTIVE" if active_shift else "NOT_STARTED"

        route_responses = []
        latest_pt = None
        last_seen = emp.last_seen_at

        if active_shift:
            pts_res = await db.execute(
                select(GPSPoint)
                .where(GPSPoint.shift_id == active_shift.id)
                .order_by(GPSPoint.device_timestamp.asc())
            )
            points = pts_res.scalars().all()
            if points:
                latest_pt = points[-1]
                last_seen = latest_pt.device_timestamp
                route_responses = [
                    RoutePointResponse(
                        id=pt.id,
                        shift_id=pt.shift_id,
                        latitude=pt.latitude,
                        longitude=pt.longitude,
                        accuracy_meters=pt.accuracy_meters,
                        gpsAccuracyMeters=pt.accuracy_meters,
                        speed_mps=pt.speed_mps,
                        speedMps=pt.speed_mps,
                        bearing_degrees=pt.bearing_degrees,
                        bearingDegrees=pt.bearing_degrees,
                        device_timestamp=pt.device_timestamp,
                        deviceTimestamp=pt.device_timestamp,
                    )
                    for pt in points
                ]

        freshness = "OFFLINE"
        if last_seen:
            diff_min = (datetime.now(timezone.utc) - last_seen).total_seconds() / 60
            freshness = "FRESH" if diff_min < 2 else ("STALE" if diff_min <= 10 else "OFFLINE")

        # Fetch today's assignment visits for this employee
        asgn_res = await db.execute(
            select(DailyAssignment).where(DailyAssignment.employee_id == emp.id, DailyAssignment.date == today_str)
        )
        asgn = asgn_res.scalar_one_or_none()

        delivered_cnt = 0
        assigned_cnt = 0
        pending_cnt = 0
        missed_cnt = 0
        visit_responses = []

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

        latest_pt_resp = (
            RoutePointResponse(
                id=latest_pt.id,
                shift_id=latest_pt.shift_id,
                latitude=latest_pt.latitude,
                longitude=latest_pt.longitude,
                accuracy_meters=latest_pt.accuracy_meters,
                gpsAccuracyMeters=latest_pt.accuracy_meters,
                speed_mps=latest_pt.speed_mps,
                speedMps=latest_pt.speed_mps,
                bearing_degrees=latest_pt.bearing_degrees,
                bearingDegrees=latest_pt.bearing_degrees,
                device_timestamp=latest_pt.device_timestamp,
                deviceTimestamp=latest_pt.device_timestamp,
            )
            if latest_pt
            else None
        )

        out.append(
            LiveEmployeeTrackingResponse(
                employeeId=emp.id,
                employee_id=emp.id,
                employeeName=emp.name,
                employee_name=emp.name,
                employeeCode=emp.employee_code,
                employee_code=emp.employee_code,
                shiftStatus=shift_status,
                shift_status=shift_status,
                shiftStartTime=active_shift.started_at if active_shift else None,
                latestLocation=latest_pt_resp,
                last_location=latest_pt_resp,
                lastSeenAt=last_seen,
                freshness=freshness,
                deliveredCount=delivered_cnt,
                assignedCount=assigned_cnt,
                pendingCount=pending_cnt,
                missedCount=missed_cnt,
                routePoints=route_responses,
                assignedVisits=visit_responses,
            )
        )
    return out


@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(body: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    """Create a new field workforce employee."""
    code = body.employee_code or body.employeeCode or f"EMP-{uuid.uuid4().hex[:4].upper()}"
    emp = Employee(
        name=body.name,
        employee_code=code,
        phone=body.phone,
        login_identifier=body.login_identifier or body.loginIdentifier,
        active=body.active,
        current_shift_status="NOT_STARTED",
    )
    db.add(emp)
    await db.commit()
    await db.refresh(emp)

    return EmployeeResponse(
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
        freshness="OFFLINE",
        app_version="v1.4.2",
        device_info="Android Device",
    )


@router.get("/employees/{id}", response_model=EmployeeResponse)
async def get_employee(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get single employee by ID."""
    result = await db.execute(select(Employee).where(Employee.id == id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    return EmployeeResponse(
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
    )


@router.patch("/employees/{id}", response_model=EmployeeResponse)
async def update_employee(id: uuid.UUID, body: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    """Update employee details or activate/deactivate account."""
    result = await db.execute(select(Employee).where(Employee.id == id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if body.name is not None:
        emp.name = body.name
    if body.employee_code is not None:
        emp.employee_code = body.employee_code
    if body.phone is not None:
        emp.phone = body.phone
    if body.active is not None:
        emp.active = body.active

    await db.commit()
    await db.refresh(emp)

    return EmployeeResponse(
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
    )


@router.get("/employees/{id}/shifts", response_model=List[ShiftReportResponse])
async def get_employee_shifts(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get shift history for an employee."""
    result = await db.execute(select(Employee).where(Employee.id == id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Select all shifts associated with this employee
    s_res = await db.execute(select(Shift).where(Shift.employee_id == id).order_by(Shift.started_at.desc()))
    shifts = s_res.scalars().all()

    out = []
    for s in shifts:
        start_t = s.started_at
        end_t = s.ended_at or datetime.now(timezone.utc)
        duration_mins = max(0, int((end_t - start_t).total_seconds() / 60)) if start_t else 0
        date_str = start_t.strftime("%Y-%m-%d") if start_t else "2026-10-01"

        out.append(
            ShiftReportResponse(
                id=s.id,
                shiftId=s.id,
                employeeId=id,
                employeeName=emp.name,
                employeeCode=emp.employee_code,
                date=date_str,
                startTime=s.started_at,
                endTime=s.ended_at,
                durationMinutes=duration_mins,
                status=s.status,
                totalAssigned=0,
                deliveredCount=0,
                missedCount=0,
                pendingCount=0,
                completionPercentage=0.0,
                routePoints=[],
                assignedVisits=[],
            )
        )
    return out
