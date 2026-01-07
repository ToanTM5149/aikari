"""add_is_ai_generated_to_test

Revision ID: a1b2c3d4e5f6
Revises: 90fdd5195bd6
Create Date: 2026-01-04 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '90fdd5195bd6'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_ai_generated column
    op.add_column('Test', sa.Column('is_ai_generated', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add ai_generated_by column (nullable, foreign key to User)
    op.add_column('Test', sa.Column('ai_generated_by', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_test_ai_generated_by_user',
        'Test', 'User',
        ['ai_generated_by'], ['user_id']
    )


def downgrade():
    # Remove foreign key first
    op.drop_constraint('fk_test_ai_generated_by_user', 'Test', type_='foreignkey')
    
    # Remove columns
    op.drop_column('Test', 'ai_generated_by')
    op.drop_column('Test', 'is_ai_generated')

