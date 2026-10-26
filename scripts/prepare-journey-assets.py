"""Prepare Mode B art for the 960x200 travel strip.

Source plates are cinematic 2.35:1 (1584x672). The strip is 24:5, so each
plate is cropped vertically around a per-scene focus point. walk/camp are
chroma/white-background cutouts, because JPEG has no alpha.

Run from the repo root:
    <python> scripts/prepare-journey-assets.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "journey-source"
ASSETS = ROOT / "src" / "renderer" / "journey" / "assets"

# Focus is the normalized y centre of the 24:5 crop. The crop keeps the full
# width; it only removes sky/foreground, never left/right composition.
PLATES = {
    "00-mist-valley.jpg": ("00-mist-valley.jpg", 0.47),
    "01-pine-slope.jpg": ("01-pine-slope.jpg", 0.55),
    "02-old-station.jpg": ("02-old-station.jpg", 0.52),
    "03-wind-plain.jpg": ("03-wind-plain.jpg", 0.50),
    "04-star-lake.jpg": ("04-star-lake.jpg", 0.50),
    "05-north-shore.jpg": ("05-north-shore.jpg", 0.50),
}

STRIP_W, STRIP_H = 1584, 330  # exactly 24:5, 1.65x the 960x200 CSS strip


def smoothstep(value, low, high):
    t = np.clip((value - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


def crop_to_alpha(image, pad=0.035):
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 16)
    if len(xs) == 0:
        return image
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    px = max(2, int((x1 - x0) * pad))
    py = max(2, int((y1 - y0) * pad))
    return image.crop(
        (
            max(0, x0 - px),
            max(0, y0 - py),
            min(image.width, x1 + px + 1),
            min(image.height, y1 + py + 1),
        )
    )


def cutout_traveler():
    image = Image.open(SOURCE / "walk.jpg").convert("RGB")
    rgb = np.asarray(image).astype(np.float32)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # Green screen: G is far above R/B on the background, never on the figure.
    chroma = green - np.maximum(red, blue)
    alpha = (1 - smoothstep(chroma, 18, 62)) * 255
    mask = Image.fromarray(alpha.astype(np.uint8), "L")
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.5))
    result = image.convert("RGBA")
    result.putalpha(mask)
    result = crop_to_alpha(result)
    result.save(ASSETS / "traveler" / "walk.png", optimize=True)
    return result.size


def cutout_camp():
    image = Image.open(SOURCE / "camp.jpg").convert("RGB")
    rgb = np.asarray(image).astype(np.float32)
    mx, mn = rgb.max(2), rgb.min(2)
    saturation = mx - mn
    luma = rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114
    # The tent/ropes are saturated blue; rocks are dark. The off-white paper
    # and its soft gray drop shadow are low-saturation and bright.
    alpha = np.maximum(smoothstep(saturation, 6, 24), smoothstep(205 - luma, 0, 42))
    rows = np.arange(alpha.shape[0])[:, None]
    alpha = np.where(luma > 225, 0, alpha)
    alpha = np.where((rows > 300) & (saturation < 26) & (luma > 145), 0, alpha)
    alpha = np.where((rows > 350) & (saturation < 42) & (luma > 110), 0, alpha)
    mask = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.5))
    result = image.convert("RGBA")
    result.putalpha(mask)
    result = crop_to_alpha(result)
    # The generated camp is a bright illustration; grade it toward the
    # photographic blue-hour plates so it sits in the scene instead of on it.
    rgb, alpha = result.convert("RGB"), result.getchannel("A")
    rgb = ImageEnhance.Brightness(rgb).enhance(0.84)
    rgb = ImageEnhance.Color(rgb).enhance(0.86)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.03)
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    result.save(ASSETS / "props" / "camp.png", optimize=True)
    return result.size


def main():
    for directory in (ASSETS / "backgrounds", ASSETS / "traveler", ASSETS / "props"):
        directory.mkdir(parents=True, exist_ok=True)

    for source_name, (output_name, focus) in PLATES.items():
        source_path = SOURCE / source_name
        if not source_path.exists():
            raise SystemExit(f"missing source plate: {source_path}")
        image = Image.open(source_path).convert("RGB")
        crop_h = int(round(image.width * STRIP_H / STRIP_W))
        crop_h = min(crop_h, image.height)
        top = int(round((image.height - crop_h) * focus))
        top = max(0, min(image.height - crop_h, top))
        plate = image.crop((0, top, image.width, top + crop_h))
        plate = plate.resize((STRIP_W, STRIP_H), Image.LANCZOS)
        plate.save(ASSETS / "backgrounds" / output_name, quality=92, subsampling=0)
        print(f"background {output_name}: {plate.size} (source top {top})")

    print("traveler", cutout_traveler())
    print("camp", cutout_camp())


if __name__ == "__main__":
    main()
