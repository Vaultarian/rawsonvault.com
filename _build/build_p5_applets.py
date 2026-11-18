#!/usr/bin/env python3
"""Publish the P5 Forces applets (AQA GCSE Physics). Twin of build_p3_applets.py.

Pages:  physics/aqa-gcse/p5-forces/<folder>/index.html, one per entry in PAGES:
          terminal-velocity, apparent-weight      (2026-11-18)
Link:   a P5-APPLETS block ("Interactive") on the P5 hub page, just before the Labs block.

Source: ~/vault/01-Teaching/Physics - GCSE/Content/P5 - Forces/Animations/
        Built and tested there; this injector only copies. Each file is one
        self-contained HTML page: canvas + inline script, Google Fonts only, no
        cookies, no student data.

📌 WHITELIST: only the files in PAGES ship (source p5-<folder>.html -> published folder).

📌 OWN WORK.
   terminal-velocity: written from scratch, own scenario and numbers (80 kg skydiver,
     terminal velocities 50 m/s and 5 m/s). ⛔ Nothing from f2-l08 (AQA past paper,
     print only) and nothing from the Forces 2 unit test pool.
   apparent-weight: Alex's own sheet f2-l10-apparent-weight, its worked example and
     Task 2 rows, with that sheet's published answer key. ⛔ Nothing from
     f2-l10-apparent-weight-exam-questions (past-paper material).

Added 2026-11-18. Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import os

ROOT = os.environ.get("P5_APPLETS_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Physics - GCSE/Content/"
                         "P5 - Forces/Animations")
REL = "physics/aqa-gcse/p5-forces"
HUB = f"{REL}/index.html"

# (folder, link text, one-line description). Source file is always p5-<folder>.html.
PAGES = [
    ("terminal-velocity", "Terminal velocity",
     "a skydiver's fall in five stages: weight and air resistance arrows, the resultant "
     "force, and the velocity–time graph through the parachute opening."),
    ("apparent-weight", "Apparent weight",
     "a student on a scale in a lift: choose what the lift is doing and watch the "
     "normal contact force, and the scale reading, change."),
]

M_START, M_END = "<!-- P5-APPLETS:START -->", "<!-- P5-APPLETS:END -->"
ANCHOR = "<!-- LAB-LINKS:START -->"

BLOCK = "\n".join(
    [M_START, '<div class="rule--full"></div>', "<h2>Interactive</h2>", '<ul class="linking">']
    + [f'<li><a href="{folder}/">{text}</a> — {desc}</li>' for folder, text, desc in PAGES]
    + ["</ul>", M_END])


def main():
    for folder, _text, _desc in PAGES:
        src = os.path.join(SRC, f"p5-{folder}.html")
        if not os.path.isfile(src):
            raise SystemExit(f"missing source file: {src}")
        dest = os.path.join(ROOT, REL, folder)
        os.makedirs(dest, exist_ok=True)
        out = os.path.join(dest, "index.html")
        data = open(src, "rb").read()
        old = open(out, "rb").read() if os.path.exists(out) else None
        if old != data:
            open(out, "wb").write(data)
        print(f"PUBLISH: {REL}/{folder}/index.html")

    hub = os.path.join(ROOT, HUB)
    page = open(hub, encoding="utf-8").read()
    if M_START in page:
        a = page.index(M_START); b = page.index(M_END) + len(M_END)
        new = page[:a] + BLOCK + page[b:]
    else:
        if ANCHOR not in page:
            raise SystemExit(f"anchor {ANCHOR} not found in {HUB}")
        new = page.replace(ANCHOR, BLOCK + "\n" + ANCHOR, 1)
    if new != page:
        open(hub, "w", encoding="utf-8").write(new)
    print(f"PUBLISH: {HUB}")


if __name__ == "__main__":
    main()
