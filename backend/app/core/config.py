# backend/app/core/config.py
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = Field("HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(60, env="ACCESS_TOKEN_DURATION")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
