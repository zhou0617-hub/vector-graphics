import io
import vtracer
from PIL import Image

from app.services.engines.base import VectorizerEngine, VectorizeOptions


class VTracerEngine(VectorizerEngine):

    @property
    def name(self) -> str:
        return "vtracer"

    def vectorize(self, image_bytes: bytes, options: VectorizeOptions) -> str:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

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
