# The prompts behind the cartoon art, so any picture can be made again. Each line runs tools/swarm.py.
#   python3 tools/art-prompts.py turkey          the turkey's character sheet: four faces
#   python3 tools/art-prompts.py pins             the bowling pin
#   python3 tools/art-prompts.py yard            the driveway background (768 x 1344)
#   add --n 4 for more tries of each (default 3)
# Tries land in art/source/gen/; tools/cutout.py turns the picks into img/ sprites.
import subprocess
import sys

N = sys.argv[sys.argv.index("--n") + 1] if "--n" in sys.argv else "3"

TURKEY = ("character sheet of the same cartoon Thanksgiving turkey rolled up into a perfectly round "
          "ball, shaped exactly like a bowling ball, a plump brown sphere with no legs, no feet and no neck, "
          "the face right on the front of the ball, big googly eyes, short yellow beak, little red wattle, "
          "tiny wings flat against the sides, a small fan of red orange and golden tail feathers poking up "
          "behind the ball. Four balls side by side in a row, evenly spaced, not overlapping, the same size: "
          "1 happy goofy grin, 2 terrified with huge wide eyes and beak wide open screaming, 3 dizzy with "
          "swirly spiral eyes and tongue hanging out, 4 embarrassed with eyes squeezed shut and red blushing cheeks")

# The pin: a classic bowling pin in Thanksgiving colours. Easy to restyle later.
PINS = {
    "pin": "a single cartoon bowling pin standing upright, classic shape, glossy white with two bands "
           "around the neck, one orange and one dark brown, front view, simple and clean, no shadow",
}

BG = (", 2D cartoon game background art, bold clean black outlines, flat bright colors, simple cel "
      "shading, Saturday-morning cartoon style, no characters, no people, no animals, no text")

YARD = ("vertical mobile game background, looking straight up a long empty concrete driveway from the "
        "street on an autumn evening, centered, symmetrical. Top third: an orange sunset sky and a cozy "
        "suburban house with a closed white garage door at the far end of the driveway, autumn trees with "
        "orange and red leaves. The driveway runs straight from the bottom of the picture up to the garage, "
        "wide at the bottom and narrow at the top, in strong perspective. Green lawns with scattered fallen "
        "leaves on both sides, low trimmed hedges along both edges of the driveway, a few pumpkins and leaf "
        "piles on the lawn. The driveway itself is plain and empty")


def swarm(name, prompt, w, h, raw=False):
    cmd = ["python3", "tools/swarm.py", name, prompt, "--n", N, "--w", str(w), "--h", str(h)]
    subprocess.run(cmd + (["--raw"] if raw else []), check=True)


def main():
    what = sys.argv[1]
    pick = [a for a in sys.argv[2:] if not a.startswith("--") and a != N]
    if what == "turkey":
        swarm("turkey-ball", TURKEY, 2048, 768)
    elif what == "pins":
        for kind, prompt in PINS.items():
            if not pick or kind in pick:
                swarm(kind, prompt, 768, 1344)
    elif what == "yard":
        swarm("bg-yard", YARD + BG, 768, 1344, raw=True)


main()
