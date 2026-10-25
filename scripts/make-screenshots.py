from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

root = Path(r"D:\codex\keyboardgame")
final = root / "artifacts" / "final"
docs = root / "docs" / "screenshots"
docs.mkdir(parents=True, exist_ok=True)

overlay = Image.open(final / "overlay.png").convert("RGBA")
journal = Image.open(final / "journal.png").convert("RGB")
journal.save(docs / "journal.png", optimize=True)

W, H = 1440, 900
desktop = Image.new("RGBA", (W, H), (7, 11, 15, 255))
draw = ImageDraw.Draw(desktop)

# Dark desk gradient and quiet glows.
for y in range(H):
    t = y / H
    r = int(8 + 4 * t)
    g = int(13 + 9 * t)
    b = int(18 + 8 * t)
    draw.line((0, y, W, y), fill=(r, g, b, 255))

glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse((880, 200, 1500, 900), fill=(80, 142, 115, 42))
gdraw.ellipse((-160, 580, 700, 1100), fill=(141, 102, 70, 24))
glow = glow.filter(ImageFilter.GaussianBlur(90))
desktop.alpha_composite(glow)

# A blurred "normal work" window, intentionally out of focus.
work = Image.new("RGBA", (1020, 720), (0, 0, 0, 0))
wdraw = ImageDraw.Draw(work)
wdraw.rounded_rectangle((0, 0, 1019, 719), radius=18, fill=(15, 22, 29, 235), outline=(52, 67, 74, 120), width=1)
wdraw.rounded_rectangle((0, 0, 1019, 43), radius=18, fill=(20, 28, 35, 245))
wdraw.rectangle((0, 28, 1019, 43), fill=(20, 28, 35, 245))
for x, color in [(22, (124, 93, 84)), (40, (124, 116, 84)), (58, (79, 112, 96))]:
    wdraw.ellipse((x, 15, x + 11, 26), fill=color + (200,))

try:
    font = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 19)
    font_small = ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 12)
    mono = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 11)
except OSError:
    font = font_small = mono = ImageFont.load_default()

wdraw.text((82, 90), "第四季度规划", font=font, fill=(157, 172, 164, 215))
wdraw.text((82, 122), "最后编辑 3 分钟前 · 共享给 4 人", font=font_small, fill=(83, 99, 93, 210))
wdraw.line((82, 152, 937, 152), fill=(255, 255, 255, 20), width=1)
for index, width in enumerate([760, 690, 820, 610, 700, 760, 650]):
    y = 178 + index * 25
    low = (255, 255, 255, 32) if index not in (0, 4) else (126, 173, 151, 42)
    wdraw.rounded_rectangle((82, y, 82 + width, y + 8), radius=3, fill=low)
for col in range(4):
    for row in range(4):
        x0 = 82 + col * 210
        y0 = 360 + row * 30
        wdraw.rectangle((x0, y0, x0 + 200, y0 + 28), fill=(255, 255, 255, 12), outline=(255, 255, 255, 14), width=1)
for index, width in enumerate([600, 720, 510]):
    y = 540 + index * 24
    wdraw.rounded_rectangle((82, y, 82 + width, y + 7), radius=3, fill=(255, 255, 255, 22))
wdraw.text((82, 645), "“先写下不需要解释的部分，剩下的明天再改。”", font=font_small, fill=(104, 121, 112, 190))
wdraw.text((820, 680), "AUTOSAVED", font=mono, fill=(67, 85, 78, 180))

work = work.filter(ImageFilter.GaussianBlur(1.25))
desktop.alpha_composite(work, (52, 112))

# Place the actual live overlay capture in the corner.
desktop.alpha_composite(overlay, (986, 304))

# Very soft vignette.
vignette = Image.new("L", (W, H), 0)
vdraw = ImageDraw.Draw(vignette)
vdraw.ellipse((-220, -200, W + 220, H + 220), fill=175)
vignette = vignette.filter(ImageFilter.GaussianBlur(170))
dark = Image.new("RGBA", (W, H), (2, 5, 7, 90))
desktop = Image.composite(desktop, Image.alpha_composite(desktop, dark), vignette)

desktop.convert("RGB").save(docs / "desktop.png", quality=92, optimize=True)
print("wrote", docs / "desktop.png", (docs / "desktop.png").stat().st_size)
print("wrote", docs / "journal.png", (docs / "journal.png").stat().st_size)
