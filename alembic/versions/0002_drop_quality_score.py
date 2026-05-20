"""drop quality_score column from hikes

Revision ID: 0002_drop_quality_score
Revises: 0001_initial
Create Date: 2026-05-20

Removes the unused ``quality_score`` column. Imported rows scored
identically (all six conditions of the old heuristic hit on a well-formed
Morotur payload), so the column gave the randomizer no useful signal.
The randomizer now scores from 0 using only tag-overlap and distance.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002_drop_quality_score"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("hikes", "quality_score")


def downgrade() -> None:
    op.add_column(
        "hikes",
        sa.Column(
            "quality_score",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
