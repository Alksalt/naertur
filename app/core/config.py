from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from slowapi import Limiter
from slowapi.util import get_remote_address


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://naertur:naertur@localhost:5432/naertur"
    met_user_agent: str | None = Field(
        default=None,
        description=(
            "MET requires an identifying User-Agent. Must be set via env to a real "
            "contact (do not use example.com)."
        ),
    )
    admin_import_token: str | None = None
    morotur_base_url: str = "https://morotur.no"
    safety_cache_minutes: int = 45
    nve_cache_minutes: int = 360
    search_safety_candidate_limit: int = 10
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"]
    )

    # ---- Sentralt stedsnavnregister (SSR) -----------------------------------
    # SSR is Kartverket's authoritative place-name service. NLOD 2.0, no auth.
    # ``ssr_default_fnr`` is Møre og Romsdal's fylkesnummer ("15"); the import
    # endpoint accepts an override.
    #
    # IMPORTANT: ``ssr_place_types`` carries the SSR ``navneobjekttype`` filter
    # *codes* (camelCase), NOT the human-readable display strings. The /sted
    # endpoint accepts the code form when filtering (verified against the live
    # API on 2026-05-20 — ``navneobjekttype=Tettsted`` returns zero rows,
    # ``navneobjekttype=tettsted`` returns the expected matches). The display
    # form is what the API echoes back in each ``navn`` payload; the importer
    # normalises both ends so /admin/import/ssr can be called with either.
    ssr_base_url: str = "https://ws.geonorge.no/stedsnavn/v1"
    ssr_default_fnr: str = "15"
    ssr_place_types: list[str] = Field(
        default_factory=lambda: [
            "tettsted",
            "by",
            "bygdelagBygd",
            "grend",
            "gard",
            "boligfelt",
            "tettbebyggelse",
        ]
    )

    @field_validator("met_user_agent")
    @classmethod
    def _validate_met_user_agent(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("met_user_agent must not be empty or whitespace")
        if "example.com" in stripped.lower():
            raise ValueError(
                "met_user_agent must identify a real contact; example.com is rejected by MET"
            )
        return stripped


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Shared slowapi limiter. Defined here (rather than in app.main) so route
# modules can import the decorator without a circular dependency on the
# FastAPI app.
limiter = Limiter(key_func=get_remote_address)
