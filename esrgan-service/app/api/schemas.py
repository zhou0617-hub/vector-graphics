from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class UpscaleResponse(BaseModel):
    success: bool
    message: Optional[str] = None
