# Makes the app icons: the grinning cartoon turkey on a warm orange square.
# Run from the project folder:  python3 tools/make-icons.py <big cut-out turkey .png>
# (the turkey from tools/art-prompts.py, cut out with tools/cutout.py at --height 600)
import sys

from PIL import Image

turkey = Image.open(sys.argv[1]).convert("RGBA")


def icon(size, margin):
    img = Image.new("RGBA", (size, size), (232, 115, 30, 255))
    w = size - 2 * margin
    h = w
    c = turkey.resize((round(turkey.width * h / turkey.height), h), Image.LANCZOS)
    img.alpha_composite(c, ((size - c.width) // 2, margin))
    return img


icon(512, 40).save("icons/icon-512.png")
icon(192, 15).save("icons/icon-192.png")
icon(512, 110).save("icons/icon-maskable-512.png")
print("icons written")
