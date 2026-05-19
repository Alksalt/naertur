"""initial backend schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-19
"""

from __future__ import annotations

from alembic import op
import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "hikes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("municipalities", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("county", sa.String(length=128), nullable=False, server_default="Møre og Romsdal"),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("distance_meters", sa.Integer(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("ascent_meters", sa.Integer(), nullable=True),
        sa.Column("highest_point_meters", sa.Integer(), nullable=True),
        sa.Column("season_months", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("transport_notes", sa.Text(), nullable=True),
        sa.Column("quality_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("source", "source_id", name="uq_hikes_source_source_id"),
    )
    op.create_index("ix_hikes_difficulty", "hikes", ["difficulty"])
    op.create_index("ix_hikes_county", "hikes", ["county"])

    op.create_table(
        "hike_geometries",
        sa.Column("hike_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hikes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column(
            "route",
            geoalchemy2.Geometry(geometry_type="LINESTRING", srid=4326, spatial_index=False),
            nullable=False,
        ),
        sa.Column(
            "trailhead",
            geoalchemy2.Geometry(geometry_type="POINT", srid=4326, spatial_index=False),
            nullable=False,
        ),
        sa.Column("route_geojson", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )
    op.create_index("ix_hike_geometries_route", "hike_geometries", ["route"], postgresql_using="gist")
    op.create_index("ix_hike_geometries_trailhead", "hike_geometries", ["trailhead"], postgresql_using="gist")

    op.create_table(
        "source_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_id", sa.String(length=128), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("import_status", sa.String(length=32), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("imported_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("source", "source_id", name="uq_source_records_source_source_id"),
    )

    op.create_table(
        "safety_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("hike_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hikes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("reasons", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("checked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_safety_snapshots_hike_provider", "safety_snapshots", ["hike_id", "provider"])
    op.create_index("ix_safety_snapshots_expires_at", "safety_snapshots", ["expires_at"])


def downgrade() -> None:
    op.drop_table("safety_snapshots")
    op.drop_table("source_records")
    op.drop_index("ix_hike_geometries_trailhead", table_name="hike_geometries", postgresql_using="gist")
    op.drop_index("ix_hike_geometries_route", table_name="hike_geometries", postgresql_using="gist")
    op.drop_table("hike_geometries")
    op.drop_index("ix_hikes_county", table_name="hikes")
    op.drop_index("ix_hikes_difficulty", table_name="hikes")
    op.drop_table("hikes")
