"""Generate the site's favicon set and Open Graph card from the Fiber tokens (dark theme).

The palette lives in one place (below, the sRGB values of assets/fiber.css)
rather than being baked into hand-drawn files, so a colour change is a
one-line edit plus a re-run. Regenerate only when the accent changes; the
output is committed.

    pip install Pillow fonttools brotli
    python3 assets/fetch_fonts.py     # assets/fonts/*.woff2 -> TTFs in assets/.fonts
    python3 assets/generate.py        # from the repo root

assets/favicon.svg is maintained by hand and is the authoritative mark; the
icon() geometry here mirrors it.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, ".fonts")
OUT = HERE

BASE        = (10, 18, 42)     # bg    #0a122a
SURFACE_0   = (19, 28, 56)     # panel #131c38
BORDER      = (41, 53, 79)     # line  #29354f
BORDER_STR  = (101, 115, 142)  # faint #65738e
FG_1        = (231, 237, 246)  # fg    #e7edf6
FG_2        = (161, 175, 197)  # muted #a1afc5
ACCENT      = (90, 143, 243)   # accent #5a8ff3
TEAL        = (24, 172, 119)   # ell   #18ac77

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name + ".ttf"), size)

def blend(fg, bg, a):
    return tuple(round(f * a + b * (1 - a)) for f, b in zip(fg, bg))


# ── favicon: the masthead glyph, a precision-blue square in the void ──────
def icon(px, pad_ratio=0.0, bg=BASE):
    """Render the mark at px, supersampled 8x. pad_ratio insets the mark
    (apple-touch-icon needs breathing room inside its rounded mask)."""
    S = px * 8
    img = Image.new("RGB", (S, S), bg)
    d = ImageDraw.Draw(img)

    pad = S * pad_ratio
    inner = S - 2 * pad

    # the mark itself
    sq = inner * 0.36
    s0 = (S - sq) / 2
    d.rounded_rectangle([s0, s0, s0 + sq, s0 + sq],
                        radius=sq * 0.16, fill=ACCENT)
    return img.resize((px, px), Image.LANCZOS)


# ── Open Graph card ──────────────────────────────────────────────────────
def og():
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), BASE)
    d = ImageDraw.Draw(img)

    img = Image.new("RGB", (W, H), BASE)
    # moire: two ring families, centres 54px apart, below the card. The same
    # texture as .metric / .ledger on the site, drawn once into a mask.
    ring = Image.new("L", (W, H), 0)
    rd = ImageDraw.Draw(ring)
    for cx in (W * 0.80, W * 0.80 + 54):
        r = 36
        while r < 1400:
            rd.ellipse([cx - r, H * 1.35 - r, cx + r, H * 1.35 + r], outline=255, width=2)
            r += 9
    tint = Image.new("RGB", (W, H), blend(ACCENT, BASE, 0.10))
    img = Image.composite(tint, img, ring)
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W - 1, H - 1], outline=BORDER)

    PAD = 72

    # masthead
    d.rounded_rectangle([PAD, 60, PAD + 13, 73], radius=3, fill=ACCENT)
    d.text((PAD + 26, 54), "Enacted Volition Research", font=font("sans600", 21), fill=FG_1)
    dom = font("mono400", 17)
    url = "enactedvolition.github.io"
    d.text((W - PAD - d.textlength(url, font=dom), 56), url, font=dom, fill=FG_2)

    # eyebrow
    eb = font("mono500", 15)
    label = "LATENT DYNAMICS — ARTIFICIAL AND BIOLOGICAL"
    d.text((PAD, 146), label, font=eb, fill=ACCENT)
    x = PAD + d.textlength(label, font=eb) + 18
    for i in range(0, 240, 4):
        a = 1 - i / 240
        d.line([x + i, 154, x + i + 4, 154],
               fill=blend(BORDER_STR, BASE, a * 0.9))

    # headline — accent carries the clause the site is named for
    h = font("cond600", 76)
    lines = [[("Instruments for systems", FG_1)],
             [("that ", FG_1), ("will not hold still", ACCENT), (".", FG_1)]]
    y = 200
    for line in lines:
        x = PAD
        for text, colour in line:
            d.text((x, y), text, font=h, fill=colour)
            x += d.textlength(text, font=h)
        y += 76

    # lede
    sub = font("sans400", 23)
    for i, line in enumerate([
            "Measurement tools for high-dimensional processes that are",
            "usually described rather than observed."]):
        d.text((PAD, 382 + i * 34), line, font=sub, fill=FG_2)

    # footer strip — three threads and the domain
    d.line([PAD, 500, W - PAD, 500], fill=BORDER)
    m = font("mono400", 16)
    x = PAD
    for colour, text in ((ACCENT, "Mechanistic interpretability"),
                         (TEAL, "Computational neuropharmacology"),
                         (FG_2, "Agent-native protocols")):
        d.ellipse([x, 538, x + 8, 546], fill=colour)
        d.text((x + 18, 531), text, font=m, fill=FG_2)
        x += 18 + d.textlength(text, font=m) + 40
    return img


if __name__ == "__main__":
    icon(180, pad_ratio=0.10, bg=SURFACE_0).save(f"{OUT}/apple-touch-icon.png")
    icon(512).save(f"{OUT}/icon-512.png")
    icon(192).save(f"{OUT}/icon-192.png")
    icon(64).save(f"{OUT}/favicon.ico",
                  sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    og().save(f"{OUT}/og-image.png", optimize=True)
    print("assets written")
