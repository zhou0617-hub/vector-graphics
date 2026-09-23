from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """矢量化服务配置"""

    app_name: str = "Vectorizer Service"
    debug: bool = False

    max_upload_size: int = 10 * 1024 * 1024
    allowed_formats: set = {"PNG", "JPEG", "JPG", "WEBP"}

    base_dir: Path = Path(__file__).resolve().parent.parent.parent
    temp_dir: Path = base_dir / "tmp"
    output_dir: Path = base_dir / "outputs"

    default_colormode: str = "color"
    default_hierarchical: str = "stacked"
    default_mode: str = "spline"
    default_filter_speckle: int = 4
    default_color_precision: int = 6
    default_layer_difference: int = 16
    default_corner_threshold: int = 60
    default_length_threshold: float = 4.0
    default_max_iterations: int = 10
    default_splice_threshold: int = 45
    default_path_precision: int = 3

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def ensure_dirs(self) -> None:
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
