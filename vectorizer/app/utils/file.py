import uuid
from pathlib import Path

from app.core.config import settings


def gen_temp_filename(ext: str = "png") -> Path:
    return settings.temp_dir / (uuid.uuid4().hex + "." + ext)


def gen_output_filename(ext: str = "svg") -> Path:
    return settings.output_dir / (uuid.uuid4().hex + "." + ext)
