from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "air_quality_db"
    OPENAQ_API_KEY: str = "6d342f2ec6b4f692d2c76effff5439f971b983830060e7d8a6c51097927d83c9"

    class Config:
        env_file = ".env"

settings = Settings()
