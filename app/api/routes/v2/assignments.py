import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.daily_assignment import DailyAssignment
from app.db.models.assigned_visit import AssignedVisit
from app.db.models.employee import Employee
from app.db.models.customer_location import CustomerLocation
from app.schemas.v2 import DailyAssignmentCreate, DailyAssignmentResponse, AssignedVisitResponse, LocationResponse

router = APIRouter(prefix="/assignments", tags=["V2 Daily Assignments"])


@router.get("", response_model=List[DailyAssignmentResponse])
async def list_assignments(date: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """List daily location assignments for a given work date."""
    query = select(DailyAssignment)
    if date:
        query = query.where(DailyAssignment.date == date)
    result = await db.execute(query.order_by(DailyAssignment.created_at.desc()))
    assignments = result.scalars().all()

    out = []
    for asgn in assignments:
        emp_res = await db.execute(select(Employee).where(Employee.id == asgn.employee_id))
        emp = emp_res.scalar_one_or_none()

        visits_res = await db.execute(select(AssignedVisit).where(AssignedVisit.assignment_id == asgn.id))
        visits = visits_res.scalars().all()

        visit_responses = []
        delivered = 0
        pending = 0
        missed = 0
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

        out.append(
            DailyAssignmentResponse(
                id=asgn.id,
                employee_id=asgn.employee_id,
                employeeId=asgn.employee_id,
                employee_name=emp.name if emp else "Employee",
                employeeName=emp.name if emp else "Employee",
                employee_code=emp.employee_code if emp else "EMP-001",
                employeeCode=emp.employee_code if emp else "EMP-001",
                date=asgn.date,
                assignedVisits=visit_responses,
                shiftStatus=emp.current_shift_status if emp else "NOT_STARTED",
                deliveredCount=delivered,
                pendingCount=pending,
                missedCount=missed,
            )
        )
    return out


@router.post("", response_model=DailyAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(body: DailyAssignmentCreate, db: AsyncSession = Depends(get_db)):
    """Create a new daily location assignment for an employee."""
    emp_id = body.employee_id or body.employeeId
    if not emp_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="employee_id is required")

    location_ids = body.assigned_location_ids or body.locationIds or []

    asgn = DailyAssignment(
        employee_id=emp_id,
        date=body.date,
    )
    db.add(asgn)
    await db.commit()
    await db.refresh(asgn)

    visit_responses = []
    for loc_id in location_ids:
        visit = AssignedVisit(
            assignment_id=asgn.id,
            location_id=loc_id,
            status="PENDING",
        )
        db.add(visit)
        await db.commit()
        await db.refresh(visit)

        loc_res = await db.execute(select(CustomerLocation).where(CustomerLocation.id == loc_id))
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
                id=visit.id,
                assignment_id=visit.assignment_id,
                location_id=visit.location_id,
                location=loc_data,
                status=visit.status,
            )
        )

    emp_res = await db.execute(select(Employee).where(Employee.id == emp_id))
    emp = emp_res.scalar_one_or_none()

    return DailyAssignmentResponse(
        id=asgn.id,
        employee_id=asgn.employee_id,
        employeeId=asgn.employee_id,
        employee_name=emp.name if emp else "Employee",
        employeeName=emp.name if emp else "Employee",
        employee_code=emp.employee_code if emp else "EMP-001",
        employeeCode=emp.employee_code if emp else "EMP-001",
        date=asgn.date,
        assignedVisits=visit_responses,
        shiftStatus=emp.current_shift_status if emp else "NOT_STARTED",
        deliveredCount=0,
        pendingCount=len(visit_responses),
        missedCount=0,
    )
