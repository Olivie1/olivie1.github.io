"""Configuration management"""
import logging
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Server
    PORT: int = 8000
    ENV: str = "development"

    # Database
    DB_PATH: str = "./recovery.db"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "*"

    # JWT
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production"
    TRAINER_SECRET: str = "default-trainer-secret-12345"

    # LLM (OpenAI)
    OPENAI_API_KEY: str = ""
    LLM_TIMEOUT_SECONDS: int = 7

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # Logging
    LOG_LEVEL: str = "info"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get application settings (cached)"""
    return Settings()


def setup_logging(log_level: str = "info"):
    """Configure logging"""
    level = getattr(logging, log_level.upper(), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
