#!/usr/bin/env python3
"""Publish the P3 Particle Model applets (AQA GCSE Physics).

Pages:  physics/aqa-gcse/p3-particle-model/ice-to-water/index.html
Link:   a P3-APPLETS block on the P3 hub page, just before the Labs block.

Source: ~/vault/01-Teaching/Physics - GCSE/Content/P3 - Particle Model/Animations/
        Built and tested there; this injector only copies. Each file is one
        self-contained HTML page: canvas + inline script, Google Fonts only, no
        cookies, no student data.

📌 WHITELIST: only the files in FILES ship (source name -> published folder).

📌 OWN WORK: written from scratch for this site. The scenario is paraphrased, not
   AQA's question wording. Language matches p3-l04 / p3-l05 (E_k, E_p, bonds).

Added 2026-11-15. Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import os

ROOT = os.environ.get("P3_APPLETS_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Physics - GCSE/Content/"
                         "P3 - Particle Model/Animations")
REL = "physics/aqa-gcse/p3-particle-model"
HUB = f"{REL}/index.html"
FILES = {
    "p3-ice-to-water.html": "ice-to-water",
}
M_START, M_END = "<!-- P3-APPLETS:START -->", "<!-- P3-APPLETS:END -->"
ANCHOR = "<!-- LAB-LINKS:START -->"

BLOCK = f"""{M_START}
<div class="rule--full"></div>
<h2>Interactive</h2>
<ul class="linking">
<li><a href="ice-to-water/">Ice to water</a> — ice at −5 °C warmed to water at 0 °C, in two stages: kinetic energy rises, then potential energy. Particles, heating curve and energy meters move together.</li>
</ul>
{M_END}"""


def main():
    for src_name, folder in FILES.items():
        src = os.path.join(SRC, src_name)
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
