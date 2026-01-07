"""add_paragraphs_field_to_term

Revision ID: 3271fb88dca1
Revises: 1817b7618815
Create Date: 2026-01-05 05:09:53.113533

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '3271fb88dca1'
down_revision = '1817b7618815'
branch_labels = None
depends_on = None


def upgrade():
    # Thêm column paragraphs (JSONB array) vào Term table
    op.add_column(
        'Term',
        sa.Column(
            'paragraphs',
            sa.dialects.postgresql.JSONB,
            nullable=True
        )
    )
    # Set default value cho existing rows (empty array)
    op.execute("UPDATE \"Term\" SET paragraphs = '[]'::jsonb WHERE paragraphs IS NULL")


def downgrade():
    # Xóa column paragraphs
    op.drop_column('Term', 'paragraphs')
