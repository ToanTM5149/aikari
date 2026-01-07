"""merge_heads

Revision ID: e8c516364a50
Revises: a1b2c3d4e5f6, f1a2b3c4d5e6
Create Date: 2026-01-05 01:43:29.356390

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'e8c516364a50'
down_revision = ('a1b2c3d4e5f6', 'f1a2b3c4d5e6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
