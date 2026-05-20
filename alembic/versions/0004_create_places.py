"""create places table backed by Kartverket SSR

Revision ID: 0004_create_places
Revises: 0003_drop_county_default
Create Date: 2026-05-20

Adds the ``places`` table for the live typeahead / nearest-place lookup
that replaces the 10-town hardcoded picker. Three btree indexes back the
typeahead (`name_lower` and `name_lower_ascii` use ``text_pattern_ops``
so an ILIKE prefix scan is index-resolved; `fylke_number` is the coarse
region filter), plus a GiST index on ``location`` for the nearest /
spatial-bbox lookups. Reuses the PostGIS pattern from 0001_initial.
"""

from __future__ import annotations

from alembic import op
import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004_create_places"
down_revision = "0003_drop_county_default"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "places",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("name_lower", sa.String(length=255), nullable=False),
        sa.Column("name_lower_ascii", sa.String(length=255), nullable=False),
        sa.Column("place_type", sa.String(length=64), nullable=False),
        sa.Column("kommune_name", sa.String(length=128), nullable=True),
        sa.Column("kommune_number", sa.String(length=8), nullable=True),
        sa.Column("fylke_name", sa.String(length=128), nullable=False),
        sa.Column("fylke_number", sa.String(length=4), nullable=False),
        sa.Column(
            "location",
            geoalchemy2.Geometry(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=False,
        ),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("source", "source_id", name="uq_places_source_source_id"),
    )
    op.create_index(
        "ix_places_location", "places", ["location"], postgresql_using="gist"
    )
    # ``text_pattern_ops`` lets a plain btree answer ``name_lower LIKE 'hje%'``
    # without a sequential scan. The typeahead always passes a lower-cased
    # prefix, so we never need the case-insensitive ``citext`` machinery —
    # one extra column + one extra btree is cheaper than a functional index.
    op.execute(
        "CREATE INDEX ix_places_name_lower_prefix "
        "ON places (name_lower text_pattern_ops)"
    )
    op.execute(
        "CREATE INDEX ix_places_name_lower_ascii_prefix "
        "ON places (name_lower_ascii text_pattern_ops)"
    )
    op.create_index("ix_places_fylke", "places", ["fylke_number"])


def downgrade() -> None:
    # Drop indexes explicitly before the table so the GiST drop uses the
    # right ``USING`` modifier. We do NOT drop the postgis extension here —
    # the hikes / hike_geometries tables still depend on it.
    op.drop_index("ix_places_fylke", table_name="places")
    op.execute("DROP INDEX IF EXISTS ix_places_name_lower_ascii_prefix")
    op.execute("DROP INDEX IF EXISTS ix_places_name_lower_prefix")
    op.drop_index("ix_places_location", table_name="places", postgresql_using="gist")
    op.drop_table("places")
