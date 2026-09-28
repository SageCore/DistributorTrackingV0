from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "development"
    APP_NAME: str = "Distributor Tracker API"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/distributor_tracker"
    V0_API_KEY: str = "v0-distributor-secret-key-change-in-prod"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        """Ensure DATABASE_URL uses an async driver for SQLAlchemy if plain postgresql:// is provided."""
        if isinstance(v, str):
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    @property
    def sync_database_url(self) -> str:
        """Returns a synchronous version of DATABASE_URL suitable for Alembic migrations."""
        url = self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
        elif url.startswith("sqlite+aiosqlite://"):
            return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
        return url


settings = Settings()
