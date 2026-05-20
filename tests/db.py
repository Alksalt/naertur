"""Shared test-database helpers.

Tests that need a real Postgres/PostGIS database point at ``naertur_test``,
NEVER at the dev ``naertur`` database. Running tests against the dev DB used
to wipe live importer state (the importer tests truncate all tables in their
setup fixture); routing through a dedicated test DB makes the test suite
non-destructive.

Bootstrap order, executed once per pytest session by ``ensure_test_database``:

1. Connect to the ``postgres`` system database as the ``naertur`` user.
2. ``CREATE DATABASE naertur_test`` if it doesn't yet exist (idempotent).
3. ``CREATE EXTENSION IF NOT EXISTS postgis`` inside the test DB.
4. Run Alembic ``upgrade head`` against the test DB URL.

If Postgres is unreachable (e.g. ``docker compose up db`` not running), the
helper raises ``RuntimeError``; callers that depend on DB tests should catch
this and call ``pytest.skip`` so unit-only runs on laptops without Docker
still pass.
"""

from __future__ import annotations

import asyncio

import asyncpg
from alembic import command
from alembic.config import Config

# Hardcoded host/port/user/password match docker-compose.yml — the test DB
# lives on the same Postgres instance as dev, just on a separate database
# name. The dev DB stays at ``naertur``; tests only ever touch ``naertur_test``.
TEST_DATABASE_NAME = "naertur_test"
TEST_DATABASE_URL = f"postgresql+asyncpg://naertur:naertur@localhost:5432/{TEST_DATABASE_NAME}"
_SYSTEM_DSN = "postgresql://naertur:naertur@localhost:5432/postgres"


async def _create_test_database_if_missing() -> None:
    """Create ``naertur_test`` and install PostGIS if either is missing.

    Connects to the ``postgres`` system database (CREATE DATABASE cannot run
    inside a transaction block, hence the separate connection). All DDL is
    idempotent: if the database already exists, nothing happens.

    Concurrency: pytest-xdist spawns one worker process per ``-n``. Without
    serialization, two workers can hit the ``SELECT 1 FROM pg_database``
    check at the same time, both observe absence, and then race on
    ``CREATE DATABASE`` — one wins, the other crashes with
    ``duplicate_database``. We guard the create-if-missing block with a
    Postgres advisory lock (session-scoped, auto-released on connection
    close) keyed on a stable hash of the test DB name. The lock is held
    on the system ``postgres`` DB so it does not conflict with any
    Alembic transactions inside ``naertur_test``.
    """

    sys_conn = await asyncpg.connect(dsn=_SYSTEM_DSN)
    try:
        # ``hashtext`` is a built-in Postgres function that returns a
        # stable int32 for any string; we use it as the lock key so the
        # ID is deterministic across processes without us hardcoding a
        # magic integer that could collide with another app's locks.
        await sys_conn.execute(
            "SELECT pg_advisory_lock(hashtext('naertur_test_bootstrap'))"
        )
        try:
            exists = await sys_conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", TEST_DATABASE_NAME
            )
            if not exists:
                # asyncpg disallows parameterized DDL; the literal name is safe
                # here because it is a module-level constant, not user input.
                await sys_conn.execute(
                    f'CREATE DATABASE "{TEST_DATABASE_NAME}" OWNER naertur'
                )
        finally:
            await sys_conn.execute(
                "SELECT pg_advisory_unlock(hashtext('naertur_test_bootstrap'))"
            )
    finally:
        await sys_conn.close()

    test_conn = await asyncpg.connect(
        dsn=f"postgresql://naertur:naertur@localhost:5432/{TEST_DATABASE_NAME}"
    )
    try:
        await test_conn.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    finally:
        await test_conn.close()


def ensure_test_database() -> None:
    """Bootstrap the test database (idempotent).

    Safe to call multiple times — both ``CREATE DATABASE`` and the Alembic
    upgrade are no-ops once the schema is current.
    """

    try:
        asyncio.run(_create_test_database_if_missing())
    except (OSError, asyncpg.PostgresError) as exc:
        raise RuntimeError(
            f"Cannot reach Postgres to bootstrap {TEST_DATABASE_NAME!r}: {exc}"
        ) from exc

    # Alembic env.py reads ``sqlalchemy.url`` off the config it is handed,
    # so overriding it here points the migration runner at the test DB
    # without touching ``alembic.ini`` (which still targets dev). The env
    # var override mirrors the alembic_cfg setting because env.py also
    # calls ``settings.database_url`` from ``app.core.config`` and would
    # otherwise re-stamp the dev URL over our test override.
    import os
    previous_db_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    try:
        # Clear the lru_cache so the env-var override is picked up.
        from app.core.config import get_settings
        get_settings.cache_clear()
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
        command.upgrade(alembic_cfg, "head")
    finally:
        if previous_db_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_db_url
        get_settings.cache_clear()
