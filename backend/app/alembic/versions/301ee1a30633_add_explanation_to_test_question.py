"""add_explanation_to_test_question

Revision ID: 301ee1a30633
Revises: dcbe5a839386
Create Date: 2026-01-09 09:52:06.801493

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '301ee1a30633'
down_revision = 'dcbe5a839386'
branch_labels = None
depends_on = None


def upgrade():
    # Add explanation column to TestQuestion table
    op.add_column('TestQuestion', sa.Column('explanation', sa.String(length=1000), nullable=True))


def downgrade():
    # Remove explanation column from TestQuestion table
    op.drop_column('TestQuestion', 'explanation')
