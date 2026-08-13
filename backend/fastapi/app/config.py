import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    database_url: str = os.environ.get("DATABASE_URL", "postgresql://user:pass@localhost:5432/bussdash")
    jwt_secret: str = os.environ.get("JWT_SECRET", "change-me")
    jwt_algorithm: str = "HS256"
    port: int = int(os.environ.get("FASTAPI_PORT", "8000"))


settings = Settings()
