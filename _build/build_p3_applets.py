#!/usr/bin/env python3
"""Publish the P3 Particle Model applets (AQA GCSE Physics).

Pages:  physics/aqa-gcse/p3-particle-model/<folder>/index.html, one per entry in FILES:
          ice-to-steam                         (2026-11-15)
          18 worksheet-question pages          (2026-11-17)
Link:   a P3-APPLETS block on the P3 hub page, just before the Labs block. Ice to Steam
        first, then the question pages grouped by worksheet, in sheet order.

Source: ~/vault/01-Teaching/Physics - GCSE/Content/P3 - Particle Model/Animations/
        Built and tested there; this injector only copies. Each file is one
        self-contained HTML page: canvas + inline script, Google Fonts only, no
        cookies, no student data.

📌 WHITELIST: only the files in FILES ship (source name -> published folder).

📌 OWN WORK. Ice to Steam was written from scratch, its scenario paraphrased. The
   changes-of-state, shc and latent-heat pages carry questions from Alex's own
   worksheets (p3-l03, p3-l04, p3-l05), word for word, with those sheets' data and
   answer keys. `cooling-air-argon` is practice on the idea of a centre-licensed
   past-paper question: stem written fresh, in our own words, no AQA wording, table
   layout or mark scheme. Language matches p3-l04 / p3-l05 (E_k, E_p, bonds).

⛔ REMOVED 2026-11-17 (Alex): ice-to-water. It was a test question and 11 R sit that
   test on Fri 20 Nov. The published folder is deleted by this injector (REMOVED) and
   declared with a PUBLISH: line so Tim's scoped commit carries the deletion. The
   vault source p3-ice-to-water.html stays: it is the style exemplar, and may come
   back with new numbers. Do not re-add it to FILES as it stands.

Added 2026-11-15. Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import os
import shutil

ROOT = os.environ.get("P3_APPLETS_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Physics - GCSE/Content/"
                         "P3 - Particle Model/Animations")
REL = "physics/aqa-gcse/p3-particle-model"
HUB = f"{REL}/index.html"

# (worksheet heading, [(folder, link text, one-line description), ...]) in sheet order.
# Source file is always p3-<folder>.html.
SHEETS = [
    ("Changes of State", [
        ("changes-of-state-q4", "Question 4",
         "the volume of steam from 0.50 kg of water: the mass carries across, the volume changes."),
        ("changes-of-state-q5", "Question 5",
         "the mass of a block of ice, then the volume of the water it melts into."),
    ]),
    ("3.4 Internal Energy and Specific Heat Capacity", [
        ("shc-q2", "Question 2", "the energy to warm a 0.50 kg copper block by 15 °C."),
        ("shc-q3", "Question 3", "an iron pan from 20 °C to 70 °C: temperature change first, then the energy."),
        ("shc-q4", "Question 4", "a 600 g aluminium saucepan: grams to kilograms, answer in J and kJ."),
        ("shc-q5", "Question 5", "the temperature rise when 18 000 J goes into an iron block."),
        ("shc-q6", "Question 6", "find the specific heat capacity, then name the metal from the table."),
        ("shc-q7", "Question 7", "the same energy into copper and into water: two very different rises."),
        ("shc-q9", "Question 9 (Higher)",
         "an immersion heater for 90 s: energy first, then the final temperature."),
    ]),
    ("3.5 Specific Latent Heat", [
        ("latent-heat-q2", "Question 2", "the energy to boil 2.0 kg of water already at 100 °C."),
        ("latent-heat-q3", "Question 3", "how much ice 167 000 J melts."),
        ("latent-heat-q4", "Question 4", "find the specific latent heat, then name the liquid from the table."),
        ("latent-heat-q5", "Question 5", "the energy to boil away 250 g of water: grams to kilograms first."),
        ("latent-heat-q9", "Question 9 (Higher)",
         "five ice cubes left in a glass: melt, then warm to 20 °C, two stages added together."),
        ("latent-heat-q10", "Question 10 (Higher)",
         "a snowball hits a wall: kinetic energy becomes the energy that melts snow."),
        ("latent-heat-q11", "Question 11 (Higher)",
         "a falling hailstone: gravitational potential energy melts part of it."),
        ("latent-heat-q12", "Question 12 (Higher)",
         "a car brakes to a stop: kinetic energy warms the iron brake discs."),
    ]),
    ("States and changes: practice", [
        ("cooling-air-argon", "Cooling air to −190 °C",
         "which gases are solid, liquid or gas at −190 °C, and what argon's particles do as it cools."),
    ]),
]

FILES = {"p3-ice-to-steam.html": "ice-to-steam"}
for _heading, _pages in SHEETS:
    for _folder, _text, _desc in _pages:
        FILES[f"p3-{_folder}.html"] = _folder

# Published folders that must not exist. Deleted on every run; see the docstring.
REMOVED = ["ice-to-water"]

M_START, M_END = "<!-- P3-APPLETS:START -->", "<!-- P3-APPLETS:END -->"
ANCHOR = "<!-- LAB-LINKS:START -->"


def _block():
    out = [M_START,
           '<div class="rule--full"></div>',
           "<h2>Interactive</h2>",
           '<ul class="linking">',
           '<li><a href="ice-to-steam/">Ice to steam</a> — the whole heating curve for 0.50 kg, '
           "−10 °C to 110 °C: five stages, with kinetic energy rising on the slopes and "
           "potential energy on the flats.</li>",
           "</ul>"]
    for heading, pages in SHEETS:
        out.append(f"<h3>{heading}</h3>")
        out.append('<ul class="linking">')
        for folder, text, desc in pages:
            out.append(f'<li><a href="{folder}/">{text}</a> — {desc}</li>')
        out.append("</ul>")
    out.append(M_END)
    return "\n".join(out)


BLOCK = _block()


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

    for folder in REMOVED:
        if folder in FILES.values():
            raise SystemExit(f"{folder} is in both FILES and REMOVED")
        dest = os.path.join(ROOT, REL, folder)
        if os.path.isdir(dest):
            shutil.rmtree(dest)
        # Declared whether or not it was present this run, so the deletion commits.
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
