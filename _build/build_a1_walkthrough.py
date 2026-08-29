#!/usr/bin/env python3
"""
Build the A.1 Kinematics visual walkthrough page.

Reads _build/a1_walkthrough.json, copies + optimises the source figures into
physics/dp/theme-a/a1-kinematics/walkthrough/img/ under descriptive names, and
renders the page body between the WALKTHROUGH-BODY markers in
physics/dp/theme-a/a1-kinematics/walkthrough/index.html.

Idempotent: re-run after editing the JSON. Do not hand-edit between the markers.

Source figures: Knight, Physics for Scientists and Engineers, ch. 1-2 figure
library. Published to rawsonvault.com by explicit owner decision (see AGENTS.md).

Usage:  python3 _build/build_a1_walkthrough.py [--check]
        --check  validate coverage and exit without writing anything
"""

import html
import json
import os
import re
import shutil
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOT = "/Users/alex/Documents/A.1 Kinematics/images"
SRC_DIRS = [
    os.path.join(SRC_ROOT, "01_Figures_and_Photos"),
    os.path.join(SRC_ROOT, "02_Figures_and_Photos"),
]
DATA = os.path.join(REPO, "_build", "a1_walkthrough.json")
PAGE_DIR = os.path.join(REPO, "physics", "dp", "theme-a", "a1-kinematics", "walkthrough")
IMG_DIR = os.path.join(PAGE_DIR, "img")
PAGE = os.path.join(PAGE_DIR, "index.html")

MAX_WIDTH = 1100
WEBP_QUALITY = 80

# These figures are line art with text labels. WebP holds the lettering far more
# cleanly than JPEG at a third of the weight; cwebp comes from `brew install webp`.
CWEBP = shutil.which("cwebp") or "/opt/homebrew/bin/cwebp"

START = "<!-- WALKTHROUGH-BODY:START -->"
END = "<!-- WALKTHROUGH-BODY:END -->"


def find_source(name):
    for d in SRC_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    return None


def load():
    with open(DATA) as f:
        return json.load(f)


def all_figures(data):
    for section in data["sections"]:
        for fig in section["figures"]:
            yield section, fig


def check(data):
    """Validate that every figure resolves, every slug is unique, and report
    any source figure in the curated set that no section uses."""
    problems = []
    slugs = {}
    used = set()

    for section, fig in all_figures(data):
        src = find_source(fig["src"])
        if src is None:
            problems.append("missing source: %s (%s)" % (fig["src"], section["id"]))
            continue
        if not is_jpeg(src):
            problems.append("not a JPEG: %s" % fig["src"])
        used.add(fig["src"])
        slug = fig["slug"]
        if slug in slugs:
            problems.append("duplicate slug: %s (%s and %s)" % (slug, slugs[slug], section["id"]))
        slugs[slug] = section["id"]
        for field in ("alt", "title", "note"):
            if not fig.get(field, "").strip():
                problems.append("empty %s: %s" % (field, fig["src"]))

    n = sum(1 for _ in all_figures(data))
    return problems, used, n


def is_jpeg(path):
    with open(path, "rb") as f:
        return f.read(3) == b"\xff\xd8\xff"


def curated_set():
    """The teaching-figure set: everything except the Stop-to-Think, conceptual
    question and end-of-chapter problem figures, and except A/B/C variants whose
    combined figure is also present. 02_05_Figure.jpg is a mislabelled Word file
    in the source library; its '(1)' duplicate is the real JPEG."""
    names = []
    for d in SRC_DIRS:
        names.extend(os.listdir(d))
    names = sorted(n for n in names if n.endswith(".jpg"))
    have = set(names)
    out = []
    for n in names:
        if re.match(r"^(02_STT_|Q02_|P02_)", n):
            continue
        if n == "02_05_Figure.jpg":       # corrupt: Word document, not a JPEG
            continue
        base = re.sub(r"Figure[A-C]\.jpg$", "Figure.jpg", n)
        if n != base and base in have and base != "02_05_Figure.jpg":
            continue
        out.append(n)
    return out


def build_images(data):
    if not os.path.exists(CWEBP):
        sys.exit("cwebp not found — install it with `brew install webp`")
    os.makedirs(IMG_DIR, exist_ok=True)
    tmp = os.path.join(IMG_DIR, ".resize.jpg")
    written = []
    for _, fig in all_figures(data):
        src = find_source(fig["src"])
        dest = os.path.join(IMG_DIR, fig["slug"] + ".webp")
        shutil.copyfile(src, tmp)
        subprocess.run(["sips", "-Z", str(MAX_WIDTH), tmp],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run([CWEBP, "-q", str(WEBP_QUALITY), "-quiet", tmp, "-o", dest],
                       check=True)
        written.append(dest)
    os.remove(tmp)

    # Remove any image no longer referenced by the data file.
    keep = {os.path.basename(p) for p in written}
    for existing in os.listdir(IMG_DIR):
        if existing not in keep:
            os.remove(os.path.join(IMG_DIR, existing))

    total = sum(os.path.getsize(p) for p in written)
    return len(written), total


def webp_size(path):
    """Read width and height out of a WebP header, so the rendered <img> can carry
    explicit dimensions. Without them, lazy-loaded images collapse to zero height
    and the page shifts under the reader as they load."""
    with open(path, "rb") as f:
        head = f.read(30)
    if head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        raise ValueError("not a WebP: %s" % path)
    fourcc = head[12:16]
    if fourcc == b"VP8 ":
        w = int.from_bytes(head[26:28], "little") & 0x3FFF
        h = int.from_bytes(head[28:30], "little") & 0x3FFF
        return w, h
    if fourcc == b"VP8L":
        bits = int.from_bytes(head[21:25], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if fourcc == b"VP8X":
        w = int.from_bytes(head[24:27], "little") + 1
        h = int.from_bytes(head[27:30], "little") + 1
        return w, h
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
        if s.get("intro"):
            out.append('<p class="walk-intro">%s</p>' % s["intro"])
        for fig in s["figures"]:
            out.append('<figure class="walk-figure">')
            w, h = webp_size(os.path.join(IMG_DIR, fig["slug"] + ".webp"))
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
    problems, used, n = check(data)

    curated = curated_set()
    unused = [c for c in curated if c not in used]

    print("figures in data file: %d" % n)
    print("curated source set:   %d" % len(curated))
    if unused:
        print("NOT USED (%d): %s" % (len(unused), ", ".join(unused)))
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
    print("injected into %s" % os.path.relpath(PAGE, REPO))


if __name__ == "__main__":
    main()
