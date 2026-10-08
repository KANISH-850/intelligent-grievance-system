from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Grievance System - AI Service"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Text validation constraints
    MIN_TEXT_LENGTH: int = 3
    MAX_TEXT_LENGTH: int = 5000
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
