import time
from typing import Tuple

from app.services.engines.base import VectorizeOptions
from app.services.engines.vtracer_engine import VTracerEngine


class VectorizerService:

    def __init__(self) -> None:
        self._engine = VTracerEngine()

    @property
    def engine_name(self) -> str:
        return self._engine.name

    def vectorize(
        self,
        image_bytes: bytes,
        options: VectorizeOptions,
    ) -> Tuple[str, int]:
        start = time.perf_counter()
        svg = self._engine.vectorize(image_bytes, options)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        return svg, elapsed_ms


vectorizer_service = VectorizerService()
