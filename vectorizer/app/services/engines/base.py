from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class VectorizeOptions:
    colormode: str = "color"
    hierarchical: str = "stacked"
    mode: str = "spline"
    filter_speckle: int = 4
    color_precision: int = 6
    layer_difference: int = 16
    corner_threshold: int = 60
    length_threshold: float = 4.0
    max_iterations: int = 10
    splice_threshold: int = 45
    path_precision: int = 3


class VectorizerEngine(ABC):

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @abstractmethod
    def vectorize(self, image_bytes: bytes, options: VectorizeOptions) -> str:
        ...
