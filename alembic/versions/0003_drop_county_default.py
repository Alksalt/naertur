"""drop hardcoded Møre og Romsdal default from hikes.county

Revision ID: 0003_drop_county_default
Revises: 0002_drop_quality_score
Create Date: 2026-05-20

The original schema set ``county`` to default ``'Møre og Romsdal'`` for
every Hike row inserted without an explicit value. That bakes a regional
assumption into the schema and silently mislabels rows imported from any
future non-MR source. Each importer is now responsible for naming its
own county (see ``app.services.morotur.MOROTUR_COUNTY``); the column
stays NOT NULL but has no default.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0003_drop_county_default"
down_revision = "0002_drop_quality_score"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use raw SQL so we drop the server-side DEFAULT without rewriting the
    # column type. ``op.alter_column`` with ``server_default=None`` would
    # set it to NULL on some dialects and leave existing rows untouched
    # either way.
    op.execute("ALTER TABLE hikes ALTER COLUMN county DROP DEFAULT")


def downgrade() -> None:
    op.execute(
        "ALTER TABLE hikes ALTER COLUMN county SET DEFAULT 'Møre og Romsdal'"
    )
