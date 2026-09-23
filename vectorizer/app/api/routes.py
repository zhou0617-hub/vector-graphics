import io
import json
import re

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

from app.api.schemas import HealthResponse, VectorizeParams, VectorizeResponse
from app.core.config import settings
from app.services.engines.base import VectorizeOptions
from app.services.vectorizer import vectorizer_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name, version="0.1.0")


@router.post("/vectorize", response_model=VectorizeResponse)
async def vectorize(
    file: UploadFile = File(...),
    params: str = Form(default="{}"),
):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="缺少文件类型")

    content = await file.read()

    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail="文件过大，最大 " + str(settings.max_upload_size // 1024 // 1024) + " MB",
        )

    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
        fmt = (img.format or "").upper()
        if fmt not in settings.allowed_formats:
            raise HTTPException(
                status_code=400,
                detail="不支持的格式：" + fmt + "，仅支持 PNG / JPG / WebP",
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="无效的图片文件")

    try:
        raw = json.loads(params) if params else {}
        p = VectorizeParams(**raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail="参数错误：" + str(e))

    options = VectorizeOptions(
        colormode=p.colormode,
        hierarchical=p.hierarchical,
        mode=p.mode,
        filter_speckle=p.filter_speckle,
        color_precision=p.color_precision,
        layer_difference=p.layer_difference,
        corner_threshold=p.corner_threshold,
        length_threshold=p.length_threshold,
        max_iterations=p.max_iterations,
        splice_threshold=p.splice_threshold,
        path_precision=p.path_precision,
    )

    try:
        svg, elapsed_ms = vectorizer_service.vectorize(content, options)
    except Exception as e:
        raise HTTPException(status_code=500, detail="矢量化失败：" + str(e))

    width = height = None
    m = re.search(r'width="(\d+)"', svg)
    if m:
        width = int(m.group(1))
    m = re.search(r'height="(\d+)"', svg)
    if m:
        height = int(m.group(1))

    return VectorizeResponse(
        success=True,
        svg=svg,
        width=width,
        height=height,
        elapsed_ms=elapsed_ms,
    )


@router.post("/vectorize/download")
async def vectorize_download(
    file: UploadFile = File(...),
    params: str = Form(default="{}"),
):
    result = await vectorize(file=file, params=params)
    if not result.svg:
        raise HTTPException(status_code=500, detail="生成失败")
    return JSONResponse(
        content={"svg": result.svg},
        headers={"Content-Disposition": 'attachment; filename="output.svg"'},
    )
