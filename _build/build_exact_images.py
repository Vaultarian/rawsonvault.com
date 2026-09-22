#!/usr/bin/env python3
"""Build 'Data Representation of Images' -- exact-size BMP files students download.

Page:   cs/gcse/1-2-memory-storage/data-representation-images/index.html
Files:  cs/gcse/1-2-memory-storage/data-representation-images/files/*.bmp
Link:   an EXACT-IMAGES block on the §1.2 page, inserted before PRACTICE.

Source: ~/vault/01-Teaching/Computer Science - GCSE/1.2 Memory and Storage/
        figures/Alfred exact images/  (made by make-exact-images.py beside it)

📌 THE WHOLE POINT IS THAT THE BYTES MATCH. Alex, 22 Sep: a student right-clicks,
   saves the image, and the file size on their machine is exactly what the page
   says. So this injector MEASURES every file -- width, height, colour depth and
   metadata length read out of the BMP's own header -- and refuses to build unless
   size == W x H x D / 8 + metadata holds to the byte. Nothing on the page is typed
   in by hand.

📌 BMP, NOT PNG. PNG compresses, so its size never follows the formula (the
   Piskel problem, 22 Sep). BMP stores every pixel raw. Browsers still display it,
   and "Save image as" writes the served bytes unchanged.

📌 WHITELIST: only the subjects in SUBJECTS ship, and each carries its own credit
   line (third-party rule, AGENTS.md). A subject with no stated source stays out.

Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import html, os, shutil, struct, sys

ROOT = os.environ.get("EXACT_IMAGES_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Computer Science - GCSE/1.2 Memory and Storage/"
                         "figures/Alfred exact images")
REL = "cs/gcse/1-2-memory-storage/data-representation-images"
HUB = "cs/gcse/1-2-memory-storage/index.html"
M_START, M_END = "<!-- EXACT-IMAGES:START -->", "<!-- EXACT-IMAGES:END -->"
DEPTHS = (1, 4, 8, 24)

# (file stem, heading, what it shows, credit)
SUBJECTS = [
    ("emoji-32x32", "A cool emoji, 32 × 32",
     "Flat blocks of colour, only six of them. Look along the row: from 4-bit up the picture "
     "does not change at all, but the file keeps growing. Extra colour depth is wasted on a "
     "picture that does not use it.",
     "Drawn in code for this page by Mr Rawson."),
    ("eye-64x64", "An eye, 64 × 64",
     "A photograph holds thousands of different colours. At 4-bit there are only 16 to go round, "
     "so the green iris turns grey. The 8-bit version uses the standard 256-colour table, which "
     "brings the green back but turns the skin blotchy. At 24-bit every pixel stores its own exact "
     "colour, so the skin is smooth again.",
     "Generated for this page on Mr Rawson's own computer with an open image model "
     "(Z-Image-Turbo, via mflux). It is not a photograph of a real person."),
    ("sunset-64x64", "A sunset, 64 × 64",
     "Long smooth blends of colour, from violet through orange to gold. At 4-bit and at 8-bit "
     "(the standard 256-colour table) the sky breaks into stripes. At 24-bit the blend is smooth, "
     "and the reflection of the sun appears in the water.",
     "Drawn in code for this page by Mr Rawson."),
]


def read_bmp(path):
    """Width, height, colour depth and metadata length, read from the file itself."""
    with open(path, "rb") as f:
        head = f.read(54)
    magic, fsize, _, _, offset = struct.unpack("<2sIHHI", head[:14])
    _, w, h, _, depth = struct.unpack("<IiiHH", head[14:30])
    assert magic == b"BM", path
    size = os.path.getsize(path)
    assert fsize == size, f"{path}: header says {fsize}, file is {size}"
    pixels = w * abs(h) * depth // 8
    assert size == pixels + offset, f"{path}: {size} != {pixels} + {offset}"
    return w, abs(h), depth, offset, size


def n(x):
    return f"{x:,}"


def card(stem, depth):
    fn = f"{stem}-{depth}bit.bmp"
    w, h, d, meta, size = read_bmp(os.path.join(SRC, fn))
    pix = w * h * d // 8
    colours = "16.7M" if d == 24 else n(2 ** d)
    table = "54 header only, no colour table" if d == 24 else \
        f"54 header + {n(4 * 2 ** d)} colour table"
    return fn, f"""
<div class="depth-card">
  <div class="depth-label">{d}-bit · {colours} colours</div>
  <img class="exact" src="files/{fn}" width="{w}" height="{h}" alt="{html.escape(stem)} at {d}-bit colour depth">
  <div class="depth-facts">{w} × {h} pixels · {d} bit{'s' if d > 1 else ''} per pixel<br>
  <strong>Metadata: {n(meta)} bytes</strong> <span class="muted">({table})</span></div>
  <details class="depth-check"><summary>Check your answer</summary>
  <p>{w} × {h} × {d} ÷ 8 = <strong>{n(pix)}</strong> bytes of pixels<br>
  + {n(meta)} bytes of metadata<br>= <strong>{n(size)} bytes</strong></p></details>
  <a class="depth-dl" href="files/{fn}" download>Download {fn}</a>
</div>"""


def page():
    sections, files = [], []
    for stem, title, blurb, credit in SUBJECTS:
        cards = []
        for d in DEPTHS:
            fn, c = card(stem, d)
            files.append(fn)
            cards.append(c)
        sections.append(f"""
        <h2>{html.escape(title)}</h2>
        <p class="lede">{html.escape(blurb)}</p>
        <div class="depth-grid">{''.join(cards)}
        </div>
        <p class="diagram-credit">{html.escape(credit)}</p>""")
    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Representation of Images — §1.2 — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../../vault.css">
    <style>
        .eq-box {{ font-family: var(--font-body); font-style: italic; font-size: 0.95rem; color: var(--ink-black); background: #fdf9f4; border-left: 3px solid var(--bronze-light); padding: var(--gap-sm) var(--gap-md); margin: var(--gap-xs) 0; }}
        .lede, .steps li, .meta-table td, .meta-table th {{ font-family: var(--font-body); font-size: 0.92rem; color: var(--gray-dark); line-height: 1.6; }}
        .steps {{ margin: var(--gap-sm) 0 var(--gap-md) 1.2em; }}
        .meta-table {{ border-collapse: collapse; margin: var(--gap-sm) 0 var(--gap-md); }}
        .meta-table th, .meta-table td {{ border: 1px solid #e4ddd0; padding: 0.35em 0.8em; text-align: right; }}
        .meta-table th:first-child, .meta-table td:first-child {{ text-align: left; }}
        .depth-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap-sm); margin: var(--gap-sm) 0; }}
        @media (max-width: 760px) {{ .depth-grid {{ grid-template-columns: repeat(2, 1fr); }} }}
        .depth-card {{ border: 1px solid #e4ddd0; background: #fffdf9; padding: var(--gap-sm); text-align: center; }}
        .depth-label {{ font-family: var(--font-ui, Inter, sans-serif); font-weight: 600; font-size: 0.85rem; color: var(--bronze-dark); margin-bottom: 0.4em; }}
        img.exact {{ width: 100%; max-width: 160px; height: auto; aspect-ratio: 1; image-rendering: pixelated; image-rendering: crisp-edges; border: 1px solid #ccc; }}
        .depth-facts {{ font-family: var(--font-body); font-size: 0.82rem; color: var(--gray-dark); margin: 0.4em 0; line-height: 1.5; }}
        .muted {{ color: #8a8378; }}
        .depth-check {{ font-family: var(--font-body); font-size: 0.82rem; text-align: left; margin: 0.4em 0; }}
        .depth-check summary {{ cursor: pointer; color: var(--bronze-dark); }}
        .depth-dl {{ font-family: var(--font-ui, Inter, sans-serif); font-size: 0.75rem; }}
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../../">The Vault</a><span>·</span>
            <a href="../../../">Computer Science</a><span>·</span>
            <a href="../../">GCSE CS</a><span>·</span>
            <a href="../">§1.2 Memory and Storage</a><span>·</span>
            Data Representation of Images
        </nav>
        <div class="section-header">
            <span class="eyebrow">OCR J277 · §1.2.4 · Images</span>
            <h1>Data Representation of Images</h1>
            <p class="subtitle">Real image files whose size you can calculate to the exact byte.</p>
        </div>
        <div class="rule--full"></div>

        <h2>The idea</h2>
        <p class="lede">Every image below is a real file, stored as a <strong>BMP</strong>. A BMP stores every
        pixel with no compression, so its size is the formula plus a small, fixed amount of
        <strong>metadata</strong>: the information that tells the computer how to read the pixels.</p>
        <div class="eq-box">file size (bytes) = width × height × colour depth ÷ 8 + metadata</div>

        <h2>How much metadata?</h2>
        <p class="lede">Every BMP starts with a <strong>54-byte header</strong> holding the width, height,
        colour depth and file size. Up to 8-bit, it also stores a <strong>colour table</strong>: the colour
        index, 4 bytes for every colour available. At 24-bit each pixel stores its own colour, so there is no table.</p>
        <p class="lede">A colour table can be <strong>picked for the picture</strong>, choosing the best colours
        for that image, or it can be a <strong>standard table</strong> shared by every picture. The emoji below
        uses a picked table. The eye and the sunset use the standard 8-bit table, which has 8 reds × 8 greens ×
        4 blues, as early computers and the early web did. Either way the table holds 256 colours, so the
        metadata is the same size.</p>
        <table class="meta-table">
            <tr><th>Colour depth</th><th>Header</th><th>Colour table</th><th>Metadata</th></tr>
            <tr><td>1-bit (2 colours)</td><td>54</td><td>2 × 4 = 8</td><td><strong>62 bytes</strong></td></tr>
            <tr><td>4-bit (16 colours)</td><td>54</td><td>16 × 4 = 64</td><td><strong>118 bytes</strong></td></tr>
            <tr><td>8-bit (256 colours)</td><td>54</td><td>256 × 4 = 1,024</td><td><strong>1,078 bytes</strong></td></tr>
            <tr><td>24-bit (16.7 million colours)</td><td>54</td><td>none</td><td><strong>54 bytes</strong></td></tr>
        </table>

        <h2>Check it yourself</h2>
        <ol class="steps">
            <li>Work out the file size in bytes with the formula, before you look.</li>
            <li>Right-click the image and choose <strong>Save image as…</strong> (or use the download link under it).</li>
            <li>Find the saved file. On Windows, right-click it and choose <strong>Properties</strong>: the <em>Size</em> line shows the exact number of bytes.</li>
            <li>Open <strong>Check your answer</strong> under the image and compare all three numbers.</li>
        </ol>
        <p class="lede">The pictures are shown enlarged so you can see every pixel. The file you save is the real, tiny one.</p>
{''.join(sections)}
        <div class="rule--full"></div>
        <p class="lede"><a href="../data-representation-sound/">Data Representation of Sound →</a></p>
        <p class="lede"><a href="../">← Back to §1.2 Memory and Storage</a></p>
    </div>
</body>
</html>
"""
    return body, files


def hub_block():
    return f"""{M_START}
<div class="rule--full"></div>
<h2>Data Representation of Images</h2>
<ul class="linking">
<li><a href="data-representation-images/">Data Representation of Images</a> — real image files at 1, 4, 8 and 24-bit colour depth. Calculate the size, download the file, and check it to the exact byte.</li>
</ul>
{M_END}"""


def main():
    out = os.path.join(ROOT, REL)
    os.makedirs(os.path.join(out, "files"), exist_ok=True)
    body, files = page()
    # files: copy the whitelist, and remove anything this injector did not put there
    for fn in files:
        shutil.copyfile(os.path.join(SRC, fn), os.path.join(out, "files", fn))
        print(f"PUBLISH: {REL}/files/{fn}")
    for fn in os.listdir(os.path.join(out, "files")):
        if fn not in files:
            os.remove(os.path.join(out, "files", fn))
            print(f"PUBLISH: {REL}/files/{fn}")
    with open(os.path.join(out, "index.html"), "w") as f:
        f.write(body)
    print(f"PUBLISH: {REL}/index.html")
    # link from the §1.2 page, between our own markers
    hub = os.path.join(ROOT, HUB)
    s = open(hub).read()
    block = hub_block()
    if M_START in s:
        a, b = s.index(M_START), s.index(M_END) + len(M_END)
        s = s[:a] + block + s[b:]
    else:
        anchor = "<!-- PRACTICE:START -->"
        assert anchor in s, "no PRACTICE marker on the §1.2 page"
        s = s.replace(anchor, block + "\n" + anchor, 1)
    open(hub, "w").write(s)
    print(f"PUBLISH: {HUB}")


if __name__ == "__main__":
    main()
