"""add_category_table_and_update_studyset

Revision ID: f5a8b9c3d2e1
Revises: 90fdd5195bd6
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f5a8b9c3d2e1'
down_revision = '90fdd5195bd6'
branch_labels = None
depends_on = None


def upgrade():
    # Create Category table
    op.create_table(
        'Category',
        sa.Column('category_id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('color', sqlmodel.sql.sqltypes.AutoString(length=7), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['User.user_id'], ),
        sa.PrimaryKeyConstraint('category_id')
    )

    # Create indexes for Category table
    op.create_index(op.f('ix_Category_name'), 'Category', ['name'], unique=False)
    op.create_index(op.f('ix_Category_owner_id'), 'Category', ['owner_id'], unique=False)

    # Add category_id column to StudySet table
    op.add_column('StudySet', sa.Column('category_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_studyset_category', 'StudySet', 'Category', ['category_id'], ['category_id'])


def downgrade():
    # Remove foreign key and category_id column from StudySet
    op.drop_constraint('fk_studyset_category', 'StudySet', type_='foreignkey')
    op.drop_column('StudySet', 'category_id')

    # Drop indexes
    op.drop_index(op.f('ix_Category_owner_id'), table_name='Category')
    op.drop_index(op.f('ix_Category_name'), table_name='Category')

    # Drop Category table
    op.drop_table('Category')
