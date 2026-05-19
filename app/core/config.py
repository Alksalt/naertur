from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://naertur:naertur@localhost:5432/naertur"
    met_user_agent: str = Field(
        default="NaerTur/0.1 local-dev@example.com",
        description="MET requires an identifying User-Agent.",
    )
    admin_import_token: str | None = None
    morotur_base_url: str = "https://morotur.no"
    safety_cache_minutes: int = 45
    search_safety_candidate_limit: int = 25


@lru_cache
def get_settings() -> Settings:
    return Settings()

