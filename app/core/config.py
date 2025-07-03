from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Any
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "MPSG AI Sequence Generator Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "dev" # dev, stage, prod

    # Security
    SECRET_KEY: str # Used for JWT token signing
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str # e.g., "postgresql+asyncpg://user:pass@host:port/db" or "sqlite+aiosqlite:///./test.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    # @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    # @classmethod
    # def parse_cors_origins(cls, v: Any) -> List[str]:
    #     if isinstance(v, str):
    #         # Handle both JSON array and comma-separated
    #         import json
    #         try:
    #             origins = json.loads(v)
    #             if isinstance(origins, list):
    #                 return origins
    #         except Exception:
    #             return [i.strip() for i in v.split(",")]
    #     return v

    # LLM API Key
    CLAUDE_API_KEY: str

    # Optional: First superuser for initial setup
    FIRST_SUPERUSER_EMAIL: str | None = None
    FIRST_SUPERUSER_PASSWORD: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
