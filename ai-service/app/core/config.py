from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Grievance System - AI Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # Text validation constraints
    MIN_TEXT_LENGTH: int = 3
    MAX_TEXT_LENGTH: int = 5000

    # Translation configuration
    TRANSLATION_PROVIDER: str = "local_rule_based"
    TRANSLATION_API_URL: Optional[str] = None
    TRANSLATION_API_KEY: Optional[str] = None

    # OpenAI-compatible multimodal Chat Completions endpoint, called only server-side.
    VISION_API_URL: Optional[str] = None
    VISION_API_KEY: Optional[str] = None
    VISION_MODEL: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
