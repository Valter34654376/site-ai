"""Prepare only the explicitly authorized catalogue, without upscaling or Instagram scraping.

Requires: python -m pip install Pillow
Run from any directory: python scripts/prepare-media.py
Downloaded sources remain in ignored .qa/originals. Public derivatives carry no EXIF.
"""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/data/media-catalog.json"
catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
cache = ROOT / ".qa/originals"
cache.mkdir(parents=True, exist_ok=True)


def prepare(item):
    if item["rightsStatus"] not in {"owner-confirmed", "licensed", "owned"}:
        raise ValueError(f"Missing authorization: {item['id']}")
    original = cache / f"{item['id']}.jpg"
    if not original.exists():
        request = Request(item["sourceUrl"], headers={"User-Agent": "SolarOpara-MediaPreparation/1.0"})
        with urlopen(request, timeout=45) as response:
            data = response.read(25_000_001)
        if len(data) > 25_000_000:
            raise ValueError("Source exceeds the 25 MB safety limit")
        Image.open(BytesIO(data)).verify()
        original.write_bytes(data)
    with Image.open(original) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        width, height = image.size
        item["originalWidth"], item["originalHeight"] = width, height
        item["orientation"] = "horizontal" if width > height else "vertical" if height > width else "square"
        folder = ROOT / "public/media" / item["category"]
        folder.mkdir(parents=True, exist_ok=True)
        variants = []
        for size in sorted({min(size, width) for size in [480, 800, 1280, 1920]}):
            resized = image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            target = folder / f"{item['slug']}-{size}.webp"
            resized.save(target, "WEBP", quality=83 if size <= 1280 else 87, method=6)
            variants.append({"src": "/" + target.relative_to(ROOT / "public").as_posix(), "width": resized.width, "height": resized.height, "bytes": target.stat().st_size})
        item["variants"] = variants
        default = min(variants, key=lambda v: abs(v["width"] - 1280))
        item["src"], item["width"], item["height"] = default["src"], default["width"], default["height"]
        item["fullSrc"] = variants[-1]["src"]
        print(f"Prepared {item['id']}: {width}x{height}, {len(variants)} WebP sizes", flush=True)
    return item


with ThreadPoolExecutor(max_workers=3) as pool:
    catalog["media"] = list(pool.map(prepare, catalog["media"]))
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
