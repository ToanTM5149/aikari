"""migrate_existing_category_data

Revision ID: f6b9c0d3e2f2
Revises: f5a8b9c3d2e1
Create Date: 2026-01-08 00:00:01.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import uuid
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'f6b9c0d3e2f2'
down_revision = 'f5a8b9c3d2e1'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Get all unique categories from StudySet table with their owners
    result = conn.execute(text("""
        SELECT DISTINCT category, owner_id
        FROM "StudySet"
        WHERE category IS NOT NULL AND category != ''
        ORDER BY owner_id, category
    """))

    categories_data = result.fetchall()

    # Create Category records for each unique category per user
    category_mapping = {}
    for category_name, owner_id in categories_data:
        category_id = str(uuid.uuid4())
        now = datetime.utcnow()

        conn.execute(text("""
            INSERT INTO "Category" (category_id, name, description, color, owner_id, created_at, updated_at)
            VALUES (:category_id, :name, :description, :color, :owner_id, :created_at, :updated_at)
        """), {
            'category_id': category_id,
            'name': category_name,
            'description': None,
            'color': None,
            'owner_id': str(owner_id),
            'created_at': now,
            'updated_at': now
        })

        # Store mapping for later
        category_mapping[(category_name, str(owner_id))] = category_id

    # Update StudySet records to use category_id
    for (category_name, owner_id), category_id in category_mapping.items():
        conn.execute(text("""
            UPDATE "StudySet"
            SET category_id = :category_id
            WHERE category = :category_name AND owner_id = :owner_id
        """), {
            'category_id': category_id,
            'category_name': category_name,
            'owner_id': owner_id
        })

    # Drop the old category column
    op.drop_column('StudySet', 'category')


def downgrade():
    # Add back the category column
    op.add_column('StudySet', sa.Column('category', sa.VARCHAR(length=100), nullable=True))

    conn = op.get_bind()

    # Copy category names back from Category table
    conn.execute(text("""
        UPDATE "StudySet" s
        SET category = c.name
        FROM "Category" c
        WHERE s.category_id = c.category_id
    """))

    # Note: We don't delete Category table records here as they might be referenced elsewhere
    # The previous migration's downgrade will handle dropping the Category table
