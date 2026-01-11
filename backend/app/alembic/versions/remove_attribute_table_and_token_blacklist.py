"""Remove Attribute table, token_blacklist table, and ATTRIBUTE from GenerateType enum

Revision ID: remove_attribute_token_blacklist
Revises: 3271fb88dca1
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'remove_attribute_token_blacklist'
down_revision = '3271fb88dca1'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Drop Attribute table (if exists)
    op.drop_table('Attribute', if_exists=True)
    
    # 2. Drop token_blacklist table and its indexes (if exists)
    op.drop_index('ix_token_blacklist_user_id', table_name='token_blacklist', if_exists=True)
    op.drop_index('ix_token_blacklist_token_type', table_name='token_blacklist', if_exists=True)
    op.drop_index('ix_token_blacklist_jti', table_name='token_blacklist', if_exists=True)
    op.drop_table('token_blacklist', if_exists=True)
    
    # 3. Remove ATTRIBUTE from GenerateType enum
    # First, delete any records with generate_type = 'ATTRIBUTE' (if any exist)
    op.execute("""
        DELETE FROM "AIGeneratedContents" 
        WHERE generate_type::text = 'ATTRIBUTE'
    """)
    
    # Create temporary enum without ATTRIBUTE
    op.execute("CREATE TYPE generatetype_tmp AS ENUM ('TEST', 'PARAGRAPH')")
    
    # Alter AIGeneratedContents table to use new enum
    op.execute("""
        ALTER TABLE "AIGeneratedContents" 
        ALTER COLUMN generate_type TYPE generatetype_tmp 
        USING generate_type::text::generatetype_tmp
    """)
    
    # Drop old enum and rename tmp to original
    op.execute("DROP TYPE generatetype")
    op.execute("ALTER TYPE generatetype_tmp RENAME TO generatetype")


def downgrade():
    # 1. Recreate GenerateType enum with ATTRIBUTE
    op.execute("CREATE TYPE generatetype_tmp AS ENUM ('TEST', 'ATTRIBUTE', 'PARAGRAPH')")
    op.execute("""
        ALTER TABLE "AIGeneratedContents" 
        ALTER COLUMN generate_type TYPE generatetype_tmp 
        USING generate_type::text::generatetype_tmp
    """)
    op.execute("DROP TYPE generatetype")
    op.execute("ALTER TYPE generatetype_tmp RENAME TO generatetype")
    
    # 2. Recreate token_blacklist table
    op.create_table(
        'token_blacklist',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('jti', sa.String(), nullable=False, unique=True),
        sa.Column('token_type', sa.String(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
    )
    op.create_index('ix_token_blacklist_jti', 'token_blacklist', ['jti'], unique=True)
    op.create_index('ix_token_blacklist_token_type', 'token_blacklist', ['token_type'])
    op.create_index('ix_token_blacklist_user_id', 'token_blacklist', ['user_id'])
    
    # 3. Recreate Attribute table
    op.create_table(
        'Attribute',
        sa.Column('attribute_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('studyset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('StudySet.studyset_id'), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('content_trans', sa.Text(), nullable=True),
        sa.Column('content_type', postgresql.ENUM('DEFAULT', 'AI_GENERATED', name='contenttype', create_type=False), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=True),
    )
