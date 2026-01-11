"""Add learning session tables

Revision ID: add_learning_session
Revises: 
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = 'add_learning_session'
down_revision = None  # Update this if you have previous migrations
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create SessionStatus enum (if not exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE sessionstatus AS ENUM ('active', 'completed', 'abandoned');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Check if LearningSession table already exists
    conn = op.get_bind()
    result = conn.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'LearningSession'
        );
    """))
    table_exists = result.scalar()
    
    if not table_exists:
        # Create LearningSession table
        op.create_table(
            'LearningSession',
            sa.Column('session_id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('User.user_id'), nullable=False),
            sa.Column('studyset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('StudySet.studyset_id'), nullable=True),
            sa.Column('session_type', sa.String(), nullable=False, default='flashcard'),
            sa.Column('status', postgresql.ENUM('active', 'completed', 'abandoned', name='sessionstatus', create_type=False), nullable=False, default='active'),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('total_cards', sa.Integer(), nullable=False, default=0),
        sa.Column('completed_cards', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        )
        
        # Create SessionReview table
        result = conn.execute(sa.text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'SessionReview'
            );
        """))
        review_table_exists = result.scalar()
        
        if not review_table_exists:
            op.create_table(
                'SessionReview',
        sa.Column('review_id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('LearningSession.session_id'), nullable=False),
        sa.Column('term_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('Term.term_id'), nullable=False),
        sa.Column('recall_score', sa.Integer(), nullable=False, default=0),
        sa.Column('response_time', sa.Float(), nullable=False, default=0.0),
                sa.Column('hint_used', sa.Boolean(), nullable=False, default=False),
                sa.Column('created_at', sa.DateTime(), nullable=False),
            )
            
            # Create indexes
            op.create_index('ix_learningsession_user_id', 'LearningSession', ['user_id'], if_not_exists=True)
            op.create_index('ix_learningsession_status', 'LearningSession', ['status'], if_not_exists=True)
            op.create_index('ix_sessionreview_session_id', 'SessionReview', ['session_id'], if_not_exists=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_sessionreview_session_id')
    op.drop_index('ix_learningsession_status')
    op.drop_index('ix_learningsession_user_id')
    
    # Drop tables
    op.drop_table('SessionReview')
    op.drop_table('LearningSession')
    
    # Drop enum
    op.execute('DROP TYPE sessionstatus')
