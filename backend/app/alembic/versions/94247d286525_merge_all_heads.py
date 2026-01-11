"""merge all heads

Revision ID: 94247d286525
Revises: 7f00dc22597d, add_learning_session, remove_attribute_token_blacklist
Create Date: 2026-01-12 01:29:17.353868

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '94247d286525'
down_revision = ('7f00dc22597d', 'add_learning_session', 'remove_attribute_token_blacklist')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
