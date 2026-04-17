from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "local"
    port: int = 8000

    database_url: str
    cors_origins: str = "http://localhost:3000"

    resend_api_key: str | None = None
    admin_notify_email: str | None = None
    email_from: str | None = None
    email_from_customer: str | None = None

    supabase_url: str | None = None
    supabase_jwt_secret: str | None = None
    admin_email_allowlist: str = ""
    public_site_url: str = "http://localhost:3000"
    public_api_url: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.cors_origins or "").strip()
        if not raw:
            return []
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def admin_email_allowlist_set(self) -> set[str]:
        raw = (self.admin_email_allowlist or "").strip()
        if not raw:
            return set()
        return {e.strip().lower() for e in raw.split(",") if e.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()

