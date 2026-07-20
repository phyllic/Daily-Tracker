from PIL import Image, ImageDraw, ImageFilter
import math

SIZE = 512
PAD = 64  # padding for maskable safe zone
CENTER = SIZE // 2

# Create canvas
img = Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0))

# Build a bright diagonal gradient background
bg = Image.new('RGBA', (SIZE, SIZE))
for y in range(SIZE):
    for x in range(SIZE):
        t = (x + y) / (2 * SIZE)
        # Lime -> Cyan -> Blue
        r = int(132 * (1 - t) + 59 * t)
        g = int(204 * (1 - t) + 130 * t + 190 * (t * (1 - t)))
        b = int(22 * (1 - t) + 246 * t)
        bg.putpixel((x, y), (r, g, b, 255))

# Mask with rounded corners
mask = Image.new('L', (SIZE, SIZE), 0)
mdraw = ImageDraw.Draw(mask)
radius = SIZE // 6
mdraw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=radius, fill=255)
bg = Image.composite(bg, Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 0)), mask)

# Add subtle radial glow
for i in range(40, 0, -1):
    alpha = int(10 * (1 - i / 40))
    r = CENTER - i * 6
    draw = ImageDraw.Draw(bg)
    draw.ellipse([CENTER - r, CENTER - r, CENTER + r, CENTER + r], fill=(255, 255, 255, alpha))

img = Image.alpha_composite(img, bg)

# Draw a white dumbbell / fitness symbol with soft shadow
# Coordinates for a tilted dumbbell inside safe zone
def draw_rounded_rect(draw, bbox, radius, fill):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill)

draw = ImageDraw.Draw(img)

# Dumbbell parameters
bar_len = 200
bar_thick = 28
weight_w = 64
weight_h = 96
weight_r = 18

# Dumbbell is tilted 45 degrees. We'll draw it manually with polygons for the bar and rounded weights.
# For simplicity, draw using a temporary high-res mask then rotate.
sym_size = 320
sym = Image.new('RGBA', (sym_size, sym_size), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(sym)

# Shadow
shadow_offset = 6
sdraw.rounded_rectangle(
    [sym_size // 2 - bar_len // 2 + shadow_offset, sym_size // 2 - bar_thick // 2 + shadow_offset,
     sym_size // 2 + bar_len // 2 + shadow_offset, sym_size // 2 + bar_thick // 2 + shadow_offset],
    radius=bar_thick // 2, fill=(0, 0, 0, 60)
)
sdraw.rounded_rectangle(
    [sym_size // 2 - bar_len // 2 - weight_w // 2 + shadow_offset, sym_size // 2 - weight_h // 2 + shadow_offset,
     sym_size // 2 - bar_len // 2 + weight_w // 2 + shadow_offset, sym_size // 2 + weight_h // 2 + shadow_offset],
    radius=weight_r, fill=(0, 0, 0, 60)
)
sdraw.rounded_rectangle(
    [sym_size // 2 + bar_len // 2 - weight_w // 2 + shadow_offset, sym_size // 2 - weight_h // 2 + shadow_offset,
     sym_size // 2 + bar_len // 2 + weight_w // 2 + shadow_offset, sym_size // 2 + weight_h // 2 + shadow_offset],
    radius=weight_r, fill=(0, 0, 0, 60)
)

# Main bar
sdraw.rounded_rectangle(
    [sym_size // 2 - bar_len // 2, sym_size // 2 - bar_thick // 2,
     sym_size // 2 + bar_len // 2, sym_size // 2 + bar_thick // 2],
    radius=bar_thick // 2, fill=(255, 255, 255, 255)
)
# Left weight
sdraw.rounded_rectangle(
    [sym_size // 2 - bar_len // 2 - weight_w // 2, sym_size // 2 - weight_h // 2,
     sym_size // 2 - bar_len // 2 + weight_w // 2, sym_size // 2 + weight_h // 2],
    radius=weight_r, fill=(255, 255, 255, 255)
)
# Right weight
sdraw.rounded_rectangle(
    [sym_size // 2 + bar_len // 2 - weight_w // 2, sym_size // 2 - weight_h // 2,
     sym_size // 2 + bar_len // 2 + weight_w // 2, sym_size // 2 + weight_h // 2],
    radius=weight_r, fill=(255, 255, 255, 255)
)

# Add a small accent circle in the center
accent_color = (253, 224, 71, 255)  # bright yellow
sdraw.ellipse([sym_size // 2 - 14, sym_size // 2 - 14, sym_size // 2 + 14, sym_size // 2 + 14], fill=accent_color)

# Rotate 45 degrees
sym = sym.rotate(-45, expand=False, resample=Image.BICUBIC)

# Paste centered
sx = (SIZE - sym_size) // 2
sy = (SIZE - sym_size) // 2
img.paste(sym, (sx, sy), sym)

# Save outputs
img.save('public/icon-512.png')

# Also create 192x192 and favicon.ico (16,32,48)
img_192 = img.resize((192, 192), Image.LANCZOS)
img_192.save('public/icon-192.png')

# Convert to RGB for favicon
img_rgb = img.convert('RGBA')
# Make white background for favicon
fav_bg = Image.new('RGBA', (512, 512), (255, 255, 255, 0))
fav = Image.alpha_composite(fav_bg, img_rgb)
fav_rgb = fav.convert('RGB')
sizes = [(16, 16), (32, 32), (48, 48)]
favicons = [fav_rgb.resize(s, Image.LANCZOS) for s in sizes]
favicons[0].save('public/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], format='ICO')

print('Generated public/icon-512.png, public/icon-192.png, public/favicon.ico')
