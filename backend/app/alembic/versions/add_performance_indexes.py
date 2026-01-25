"""add performance indexes for query optimization

Revision ID: add_performance_indexes
Revises: 94247d286525
Create Date: 2026-01-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = '94247d286525'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add indexes to optimize frequently-used queries:
    - StudyActivity: user_id, studyset_id, term_id, next_review_date
    - ProgressSummary: user_id, studyset_id
    - ClassMember: user_id, class_id, status
    - ClassStudySet: class_id, studyset_id
    - Term: studyset_id
    """

    # StudyActivity indexes
    op.create_index(
        'idx_studyactivity_user_studyset',
        'StudyActivity',
        ['user_id', 'studyset_id']
    )
    op.create_index(
        'idx_studyactivity_user_term',
        'StudyActivity',
        ['user_id', 'term_id']
    )
    op.create_index(
        'idx_studyactivity_next_review',
        'StudyActivity',
        ['user_id', 'next_review_date']
    )

    # ProgressSummary indexes
    op.create_index(
        'idx_progresssummary_user_studyset',
        'ProgressSummary',
        ['user_id', 'studyset_id']
    )

    # ClassMember indexes
    op.create_index(
        'idx_classmember_user_class',
        'ClassMember',
        ['user_id', 'class_id']
    )
    op.create_index(
        'idx_classmember_class_status',
        'ClassMember',
        ['class_id', 'status']
    )

    # ClassStudySet indexes
    op.create_index(
        'idx_classstudyset_class',
        'ClassStudySet',
        ['class_id']
    )
    op.create_index(
        'idx_classstudyset_studyset',
        'ClassStudySet',
        ['studyset_id']
    )

    # Term indexes
    op.create_index(
        'idx_term_studyset',
        'Term',
        ['studyset_id']
    )

    # TestQuestion indexes
    op.create_index(
        'idx_testquestion_term',
        'TestQuestion',
        ['term_id']
    )
    op.create_index(
        'idx_testquestion_test',
        'TestQuestion',
        ['test_id']
    )

    # Test indexes
    op.create_index(
        'idx_test_studyset',
        'Test',
        ['studyset_id']
    )

    # SessionReview indexes
    op.create_index(
        'idx_sessionreview_term',
        'SessionReview',
        ['term_id']
    )
    op.create_index(
        'idx_sessionreview_session',
        'SessionReview',
        ['session_id']
    )


def downgrade():
    """Remove all performance indexes"""

    # Drop StudyActivity indexes
    op.drop_index('idx_studyactivity_user_studyset', table_name='StudyActivity')
    op.drop_index('idx_studyactivity_user_term', table_name='StudyActivity')
    op.drop_index('idx_studyactivity_next_review', table_name='StudyActivity')

    # Drop ProgressSummary indexes
    op.drop_index('idx_progresssummary_user_studyset', table_name='ProgressSummary')

    # Drop ClassMember indexes
    op.drop_index('idx_classmember_user_class', table_name='ClassMember')
    op.drop_index('idx_classmember_class_status', table_name='ClassMember')

    # Drop ClassStudySet indexes
    op.drop_index('idx_classstudyset_class', table_name='ClassStudySet')
    op.drop_index('idx_classstudyset_studyset', table_name='ClassStudySet')

    # Drop Term indexes
    op.drop_index('idx_term_studyset', table_name='Term')

    # Drop TestQuestion indexes
    op.drop_index('idx_testquestion_test', table_name='TestQuestion')
    op.drop_index('idx_testquestion_term', table_name='TestQuestion')

    # Drop Test indexes
    op.drop_index('idx_test_studyset', table_name='Test')

    # Drop SessionReview indexes
    op.drop_index('idx_sessionreview_session', table_name='SessionReview')
    op.drop_index('idx_sessionreview_term', table_name='SessionReview')
