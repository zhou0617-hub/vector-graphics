from typing import Literal, Optional
from pydantic import BaseModel, Field


class VectorizeParams(BaseModel):
    colormode: Literal["color", "binary"] = Field(default="color")
    hierarchical: Literal["stacked", "cutout"] = Field(default="stacked")
    mode: Literal["spline", "polygon", "none"] = Field(default="spline")
    filter_speckle: int = Field(default=4, ge=0, le=128)
    color_precision: int = Field(default=6, ge=1, le=8)
    layer_difference: int = Field(default=16, ge=0, le=255)
    corner_threshold: int = Field(default=60, ge=0, le=180)
    length_threshold: float = Field(default=4.0, ge=0.0, le=10.0)
    max_iterations: int = Field(default=10, ge=1, le=100)
    splice_threshold: int = Field(default=45, ge=0, le=180)
    path_precision: int = Field(default=3, ge=0, le=8)


class VectorizeResponse(BaseModel):
    success: bool
    svg: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    elapsed_ms: Optional[int] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
