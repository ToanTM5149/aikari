"""add StudentStudySet table

Revision ID: 8e1f5c0f4c24
Revises: e8c516364a50
Create Date: 2026-01-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8e1f5c0f4c24'
down_revision: Union[str, None] = 'e8c516364a50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create StudentStudySet table
    op.create_table(
        'StudentStudySet',
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('studyset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrolled_at', sa.DateTime(), nullable=False),
        sa.Column('last_studied_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ['student_id'],
            ['User.user_id'],
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['studyset_id'],
            ['StudySet.studyset_id'],
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('student_id', 'studyset_id')
    )

    # Create indexes for better query performance
    op.create_index(
        'idx_studentstudyset_student',
        'StudentStudySet',
        ['student_id']
    )
    op.create_index(
        'idx_studentstudyset_studyset',
        'StudentStudySet',
        ['studyset_id']
    )

    # Populate from existing StudyActivity data
    # Get distinct user-studyset pairs with first and last study times
    op.execute("""
        INSERT INTO "StudentStudySet" (student_id, studyset_id, enrolled_at, last_studied_at)
        SELECT DISTINCT
            user_id as student_id,
            studyset_id,
            MIN(created_at) as enrolled_at,
            MAX(created_at) as last_studied_at
        FROM "StudyActivity"
        GROUP BY user_id, studyset_id
        ON CONFLICT (student_id, studyset_id) DO NOTHING
    """)

    # Also populate from ProgressSummary for users who haven't studied yet but have progress
    # (e.g., just viewed the studyset or it was assigned to them)
    op.execute("""
        INSERT INTO "StudentStudySet" (student_id, studyset_id, enrolled_at, last_studied_at)
        SELECT DISTINCT
            user_id as student_id,
            studyset_id,
            updated_at as enrolled_at,
            NULL::timestamp as last_studied_at
        FROM "ProgressSummary"
        WHERE NOT EXISTS (
            SELECT 1 FROM "StudentStudySet"
            WHERE student_id = "ProgressSummary".user_id
            AND studyset_id = "ProgressSummary".studyset_id
        )
        ON CONFLICT (student_id, studyset_id) DO NOTHING
    """)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_studentstudyset_studyset', 'StudentStudySet')
    op.drop_index('idx_studentstudyset_student', 'StudentStudySet')

    # Drop table
    op.drop_table('StudentStudySet')
