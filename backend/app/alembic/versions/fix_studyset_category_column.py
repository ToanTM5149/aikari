"""fix_studyset_category_column

Revision ID: fix_category_001
Revises: 3271fb88dca1
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_category_001'
down_revision = '3271fb88dca1'
branch_labels = None
depends_on = None


def upgrade():
    # First, ensure Category table exists
    # Check if it exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'Category' not in tables:
        # Create Category table if it doesn't exist
        op.create_table(
            'Category',
            sa.Column('category_id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('description', sa.String(length=500), nullable=True),
            sa.Column('color', sa.String(length=7), nullable=True),
            sa.Column('owner_id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['owner_id'], ['User.user_id'], ),
            sa.PrimaryKeyConstraint('category_id')
        )
        op.create_index(op.f('ix_Category_name'), 'Category', ['name'], unique=False)
        op.create_index(op.f('ix_Category_owner_id'), 'Category', ['owner_id'], unique=False)
    
    # Check if 'category' column exists (old VARCHAR column)
    studyset_columns = [col['name'] for col in inspector.get_columns('StudySet')]
    
    if 'category' in studyset_columns:
        # Drop the old category VARCHAR column
        op.drop_column('StudySet', 'category')
    
    if 'subcategory' in studyset_columns:
        # Drop subcategory if it exists
        op.drop_column('StudySet', 'subcategory')
    
    # Add the new category_id UUID column if it doesn't exist
    if 'category_id' not in studyset_columns:
        op.add_column('StudySet', sa.Column('category_id', sa.Uuid(), nullable=True))
        op.create_foreign_key('fk_studyset_category', 'StudySet', 'Category', ['category_id'], ['category_id'])


def downgrade():
    # Remove foreign key and category_id column
    op.drop_constraint('fk_studyset_category', 'StudySet', type_='foreignkey')
    op.drop_column('StudySet', 'category_id')
    
    # Re-add old columns
    op.add_column('StudySet', sa.Column('category', sa.String(length=100), nullable=True))
    op.add_column('StudySet', sa.Column('subcategory', sa.String(length=100), nullable=True))
