"""Turn the site's self-hosted IBM Plex woff2 files into the TTFs Pillow needs.

Pillow cannot read woff2, so generate.py rasterises text from these TTFs. They
land in assets/.fonts/ (not committed; the generated PNGs are what ships).
No network: the source files are already in assets/fonts/.
"""
import os
from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "fonts"), os.path.join(HERE, ".fonts")

FACES = {
    "sans400": "IBMPlexSans-Regular",
    "sans600": "IBMPlexSans-SemiBold",
    "cond600": "IBMPlexSansCondensed-SemiBold",
    "mono400": "IBMPlexMono-Regular",
    "mono500": "IBMPlexMono-Medium",
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for key, name in FACES.items():
        f = TTFont(os.path.join(SRC, name + ".woff2"))
        f.flavor = None
        f.save(os.path.join(OUT, key + ".ttf"))
        print("wrote", key + ".ttf")
