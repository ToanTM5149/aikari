"""merge performance indexes and student studyset

Revision ID: 35d5fcf688f6
Revises: add_performance_indexes, 8e1f5c0f4c24
Create Date: 2026-01-25 14:48:27.804358

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '35d5fcf688f6'
down_revision = ('add_performance_indexes', '8e1f5c0f4c24')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
