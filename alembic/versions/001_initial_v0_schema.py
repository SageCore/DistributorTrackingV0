"""Initial V0 Schema for Shifts and Locations

Revision ID: 001_initial_v0_schema
Revises: 
Create Date: 2026-09-27 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_v0_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create shifts table
    op.create_table(
        'shifts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('device_id', sa.String(length=255), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_shifts_status', 'shifts', ['status'], unique=False)

    # Create locations table
    op.create_table(
        'locations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('shift_id', sa.UUID(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('accuracy_meters', sa.Float(), nullable=True),
        sa.Column('altitude_meters', sa.Float(), nullable=True),
        sa.Column('speed_mps', sa.Float(), nullable=True),
        sa.Column('bearing_degrees', sa.Float(), nullable=True),
        sa.Column('device_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('recorded_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_mock', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('received_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['shift_id'], ['shifts.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_locations_shift_id', 'locations', ['shift_id'], unique=False)
    op.create_index('idx_locations_device_timestamp', 'locations', ['device_timestamp'], unique=False)
    op.create_index('idx_locations_received_at', 'locations', ['received_at'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_locations_received_at', table_name='locations')
    op.drop_index('idx_locations_device_timestamp', table_name='locations')
    op.drop_index('idx_locations_shift_id', table_name='locations')
    op.drop_table('locations')

    op.drop_index('idx_shifts_status', table_name='shifts')
    op.drop_table('shifts')
