from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "IronMind Fitness API"
    ENV: str = "development"

    SECRET_KEY: str = "CHANGE_ME_SUPER_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = "sqlite:///./fitness.db"

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    HF_API_TOKEN: str = ""
    HF_MODEL: str = "Qwen/Qwen3-32B"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    SESSION_SECRET_KEY: str = "CHANGE_ME_SESSION_SECRET"

    # --- Daily email reminders (via Gmail SMTP) ---
    REMINDERS_ENABLED: bool = False
    GMAIL_ADDRESS: str = ""
    GMAIL_APP_PASSWORD: str = ""
    REMINDER_HOUR: int = 8
    REMINDER_TIMEZONE: str = "Asia/Kolkata"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
