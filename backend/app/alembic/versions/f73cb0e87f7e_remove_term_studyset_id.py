"""remove_term_studyset_id

Remove old Term.studyset_id column and establish StudySetTerm as single source of truth

Revision ID: f73cb0e87f7e
Revises: add_studysetterm_table
Create Date: 2026-01-25 23:40:04.015541

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'f73cb0e87f7e'
down_revision = 'add_studysetterm_table'
branch_labels = None
depends_on = None


def upgrade():
    """Remove old Term.studyset_id column"""
    # Drop foreign key constraint first
    op.drop_constraint(
        'Term_studyset_id_fkey',
        'Term',
        type_='foreignkey'
    )

    # Drop the studyset_id column
    op.drop_column('Term', 'studyset_id')


def downgrade():
    """Restore old Term.studyset_id column (not recommended)"""
    # Add back studyset_id column (nullable first)
    op.add_column(
        'Term',
        sa.Column(
            'studyset_id',
            sa.UUID(),
            nullable=True  # Make nullable to allow existing rows
        )
    )

    # Recreate foreign key
    op.create_foreign_key(
        'Term_studyset_id_fkey',
        'Term',
        'StudySet',
        ['studyset_id'],
        ['studyset_id']
    )

    # Optionally repopulate data from StudySetTerm (first studyset for each term)
    # This is best-effort - terms with multiple studysets will only get one
    op.execute("""
        UPDATE "Term"
        SET studyset_id = (
            SELECT studyset_id
            FROM "StudySetTerm"
            WHERE "StudySetTerm".term_id = "Term".term_id
            ORDER BY added_at ASC
            LIMIT 1
        )
    """)
