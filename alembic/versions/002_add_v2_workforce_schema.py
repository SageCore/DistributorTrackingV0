"""Add V2 Workforce Schema for Employees, Customer Locations, Daily Assignments, Assigned Visits, and Alerts

Revision ID: 002_add_v2_workforce_schema
Revises: 001_initial_v0_schema
Create Date: 2026-10-02 02:52:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002_add_v2_workforce_schema'
down_revision: Union[str, None] = '001_initial_v0_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Employees Table
    op.create_table(
        'employees',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('distributor_id', sa.String(length=255), nullable=False, server_default='dist-1'),
        sa.Column('employee_code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=64), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('current_shift_status', sa.String(length=32), nullable=False, server_default='NOT_STARTED'),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('login_identifier', sa.String(length=255), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=True),
        sa.Column('device_info', sa.String(length=255), nullable=True),
        sa.Column('app_version', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_code'),
        sa.UniqueConstraint('login_identifier')
    )
    op.create_index('idx_employees_distributor_id', 'employees', ['distributor_id'], unique=False)
    op.create_index('idx_employees_active', 'employees', ['active'], unique=False)

    # 2. Customer Locations Table
    op.create_table(
        'customer_locations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('distributor_id', sa.String(length=255), nullable=False, server_default='dist-1'),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact_name', sa.String(length=255), nullable=True),
        sa.Column('phone', sa.String(length=64), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_customer_locations_distributor_id', 'customer_locations', ['distributor_id'], unique=False)
    op.create_index('idx_customer_locations_active', 'customer_locations', ['active'], unique=False)

    # 3. Daily Assignments Table
    op.create_table(
        'daily_assignments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('distributor_id', sa.String(length=255), nullable=False, server_default='dist-1'),
        sa.Column('employee_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_daily_assignments_emp_date', 'daily_assignments', ['employee_id', 'date'], unique=True)

    # 4. Assigned Visits Table
    op.create_table(
        'assigned_visits',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('assignment_id', sa.UUID(), nullable=False),
        sa.Column('location_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_distance_meters', sa.Float(), nullable=True),
        sa.Column('gps_accuracy_meters', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['assignment_id'], ['daily_assignments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['location_id'], ['customer_locations.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_assigned_visits_assignment_id', 'assigned_visits', ['assignment_id'], unique=False)
    op.create_index('idx_assigned_visits_status', 'assigned_visits', ['status'], unique=False)

    # 5. Alerts Table
    op.create_table(
        'alerts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('distributor_id', sa.String(length=255), nullable=False, server_default='dist-1'),
        sa.Column('employee_id', sa.UUID(), nullable=True),
        sa.Column('shift_id', sa.UUID(), nullable=True),
        sa.Column('type', sa.String(length=64), nullable=False, server_default='MISSED_VISIT'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_alerts_distributor_id', 'alerts', ['distributor_id'], unique=False)
    op.create_index('idx_alerts_is_read', 'alerts', ['is_read'], unique=False)


def downgrade() -> None:
    op.drop_table('alerts')
    op.drop_table('assigned_visits')
    op.drop_table('daily_assignments')
    op.drop_table('customer_locations')
    op.drop_table('employees')
