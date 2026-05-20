from __future__ import annotations

import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Hike(Base):
    __tablename__ = "hikes"
    __table_args__ = (UniqueConstraint("source", "source_id", name="uq_hikes_source_source_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[str] = mapped_column(String(128), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    municipalities: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    # `county` stays NOT NULL but no longer carries a default. The default
    # previously baked Møre og Romsdal into the schema, which blocks adding
    # any non-MR source without an Alembic migration. Each importer is
    # responsible for naming the county it imports for (see
    # `app.services.morotur.MOROTUR_COUNTY`).
    county: Mapped[str] = mapped_column(String(128), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False)
    distance_meters: Mapped[int | None] = mapped_column(Integer)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    ascent_meters: Mapped[int | None] = mapped_column(Integer)
    highest_point_meters: Mapped[int | None] = mapped_column(Integer)
    season_months: Mapped[list[int]] = mapped_column(JSONB, nullable=False, default=list)
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    transport_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    geometry: Mapped["HikeGeometry"] = relationship(
        back_populates="hike", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )
    safety_snapshots: Mapped[list["SafetySnapshot"]] = relationship(
        back_populates="hike", cascade="all, delete-orphan"
    )


class HikeGeometry(Base):
    __tablename__ = "hike_geometries"

    hike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hikes.id", ondelete="CASCADE"), primary_key=True
    )
    route: Mapped[object] = mapped_column(
        Geometry("LINESTRING", srid=4326, spatial_index=False), nullable=False
    )
    trailhead: Mapped[object] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=False), nullable=False
    )
    route_geojson: Mapped[dict] = mapped_column(JSONB, nullable=False)

    hike: Mapped[Hike] = relationship(back_populates="geometry")


class SourceRecord(Base):
    __tablename__ = "source_records"
    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_source_records_source_source_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[str] = mapped_column(String(128), nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    import_status: Mapped[str] = mapped_column(String(32), nullable=False)
    error: Mapped[str | None] = mapped_column(Text)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SafetySnapshot(Base):
    __tablename__ = "safety_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hike_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hikes.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    hike: Mapped[Hike] = relationship(back_populates="safety_snapshots")


class Place(Base):
    """Settlement / point-of-orientation row sourced from Kartverket SSR.

    Carries a denormalised copy of the upstream record so the typeahead /
    nearest endpoints can answer without a join to the original payload.
    ``name_lower`` powers a btree prefix index for ILIKE-style typeahead;
    ``name_lower_ascii`` is the same string with Norwegian-specific glyphs
    folded (``ø→o``, ``æ→ae``, ``å→aa``) so a user typing ``bo`` finds ``Bø``.
    The folding is done at import time, not query time, so the prefix btree
    can serve both columns.
    """

    __tablename__ = "places"
    __table_args__ = (
        UniqueConstraint("source", "source_id", name="uq_places_source_source_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_lower: Mapped[str] = mapped_column(String(255), nullable=False)
    name_lower_ascii: Mapped[str] = mapped_column(String(255), nullable=False)
    place_type: Mapped[str] = mapped_column(String(64), nullable=False)
    kommune_name: Mapped[str | None] = mapped_column(String(128))
    kommune_number: Mapped[str | None] = mapped_column(String(8))
    fylke_name: Mapped[str] = mapped_column(String(128), nullable=False)
    fylke_number: Mapped[str] = mapped_column(String(4), nullable=False)
    location: Mapped[object] = mapped_column(
        Geometry("POINT", srid=4326, spatial_index=False), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
