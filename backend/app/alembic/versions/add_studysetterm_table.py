"""Add StudySetTerm junction table

Create junction table and populate from existing data
This is an additive migration - no breaking changes, dual-write enabled

Revision ID: add_studysetterm_table
Revises: 35d5fcf688f6
Create Date: 2026-01-25 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_studysetterm_table'
down_revision = '35d5fcf688f6'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade: Create StudySetTerm junction table

    Steps:
    1. Create StudySetTerm table with composite PK
    2. Add indexes for performance
    3. Populate from existing Term.studyset_id data
    4. Add studyset_id column to SessionReview for quick lookups
    """

    # Step 1: Create StudySetTerm table
    op.create_table(
        'StudySetTerm',
        sa.Column('studyset_id', sa.UUID(), nullable=False),
        sa.Column('term_id', sa.UUID(), nullable=False),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('added_by', sa.UUID(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),

        # Primary Key
        sa.PrimaryKeyConstraint('studyset_id', 'term_id', name='pk_studysetterm'),

        # Foreign Keys
        sa.ForeignKeyConstraint(
            ['studyset_id'],
            ['StudySet.studyset_id'],
            name='fk_studysetterm_studyset',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['term_id'],
            ['Term.term_id'],
            name='fk_studysetterm_term',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['added_by'],
            ['User.user_id'],
            name='fk_studysetterm_user',
            ondelete='SET NULL'
        ),
    )

    # Step 2: Add indexes for performance
    op.create_index(
        'idx_studysetterm_studyset',
        'StudySetTerm',
        ['studyset_id']
    )
    op.create_index(
        'idx_studysetterm_term',
        'StudySetTerm',
        ['term_id']
    )
    op.create_index(
        'idx_studysetterm_order',
        'StudySetTerm',
        ['studyset_id', 'order']
    )

    # Step 3: Populate StudySetTerm from existing Term.studyset_id
    # This migrates all existing 1:N relationships to the junction table
    op.execute("""
        INSERT INTO "StudySetTerm" (studyset_id, term_id, added_at, added_by, "order")
        SELECT
            t.studyset_id,
            t.term_id,
            t.created_at as added_at,
            ss.owner_id as added_by,
            0 as "order"
        FROM "Term" t
        INNER JOIN "StudySet" ss ON ss.studyset_id = t.studyset_id
        WHERE t.studyset_id IS NOT NULL
    """)

    # Step 4: Add studyset_id to SessionReview for quick lookups
    # This denormalizes the data to avoid joins during session review
    op.add_column(
        'SessionReview',
        sa.Column('studyset_id', sa.UUID(), nullable=True)
    )

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_sessionreview_studyset',
        'SessionReview',
        'StudySet',
        ['studyset_id'],
        ['studyset_id'],
        ondelete='CASCADE'
    )

    # Populate studyset_id from Term.studyset_id
    op.execute("""
        UPDATE "SessionReview" sr
        SET studyset_id = t.studyset_id
        FROM "Term" t
        WHERE sr.term_id = t.term_id
    """)

    # Add index for performance
    op.create_index(
        'idx_sessionreview_studyset',
        'SessionReview',
        ['studyset_id']
    )


def downgrade():
    """
    Downgrade: Remove StudySetTerm table and SessionReview.studyset_id

    This is safe because we haven't removed Term.studyset_id yet.
    """

    # Drop SessionReview.studyset_id
    op.drop_index('idx_sessionreview_studyset', table_name='SessionReview')
    op.drop_constraint('fk_sessionreview_studyset', 'SessionReview', type_='foreignkey')
    op.drop_column('SessionReview', 'studyset_id')

    # Drop StudySetTerm table
    op.drop_index('idx_studysetterm_order', table_name='StudySetTerm')
    op.drop_index('idx_studysetterm_term', table_name='StudySetTerm')
    op.drop_index('idx_studysetterm_studyset', table_name='StudySetTerm')
    op.drop_table('StudySetTerm')
