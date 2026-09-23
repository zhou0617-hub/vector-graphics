from abc import ABC, abstractmethod


class UpscaleEngine(ABC):

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def upscale(self, image_bytes: bytes) -> bytes:
        ...
