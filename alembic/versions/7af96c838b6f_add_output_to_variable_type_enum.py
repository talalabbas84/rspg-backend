"""Add OUTPUT to variable type enum

Revision ID: 7af96c838b6f
Revises: 85977ac2f3da
Create Date: 2025-06-28 14:41:02.644354

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7af96c838b6f'
down_revision: Union[str, Sequence[str], None] = '85977ac2f3da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE variabletypeenum ADD VALUE IF NOT EXISTS 'output';")



def downgrade() -> None:
    """Downgrade schema."""
    pass
