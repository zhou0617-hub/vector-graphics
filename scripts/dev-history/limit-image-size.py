from pathlib import Path

path = Path(__file__).parent / "vectorizer" / "app" / "services" / "engines" / "vtracer_engine.py"

code = """import io
import vtracer
from PIL import Image

from app.services.engines.base import VectorizerEngine, VectorizeOptions


class VTracerEngine(VectorizerEngine):

    # 最大输入图片尺寸（长边），超过则自动缩小
    # 大图会显著拖慢 VTracer，限制尺寸保证响应时间
    MAX_IMAGE_SIZE = 1500

    @property
    def name(self) -> str:
        return "vtracer"

    def vectorize(self, image_bytes: bytes, options: VectorizeOptions) -> str:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        # 限制最大尺寸，防止大图拖慢处理
        w, h = img.size
        max_side = max(w, h)
        if max_side > self.MAX_IMAGE_SIZE:
            ratio = self.MAX_IMAGE_SIZE / max_side
            new_w = int(w * ratio)
            new_h = int(h * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        svg_str = vtracer.convert_raw_image_to_svg(
            png_bytes,
            colormode=options.colormode,
            hierarchical=options.hierarchical,
            mode=options.mode,
            filter_speckle=options.filter_speckle,
            color_precision=options.color_precision,
            layer_difference=options.layer_difference,
            corner_threshold=options.corner_threshold,
            length_threshold=options.length_threshold,
            max_iterations=options.max_iterations,
            splice_threshold=options.splice_threshold,
            path_precision=options.path_precision,
        )
        return svg_str
"""

path.write_text(code, encoding="utf-8")
print(f"  [重写] {path.relative_to(Path(__file__).parent)} - 加图片尺寸限制 1500px")
