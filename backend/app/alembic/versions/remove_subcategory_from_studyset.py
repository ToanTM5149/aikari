"""remove subcategory from studyset

Revision ID: f1a2b3c4d5e6
Revises: 0c22457276fe
Create Date: 2026-01-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = '0c22457276fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop subcategory column from StudySet table
    op.drop_column('StudySet', 'subcategory')


def downgrade() -> None:
    # Add subcategory column back to StudySet table
    op.add_column('StudySet', sa.Column('subcategory', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))
