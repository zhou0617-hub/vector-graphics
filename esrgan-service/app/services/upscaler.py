from app.services.engines.realesrgan_engine import RealESRGANEngine


class UpscalerService:

    def __init__(self):
        self._engines = {}

    def get_engine(self, model_key: str) -> RealESRGANEngine:
        if model_key not in self._engines:
            self._engines[model_key] = RealESRGANEngine(model_key)
        return self._engines[model_key]

    def upscale(self, image_bytes: bytes, model_key: str) -> bytes:
        engine = self.get_engine(model_key)
        return engine.upscale(image_bytes)


upscaler_service = UpscalerService()
