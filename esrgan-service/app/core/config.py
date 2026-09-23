from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Real-ESRGAN Service"
    debug: bool = False

    max_upload_size: int = 10 * 1024 * 1024
    allowed_formats: set = {"PNG", "JPEG", "JPG", "WEBP"}

    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    weights_dir: Path = base_dir / "weights"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
