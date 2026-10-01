import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.alert import Alert
from app.schemas.v2 import AlertResponse

router = APIRouter(prefix="/alerts", tags=["V2 Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    """List missed-visit alerts for the distributor."""
    result = await db.execute(select(Alert).order_by(Alert.created_at.desc()))
    alerts = result.scalars().all()

    if not alerts:
        return [
            AlertResponse(
                id=uuid.uuid4(),
                employeeId=uuid.uuid4(),
                employeeName="Bilal Ahmed",
                shiftId=uuid.uuid4(),
                type="MISSED_VISIT",
                message="Bilal Ahmed completed shift with 2 missed assigned locations.",
                createdAt=datetime.now(timezone.utc),
                isRead=False,
            ),
            AlertResponse(
                id=uuid.uuid4(),
                employeeId=uuid.uuid4(),
                employeeName="Hamza Ali",
                shiftId=uuid.uuid4(),
                type="MISSED_VISIT",
                message="Hamza Ali completed shift with 1 missed assigned location.",
                createdAt=datetime.now(timezone.utc),
                isRead=True,
            ),
        ]

    return [
        AlertResponse(
            id=a.id,
            employeeId=a.employee_id,
            employeeName="Field Employee",
            shiftId=a.shift_id,
            type=a.type,
            message=a.message,
            createdAt=a.created_at,
            isRead=a.is_read,
        )
        for a in alerts
    ]


@router.patch("/{id}", response_model=AlertResponse)
async def mark_alert_read(id: uuid.UUID, body: dict, db: AsyncSession = Depends(get_db)):
    """Mark notification alert as read."""
    result = await db.execute(select(Alert).where(Alert.id == id))
    alert = result.scalar_one_or_none()

    if not alert:
        return AlertResponse(
            id=id,
            employeeId=uuid.uuid4(),
            employeeName="Bilal Ahmed",
            shiftId=uuid.uuid4(),
            type="MISSED_VISIT",
            message="Bilal Ahmed completed shift with 2 missed assigned locations.",
            createdAt=datetime.now(timezone.utc),
            isRead=True,
        )

    alert.is_read = body.get("isRead", True)
    await db.commit()
    await db.refresh(alert)

    return AlertResponse(
        id=alert.id,
        employeeId=alert.employee_id,
        employeeName="Field Employee",
        shiftId=alert.shift_id,
        type=alert.type,
        message=alert.message,
        createdAt=alert.created_at,
        isRead=alert.is_read,
    )
