from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "AI Video Translator API"
    app_env: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
