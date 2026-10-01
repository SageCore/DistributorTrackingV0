import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.alert import Alert
from app.db.models.employee import Employee
from app.schemas.v2 import AlertResponse

router = APIRouter(prefix="/alerts", tags=["V2 Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    """List missed-visit alerts from database."""
    result = await db.execute(select(Alert).order_by(Alert.created_at.desc()))
    alerts = result.scalars().all()

    out = []
    for a in alerts:
        emp_name = "Field Employee"
        if a.employee_id:
            emp_res = await db.execute(select(Employee).where(Employee.id == a.employee_id))
            emp = emp_res.scalar_one_or_none()
            if emp:
                emp_name = emp.name

        out.append(
            AlertResponse(
                id=a.id,
                employeeId=a.employee_id,
                employeeName=emp_name,
                shiftId=a.shift_id,
                type=a.type,
                message=a.message,
                createdAt=a.created_at,
                isRead=a.is_read,
            )
        )
    return out


@router.patch("/{id}", response_model=AlertResponse)
async def mark_alert_read(id: uuid.UUID, body: dict, db: AsyncSession = Depends(get_db)):
    """Mark notification alert as read."""
    result = await db.execute(select(Alert).where(Alert.id == id))
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.is_read = body.get("isRead", True)
    await db.commit()
    await db.refresh(alert)

    emp_name = "Field Employee"
    if alert.employee_id:
        emp_res = await db.execute(select(Employee).where(Employee.id == alert.employee_id))
        emp = emp_res.scalar_one_or_none()
        if emp:
            emp_name = emp.name

    return AlertResponse(
        id=alert.id,
        employeeId=alert.employee_id,
        employeeName=emp_name,
        shiftId=alert.shift_id,
        type=alert.type,
        message=alert.message,
        createdAt=alert.created_at,
        isRead=alert.is_read,
    )
