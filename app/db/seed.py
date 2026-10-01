import asyncio
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_factory
from app.db.models.employee import Employee
from app.db.models.customer_location import CustomerLocation
from app.db.models.shift import Shift

logger = logging.getLogger(__name__)

LAHORE_TEST_LOCATIONS = [
    {
        "name": "Packages Mall",
        "code": "LHR-001",
        "address": "Walton Road, Gulberg III, Lahore",
        "latitude": 31.4728,
        "longitude": 74.3734,
        "contact_name": "Management Office",
        "phone": "+92 42 111 697 697",
    },
    {
        "name": "Emporium Mall",
        "code": "LHR-002",
        "address": "Abdul Haque Rd, Johar Town, Lahore",
        "latitude": 31.4674,
        "longitude": 74.2660,
        "contact_name": "Info Desk",
        "phone": "+92 42 32592000",
    },
    {
        "name": "Liberty Market",
        "code": "LHR-003",
        "address": "Main Boulevard, Gulberg III, Lahore",
        "latitude": 31.5117,
        "longitude": 74.3444,
        "contact_name": "Tariq Traders",
        "phone": "+92 321 4445566",
    },
    {
        "name": "Fortress Stadium",
        "code": "LHR-004",
        "address": "Fortress Commercial Complex, Cantt, Lahore",
        "latitude": 31.5315,
        "longitude": 74.3644,
        "contact_name": "Superstore Admin",
        "phone": "+92 42 36620000",
    },
    {
        "name": "Imtiaz Super Market (DHA)",
        "code": "LHR-005",
        "address": "Bedian Road, DHA Phase 5, Lahore",
        "latitude": 31.4612,
        "longitude": 74.4015,
        "contact_name": "Receiving Manager",
        "phone": "+92 42 111 468 429",
    },
]


async def seed_v2_data(db: AsyncSession) -> Employee:
    """Idempotently seed V2 initial employee, Lahore customer locations, and associate unassigned historical shifts."""
    # 0. Ensure V2 tables and shifts.employee_id column exist on existing databases
    try:
        from sqlalchemy import text
        from app.db.base import Base
        import app.db.models  # noqa: F401

        conn = await db.connection()
        await conn.run_sync(Base.metadata.create_all)
        await db.execute(text("ALTER TABLE shifts ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;"))
        await db.execute(text("CREATE INDEX IF NOT EXISTS idx_shifts_employee_id ON shifts (employee_id);"))
        await db.commit()
    except Exception as e:
        logger.warning(f"Auto-migration/schema check in seed_v2_data notice: {e}")
        await db.rollback()

    # 1. Seed or get Demo Employee (EMP-001)
    emp_res = await db.execute(select(Employee).where(Employee.employee_code == "EMP-001"))
    emp001 = emp_res.scalar_one_or_none()

    if not emp001:
        emp001 = Employee(
            name="Demo Employee",
            employee_code="EMP-001",
            phone="+92 300 1234567",
            login_identifier="admin@distributor.com",
            active=True,
            current_shift_status="NOT_STARTED",
            distributor_id="dist-1",
        )
        db.add(emp001)
        await db.commit()
        await db.refresh(emp001)
        logger.info(f"Created initial Demo Employee EMP-001 with ID: {emp001.id}")
    else:
        logger.info(f"Existing Demo Employee EMP-001 found with ID: {emp001.id}")

    # 2. Associate unassigned historical V1 shifts to EMP-001
    await db.execute(
        update(Shift)
        .where(Shift.employee_id.is_(None))
        .values(employee_id=emp001.id)
    )
    await db.commit()

    # 3. Seed real Lahore test locations idempotently
    for loc_data in LAHORE_TEST_LOCATIONS:
        loc_res = await db.execute(select(CustomerLocation).where(CustomerLocation.code == loc_data["code"]))
        existing_loc = loc_res.scalar_one_or_none()
        if not existing_loc:
            new_loc = CustomerLocation(
                name=loc_data["name"],
                code=loc_data["code"],
                address=loc_data["address"],
                latitude=loc_data["latitude"],
                longitude=loc_data["longitude"],
                contact_name=loc_data.get("contact_name"),
                phone=loc_data.get("phone"),
                active=True,
                distributor_id="dist-1",
            )
            db.add(new_loc)
            logger.info(f"Seeded Lahore test location: {loc_data['name']}")
    await db.commit()

    return emp001


async def main():
    async with async_session_factory() as session:
        await seed_v2_data(session)
        print("V2 Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
