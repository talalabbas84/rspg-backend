"""Add OUTPUT to variable type enum

Revision ID: 85977ac2f3da
Revises: f567cabf31c2
Create Date: 2025-06-28 14:37:49.674344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85977ac2f3da'
down_revision: Union[str, Sequence[str], None] = 'f567cabf31c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE variabletypeenum ADD VALUE IF NOT EXISTS 'output';")

    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
