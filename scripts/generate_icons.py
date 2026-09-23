#!/usr/bin/env python3
"""Generate PWA icons: a white delivery truck on the brand purple (#6734ff).

Outputs (into public/):
  pwa-192.png, pwa-512.png   — any-purpose icons
  maskable-192.png, maskable-512.png — safe-zone padded for Android masks
  apple-touch-icon.png       — 180x180 for iOS home screen
"""
from PIL import Image, ImageDraw

BRAND = (103, 52, 255, 255)        # #6734ff
WHITE = (255, 255, 255, 255)

def rounded_rect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)

def draw_truck(d, s, color, scale=1.0):
    """Draw a simple delivery truck centered in an s x s canvas.

    scale < 1 shrinks the truck (used for the maskable safe zone).
    """
    cx, cy = s / 2, s / 2
    u = s * 0.056 * scale          # base unit: ~5.6% of canvas
    r = u * 0.55                   # corner radius

    # Cargo box (left/top in RTL feel, but geometry is plain LTR truck)
    box_w, box_h = 13 * u, 9 * u
    box_x = cx - 9.2 * u
    box_y = cy - box_h / 2 - 1.2 * u
    rounded_rect(d, (box_x, box_y, box_x + box_w, box_y + box_h), r, color)

    # Cab
    cab_w, cab_h = 5.4 * u, 6.4 * u
    cab_x = box_x + box_w + 1.1 * u
    cab_y = cy - cab_h / 2 + 0.9 * u
    rounded_rect(d, (cab_x, cab_y, cab_x + cab_w, cab_y + cab_h), r, color)

    # Wheels
    wheel_r = 1.9 * u
    wheel_y = cab_y + cab_h + 0.4 * u
    for wx in (box_x + 2.6 * u, cab_x + cab_w / 2):
        d.ellipse((wx - wheel_r, wheel_y - wheel_r, wx + wheel_r, wheel_y + wheel_r), fill=color)

def make_icon(size, out_path, purpose="any"):
    # Maskable icons need the artwork inside a ~80% safe zone
    scale = 0.78 if purpose == "maskable" else 1.0
    img = Image.new("RGBA", (size, size), BRAND)
    d = ImageDraw.Draw(img)
    draw_truck(d, size, WHITE, scale=scale)
    img.save(out_path, "PNG")
    print(f"wrote {out_path} ({size}x{size}, {purpose})")

if __name__ == "__main__":
    import os
    os.makedirs("public", exist_ok=True)
    for size in (192, 512):
        make_icon(size, f"public/pwa-{size}.png", "any")
        make_icon(size, f"public/maskable-{size}.png", "maskable")
    make_icon(180, "public/apple-touch-icon.png", "any")
