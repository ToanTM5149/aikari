"""remove QUIZZ from GenerateType enum

Revision ID: 7f1d9a2b8c4b
Revises: 5c76c5bc26b5
Create Date: 2025-12-05 08:45:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7f1d9a2b8c4b'
down_revision = '5c76c5bc26b5'
branch_labels = None
depends_on = None


def upgrade():
    # Safely remove 'QUIZZ' label from generatetype enum by creating a temporary enum
    conn = op.get_bind()
    # Create temporary enum without QUIZZ
    op.execute("CREATE TYPE generatetype_tmp AS ENUM ('TEST', 'ATTRIBUTE')")
    # Alter columns that use generatetype to use the tmp type
    # AIGeneratedContents.generate_type and any other columns
    op.execute("ALTER TABLE \"AIGeneratedContents\" ALTER COLUMN generate_type TYPE generatetype_tmp USING generate_type::text::generatetype_tmp")
    # Drop old type and rename tmp to original
    op.execute("DROP TYPE generatetype")
    op.execute("ALTER TYPE generatetype_tmp RENAME TO generatetype")


def downgrade():
    # On downgrade, recreate previous enum with QUIZZ
    op.execute("CREATE TYPE generatetype_tmp AS ENUM ('QUIZZ', 'TEST', 'ATTRIBUTE')")
    op.execute("ALTER TABLE \"AIGeneratedContents\" ALTER COLUMN generate_type TYPE generatetype_tmp USING generate_type::text::generatetype_tmp")
    op.execute("DROP TYPE generatetype")
    op.execute("ALTER TYPE generatetype_tmp RENAME TO generatetype")
