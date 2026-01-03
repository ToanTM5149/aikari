"""add_response_time_to_studyactivity

Revision ID: 0c22457276fe
Revises: bc20d7fe1292
Create Date: 2026-01-04 01:30:21.314600

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '0c22457276fe'
down_revision = 'bc20d7fe1292'
branch_labels = None
depends_on = None


def upgrade():
    # Add column as nullable first to avoid errors with existing data
    op.add_column('StudyActivity', sa.Column('response_time', sa.Float(), nullable=True))
    
    # Set default value for existing rows (0.0 seconds)
    op.execute("UPDATE \"StudyActivity\" SET response_time = 0.0 WHERE response_time IS NULL")
    
    # Make column non-nullable after setting defaults
    op.alter_column('StudyActivity', 'response_time', nullable=False)


def downgrade():
    op.drop_column('StudyActivity', 'response_time')
