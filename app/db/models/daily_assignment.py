import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List
from sqlalchemy import Date, DateTime, ForeignKey, Index, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.assigned_visit import AssignedVisit


class DailyAssignment(Base):
    """DailyAssignment model representing location assignments for an employee on a work date."""

    __tablename__ = "daily_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    distributor_id: Mapped[str] = mapped_column(String(255), nullable=False, default="dist-1", index=True)
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    visits: Mapped[List["AssignedVisit"]] = relationship(
        "AssignedVisit",
        back_populates="assignment",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_daily_assignments_emp_date", "employee_id", "date", unique=True),
    )
