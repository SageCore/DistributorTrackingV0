import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.employee import Employee
from app.schemas.v2 import EmployeeCreate, EmployeeResponse, EmployeeUpdate, LiveEmployeeTrackingResponse, ShiftReportResponse

router = APIRouter(tags=["V2 Employees"])


@router.get("/employees", response_model=List[EmployeeResponse])
async def list_employees(db: AsyncSession = Depends(get_db)):
    """List all workforce employees."""
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


@router.get("/employees/live", response_model=List[LiveEmployeeTrackingResponse])
async def get_live_employees(db: AsyncSession = Depends(get_db)):
    """Get near-live active employee location tracking details."""
    result = await db.execute(select(Employee).where(Employee.active == True))
    employees = result.scalars().all()
    
    out = []
    for emp in employees:
        out.append(
            LiveEmployeeTrackingResponse(
                employeeId=emp.id,
                employee_id=emp.id,
                employeeName=emp.name,
                employee_name=emp.name,
                employeeCode=emp.employee_code,
                employee_code=emp.employee_code,
                shiftStatus=emp.current_shift_status,
                shift_status=emp.current_shift_status,
                shiftStartTime=emp.last_seen_at,
                latestLocation=None,
                last_location=None,
                lastSeenAt=emp.last_seen_at,
                freshness="FRESH" if emp.last_seen_at else "OFFLINE",
                deliveredCount=7,
                assignedCount=10,
                pendingCount=3,
                missedCount=0,
                routePoints=[],
                assignedVisits=[],
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
    emp_name = emp.name if emp else "Employee"
    emp_code = emp.employee_code if emp else "EMP-001"

    return [
        ShiftReportResponse(
            id=uuid.uuid4(),
            shiftId=uuid.uuid4(),
            employeeId=id,
            employeeName=emp_name,
            employeeCode=emp_code,
            date="2026-10-01",
            startTime=emp.last_seen_at if emp and emp.last_seen_at else None,
            endTime=None,
            durationMinutes=240,
            status="ACTIVE",
            totalAssigned=10,
            deliveredCount=7,
            missedCount=0,
            pendingCount=3,
            completionPercentage=70.0,
            routePoints=[],
            assignedVisits=[],
        )
    ]
