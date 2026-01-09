"""merge_heads

Revision ID: dcbe5a839386
Revises: f6b9c0d3e2f2, fix_category_001
Create Date: 2026-01-09 09:52:02.675912

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'dcbe5a839386'
down_revision = ('f6b9c0d3e2f2', 'fix_category_001')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
