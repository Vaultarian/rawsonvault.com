#!/usr/bin/env python3
"""
Build the P1 Energy visual walkthrough page.

Reads _build/p1_walkthrough.json, copies + optimises the source figures into
physics/aqa-gcse/p1-energy/walkthrough/img/ under descriptive names, and renders
the page body between the WALKTHROUGH-BODY markers in
physics/aqa-gcse/p1-energy/walkthrough/index.html.

Idempotent: re-run after editing the JSON. Do not hand-edit between the markers.

Sibling of build_a1_walkthrough.py, which does the same job for DP A.1 Kinematics.
The difference that matters is the source: these figures are OpenStax, CC BY 4.0,
so they need only the credit line the licence requires and no owner override.

Source figures: College Physics for AP Courses, ch. 7 (OpenStax, Rice University),
extracted from APPhysics-Chapter07.pptx and staged to ~/Documents/P1 Energy/images.

Usage:  python3 _build/build_p1_walkthrough.py [--check]
        --check  validate that every figure resolves, then exit without writing
"""

import html
import json
import os
import re
import shutil
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.expanduser("~/Documents/P1 Energy/images")
DATA = os.path.join(REPO, "_build", "p1_walkthrough.json")
PAGE_DIR = os.path.join(REPO, "physics", "aqa-gcse", "p1-energy", "walkthrough")
IMG_DIR = os.path.join(PAGE_DIR, "img")
PAGE = os.path.join(PAGE_DIR, "index.html")

MAX_WIDTH = 1100
WEBP_QUALITY = 82
CWEBP = shutil.which("cwebp") or "/opt/homebrew/bin/cwebp"

START = "<!-- WALKTHROUGH-BODY:START -->"
END = "<!-- WALKTHROUGH-BODY:END -->"


def load():
    with open(DATA) as f:
        return json.load(f)


def all_figures(data):
    for section in data["sections"]:
        for fig in section["figures"]:
            yield section, fig


def check(data):
    """Every figure must resolve to a real file, every slug must be unique, and
    no caption field may be blank. A silently skipped figure would leave a page
    that looks finished and is not."""
    problems = []
    slugs = {}
    for section, fig in all_figures(data):
        src = os.path.join(SRC_DIR, fig["src"])
        if not os.path.exists(src):
            problems.append("missing source: %s (%s)" % (fig["src"], section["id"]))
        slug = fig["slug"]
        if slug in slugs:
            problems.append("duplicate slug: %s (%s and %s)"
                            % (slug, slugs[slug], section["id"]))
        slugs[slug] = section["id"]
        for field in ("alt", "title", "note"):
            if not fig.get(field, "").strip():
                problems.append("empty %s: %s" % (field, fig["src"]))
    return problems, sum(1 for _ in all_figures(data))


def build_images(data):
    if not os.path.exists(CWEBP):
        sys.exit("cwebp not found — install it with `brew install webp`")
    os.makedirs(IMG_DIR, exist_ok=True)
    tmp = os.path.join(IMG_DIR, ".resize.jpg")
    written = []
    for _, fig in all_figures(data):
        src = os.path.join(SRC_DIR, fig["src"])
        dest = os.path.join(IMG_DIR, fig["slug"] + ".webp")
        shutil.copyfile(src, tmp)
        subprocess.run(["sips", "-Z", str(MAX_WIDTH), tmp],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run([CWEBP, "-q", str(WEBP_QUALITY), "-quiet", tmp, "-o", dest],
                       check=True)
        written.append(dest)
    os.remove(tmp)

    keep = {os.path.basename(p) for p in written}
    for existing in os.listdir(IMG_DIR):
        if existing not in keep:
            os.remove(os.path.join(IMG_DIR, existing))

    return len(written), sum(os.path.getsize(p) for p in written)


def webp_size(path):
    """Width and height from the WebP header, so each <img> carries explicit
    dimensions. Without them, lazy-loaded images collapse to zero height and the
    page shifts under the reader as they load."""
    with open(path, "rb") as f:
        head = f.read(30)
    if head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        raise ValueError("not a WebP: %s" % path)
    fourcc = head[12:16]
    if fourcc == b"VP8 ":
        return (int.from_bytes(head[26:28], "little") & 0x3FFF,
                int.from_bytes(head[28:30], "little") & 0x3FFF)
    if fourcc == b"VP8L":
        bits = int.from_bytes(head[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if fourcc == b"VP8X":
        return (int.from_bytes(head[24:27], "little") + 1,
                int.from_bytes(head[27:30], "little") + 1)
    raise ValueError("unknown WebP variant %r in %s" % (fourcc, path))


def render(data):
    meta = data["meta"]
    out = [START]

    out.append('<nav class="walk-nav" aria-label="Sections">')
    out.append('<span class="walk-nav-label">Jump to</span>')
    out.append('<ol>')
    for s in data["sections"]:
        out.append('<li><a href="#%s">%s</a></li>' % (s["id"], s["title"]))
    out.append('</ol>')
    out.append('</nav>')

    out.append('<p class="diagram-credit">%s</p>' % meta["credit"])

    for s in data["sections"]:
        out.append('<section class="walk-section" id="%s">' % s["id"])
        out.append('<div class="rule--full"></div>')
        out.append('<h2>%s</h2>' % s["title"])
        if s.get("spec"):
            out.append('<p class="walk-spec">Specification %s</p>' % s["spec"])
        if s.get("intro"):
            out.append('<p class="walk-intro">%s</p>' % s["intro"])
        for fig in s["figures"]:
            w, h = webp_size(os.path.join(IMG_DIR, fig["slug"] + ".webp"))
            out.append('<figure class="walk-figure">')
            out.append('<img src="img/%s.webp" alt="%s" width="%d" height="%d" '
                       'loading="lazy" decoding="async">'
                       % (fig["slug"], html.escape(fig["alt"], quote=True), w, h))
            out.append('<figcaption>')
            out.append('<strong class="walk-title">%s</strong>' % fig["title"])
            out.append('<span class="walk-note">%s</span>' % fig["note"])
            out.append('</figcaption>')
            out.append('</figure>')
        out.append('<p class="walk-top"><a href="#top">Back to top</a></p>')
        out.append('</section>')

    out.append('<div class="rule--full"></div>')
    out.append('<p class="diagram-credit">%s</p>' % meta["credit"])
    out.append(END)
    return "\n".join(out)


def inject(body):
    with open(PAGE) as f:
        page = f.read()
    if START not in page or END not in page:
        sys.exit("markers not found in %s" % PAGE)
    pattern = re.compile(re.escape(START) + ".*?" + re.escape(END), re.S)
    page = pattern.sub(lambda _: body, page)
    with open(PAGE, "w") as f:
        f.write(page)


def main():
    data = load()
    problems, n = check(data)
    print("figures in data file: %d" % n)
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    if "--check" in sys.argv:
        print("check passed")
        return

    count, total = build_images(data)
    print("images written: %d  (%.1f MB)" % (count, total / 1e6))
    inject(render(data))
    # Declare outputs so Tim commits ONLY these.
    print("PUBLISH: %s" % os.path.relpath(PAGE, REPO))
    for _, fig in all_figures(data):
        print("PUBLISH: %s" % os.path.join("physics/aqa-gcse/p1-energy/walkthrough/img",
                                           fig["slug"] + ".webp"))


if __name__ == "__main__":
    main()
