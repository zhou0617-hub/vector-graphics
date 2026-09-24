import io

import numpy as np
import torch
from PIL import Image
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer

from app.core.config import settings
from app.services.engines.base import UpscaleEngine


def _detect_device():
    if torch.cuda.is_available():
        return torch.device("cuda"), True
    return torch.device("cpu"), False


class RealESRGANEngine(UpscaleEngine):

    def __init__(self, model_key: str):
        model_map = {
            "anime": {
                "arch": RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                                num_block=6, num_grow_ch=32, scale=4),
                "path": str(settings.weights_dir / "RealESRGAN_x4plus_anime_6B.pth"),
                "scale": 4,
            },
            "general": {
                "arch": RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                                num_block=23, num_grow_ch=32, scale=4),
                "path": str(settings.weights_dir / "RealESRGAN_x4plus.pth"),
                "scale": 4,
            },
            "x2": {
                "arch": RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64,
                                num_block=23, num_grow_ch=32, scale=2),
                "path": str(settings.weights_dir / "RealESRGAN_x2plus.pth"),
                "scale": 2,
            },
        }
        if model_key not in model_map:
            raise ValueError(f"未知模型: {model_key}")

        cfg = model_map[model_key]
        self._name = model_key
        self._scale = cfg["scale"]

        device, use_half = _detect_device()
        is_gpu = device.type == "cuda"
        tile = 0 if is_gpu else 400

        print(f"[RealESRGANEngine] model={model_key} device={device} half={use_half} tile={tile}")

        self._upsampler = RealESRGANer(
            scale=cfg["scale"],
            model_path=cfg["path"],
            model=cfg["arch"],
            tile=tile,
            tile_pad=10,
            pre_pad=0,
            half=use_half,
            device=device,
        )

    @property
    def name(self) -> str:
        return self._name

    def upscale(self, image_bytes: bytes) -> bytes:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        output, _ = self._upsampler.enhance(np.array(img), outscale=self._scale)
        out_img = Image.fromarray(output)
        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        return buf.getvalue()
