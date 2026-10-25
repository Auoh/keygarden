from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

base = Path(r"D:\codex\keyboardgame\resources")
base.mkdir(parents=True, exist_ok=True)

size = 512
image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# Rounded dark tile
draw.rounded_rectangle((18, 18, size - 18, size - 18), radius=112, fill=(9, 19, 17, 255))
draw.rounded_rectangle((18, 18, size - 18, size - 18), radius=112, outline=(139, 190, 157, 70), width=5)
# A soft green glow behind the leaf
glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse((120, 190, 420, 440), fill=(94, 158, 120, 80))
glow = glow.filter(ImageFilter.GaussianBlur(55))
image.alpha_composite(glow)

# Stem
draw.line((248, 390, 250, 150), fill=(216, 235, 205, 180), width=10)
# Two leaves
draw.polygon([(250, 236), (130, 174), (184, 285), (250, 300)], fill=(111, 163, 122, 235))
draw.polygon([(250, 220), (366, 146), (316, 264), (250, 292)], fill=(154, 200, 162, 235))
draw.polygon([(250, 330), (162, 290), (205, 370), (250, 386)], fill=(79, 132, 96, 210))
# Veins
draw.line((250, 280, 153, 204), fill=(215, 236, 206, 110), width=4)
draw.line((250, 272, 347, 168), fill=(215, 236, 206, 110), width=4)
# Amber seed / light
draw.ellipse((306, 302, 352, 348), fill=(231, 189, 126, 235))
draw.ellipse((317, 313, 338, 334), fill=(249, 226, 177, 245))

image.save(base / "icon.png")
image.resize((256, 256), Image.LANCZOS).save(
    base / "icon.ico",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("wrote", base / "icon.png", (base / "icon.png").stat().st_size)
print("wrote", base / "icon.ico", (base / "icon.ico").stat().st_size)
