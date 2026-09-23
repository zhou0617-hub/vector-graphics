import base64
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.api.schemas import HealthResponse
from app.core.config import settings
from app.services.upscaler import upscaler_service

router = APIRouter()

ALLOWED_MODELS = {"anime", "general", "x2"}


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", service=settings.app_name, version="0.1.0")


@router.post("/upscale")
async def upscale(
    file: UploadFile = File(...),
    model: str = Form("anime"),
):
    if model not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail=f"不支持的模型: {model}")

    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=413, detail="文件过大")

    try:
        result_bytes = upscaler_service.upscale(content, model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"超分失败: {e}")

    return {
        "success": True,
        "image_base64": base64.b64encode(result_bytes).decode("ascii"),
        "message": None,
    }


@router.post("/upscale/image")
async def upscale_image(
    file: UploadFile = File(...),
    model: str = Form("anime"),
):
    if model not in ALLOWED_MODELS:
        raise HTTPException(status_code=400, detail=f"不支持的模型: {model}")

    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=413, detail="文件过大")

    try:
        result_bytes = upscaler_service.upscale(content, model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"超分失败: {e}")

    return Response(content=result_bytes, media_type="image/png")
