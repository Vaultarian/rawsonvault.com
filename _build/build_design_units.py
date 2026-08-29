#!/usr/bin/env python3
"""Build the MYP Design Y8 Robotics unit page from the Orange micro:bit unit folders.

Whitelist discipline: all thirteen units are listed explicitly in UNITS below —
nothing is globbed wholesale. For each unit this:
  1. copies the student workbook PDF and the classroom-slides PDF into the repo page
     folder (renamed to web-friendly slugs),
  2. regenerates index.html (summary · assessments · units table).

Educator guides are deliberately NOT published — they are Alex's own copies.
Quick-start videos are NOT hosted; each unit links to the authors' own YouTube upload
(verified via oEmbed, channel @MSMakeCode — see AGENTS.md verification discipline).

Third-party grounds (AGENTS.md): Microsoft MakeCode's "Intro to Computer Science" is
published free for classroom use, no sign-in; credit line names Douglas and Mary Kiang
and links to the source.

Runnable standalone (`python3 build_design_units.py`) or as a Tim injector.
Orange path auto-detects host (/Volumes) vs container (/media).
"""
import os
import re
import shutil

ROOT = os.path.expanduser("~/rawsonvault")
ORANGE_BASE = next((p for p in ("/Volumes/orange_2tb", "/media/alex/orange_2tb")
                    if os.path.isdir(p)), "/Volumes/orange_2tb")

PAGE = "myp/design/y8-robotics"
ORANGE_REL = "Alex Teaching/2026 Handover Files/MYP Y8 Design/microbit unit"

EYEBROW = "MYP Design · Year 8 · Main unit"
TITLE = "Robotics &amp; Control"
SUMMARY = ("Year 8 Design is one sustained course in physical computing. Students learn to "
           "program the BBC micro:bit — its LED grid, buttons, sensors and radio — then put "
           "that programming to work driving TPBot robot cars through escalating control "
           "challenges, closing with a robot they design, build and evaluate against a brief "
           "of their own.")

ASSESSMENTS = [
    ("Robots in the Real World", ["A", "D"], "Inquiring &amp; analysing · Evaluating"),
    ("Design a Robot for a Task", ["B", "C"], "Developing ideas · Creating the solution"),
]

# (unit no., slug, display title, one-line gloss, verified YouTube id)
UNITS = [
    (1,  "making",        "Making",        "First contact with the micro:bit and MakeCode; design and build a micro:pet housing.",   "J9aRFvBB7T4"),
    (2,  "algorithms",    "Algorithms",    "Inputs, outputs and event handlers; program faces and a fidget cube.",                    "xfQ8f9rpNXo"),
    (3,  "variables",     "Variables",     "Storing and changing information; code a scorekeeper and build a counting object.",       "bndvYqROWBI"),
    (4,  "conditionals",  "Conditionals",  "Decision-making with if…then…else; code Rock Paper Scissors, then a board game.",         "pQsk4u5oYGU"),
    (5,  "iteration",     "Iteration",     "Repeat, while and for loops with sound and motion; first micro-servo build.",             "MsidOfiVvyU"),
    (6,  "mini-project",  "Mini Project",  "Consolidation: plan, track and showcase a short independent project.",                    "s3bN64D_p3Q"),
    (7,  "coordinates",   "Coordinates",   "The 5×5 LED grid as a coordinate system; plot, animate, then make a game.",               "FIofhOP8Ftk"),
    (8,  "booleans",      "Booleans",      "Boolean data and operators to control flow and track state; code a double coin flipper.", "omi1r8rggpE"),
    (9,  "binary",        "Binary",        "Bits, bytes and base-2; build a working cardboard binary counter.",                       "nVUW_yYoTdU"),
    (10, "radio",         "Radio",         "Sending data between boards — the foundation for radio-controlling a robot.",             "ugLWoNIoGAo"),
    (11, "arrays",        "Arrays",        "Lists, indexing and sorting strategies; build an instrument that stores note sequences.",  "B1b4IDrk2mM"),
    (12, "accelerometer", "Accelerometer", "Sensing movement along x, y and z; design a multi-tool that solves a problem.",            "fuqhcE6gXgI"),
    (13, "final-project", "Final Project", "An extended independent build, documented throughout with a focus on metacognition.",      "4A-npiseXG4"),
]

# (source filename prefix, output suffix)
ASSETS = [("Student workbook", "student-workbook"), ("Classroom presentation", "slides")]

ICONS = "../../../images/third-party"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Robotics &amp; Control — MYP Design — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../vault.css">
    <style>
        .summary { font-family: var(--font-body); font-size: 0.95rem; color: var(--ink-black); line-height: 1.7; margin: var(--gap-xs) 0 var(--gap-lg); }
        .criteria-table { width: 100%; border-collapse: collapse; margin: var(--gap-xs) 0 var(--gap-lg); font-family: var(--font-body); }
        .criteria-table td { padding: 0.65rem 0.4rem; border-bottom: 1px solid #ece7dd; vertical-align: baseline; }
        .crit-badge { display: inline-block; min-width: 1.35rem; text-align: center; font-weight: 700; font-size: 0.78rem; color: #fff; background: var(--bronze-light); border-radius: 3px; padding: 0.1rem 0.34rem; margin-right: 0.25rem; }
        .a-name { color: var(--ink-black); font-weight: 700; font-size: 0.96rem; width: 46%; }
        .a-crit { color: var(--gray-dark); font-size: 0.88rem; }
        .lesson-table { width: 100%; border-collapse: collapse; margin: var(--gap-xs) 0 var(--gap-lg); font-family: var(--font-body); }
        .lesson-table td { padding: 0.7rem 0.4rem; border-bottom: 1px solid #ece7dd; vertical-align: baseline; }
        .lesson-table tr:hover td { background: #fdf9f4; }
        .lesson-table .ln { width: 3.2rem; color: var(--bronze-light); font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
        .lesson-table .lt { color: var(--ink-black); font-size: 0.98rem; }
        .lesson-table .lt span { display: block; color: var(--gray-dark); font-size: 0.84rem; line-height: 1.5; margin-top: 0.15rem; }
        .lesson-table .ld { width: 8.5rem; text-align: right; white-space: nowrap; }
        .ico { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-left: 0.4rem; border-radius: 6px; text-decoration: none; transition: transform 0.15s, opacity 0.15s; }
        .ico img { width: 26px; height: 26px; object-fit: contain; display: block; }
        .ico:hover { transform: translateY(-1px) scale(1.06); }
        .ico--none { cursor: default; }
        .ico--none img { filter: grayscale(1); opacity: 0.22; }
        .ico--none:hover { transform: none; }
        @media (max-width: 640px) {
            .lesson-table .ld { width: auto; }
            .ico { margin: 0.1rem 0 0.1rem 0.25rem; }
        }
        .unit-note { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); line-height: 1.6; margin: calc(-1 * var(--gap-sm)) 0 var(--gap-lg); }
        .unit-note a { color: var(--bronze-light); }
        .credit-note { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); font-style: italic; background: #faf7f2; border: 1px solid #f0ece4; border-radius: 4px; padding: var(--gap-sm) var(--gap-md); margin: var(--gap-md) 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../">The Vault</a><span>·</span>
            <a href="../../">MYP</a><span>·</span>
            <a href="../">Design</a><span>·</span>
            Robotics &amp; Control
        </nav>
        <div class="section-header">
            <span class="eyebrow">%%EYEBROW%%</span>
            <h1>%%TITLE%%</h1>
        </div>
        <div class="rule--full"></div>

        <h2>Summary</h2>
        <p class="summary">%%SUMMARY%%</p>

        <h2>Assessments</h2>
        <table class="criteria-table">
%%ASSESS_ROWS%%
        </table>


        <div class="rule--full"></div>

        <!-- UNITS:START -->
        <h2>Units</h2>
        <table class="lesson-table">
%%UNIT_ROWS%%
        </table>
        <!-- UNITS:END -->

%%UNIT_NOTE%%
        <div class="credit-note">
            Student workbooks and classroom presentations are from <em>Intro to Computer Science with MakeCode for micro:bit</em> by Douglas Kiang and Mary Kiang, published by Microsoft MakeCode; the quick-start videos are theirs too, linked to <a href="https://www.youtube.com/@MSMakeCode" target="_blank" rel="noopener">Microsoft MakeCode</a> on YouTube. Reproduced here for classroom use, with thanks to the authors. The full course, including its online lesson pages, is at <a href="https://makecode.microbit.org/courses/csintro" target="_blank" rel="noopener">makecode.microbit.org</a>.
        </div>

        <footer class="site-footer">The Vault · MYP Design · Robotics &amp; Control · 2026</footer>
    </div>
</body>
</html>
"""


def find_asset(orange_folder, n, prefix):
    """Locate one whitelisted asset PDF inside a unit folder. Never globs wholesale."""
    folder = next((d for d in sorted(os.listdir(orange_folder))
                   if os.path.isdir(os.path.join(orange_folder, d))
                   and re.match(rf"Unit 0?{n}\b", d)), None)
    if folder is None:
        return None
    d = os.path.join(orange_folder, folder)
    for f in sorted(os.listdir(d)):
        if f.startswith("._") or not f.lower().endswith(".pdf"):
            continue
        if f.lower().startswith(prefix.lower()):
            return os.path.join(d, f)
    return None


def main():
    if not os.path.isdir(ORANGE_BASE):
        print(f"[build_design_units] Orange not mounted at {ORANGE_BASE} — skipping")
        return

    orange_folder = os.path.join(ORANGE_BASE, ORANGE_REL)
    page_dir = os.path.join(ROOT, PAGE)
    os.makedirs(page_dir, exist_ok=True)

    published, unit_rows, missing = [], [], []
    copied = 0

    for n, slug, title, gloss, vid in UNITS:
        cells = []
        for prefix, suffix in ASSETS:
            src = find_asset(orange_folder, n, prefix)
            name = f"{n:02d}-{slug}-{suffix}.pdf"
            if src is None:
                missing.append(f"u{n:02d}/{suffix}")
                if suffix == "student-workbook":
                    cells.append(
                        f'<span class="ico ico--none" title="Student workbook — not yet available">'
                        f'<img src="{ICONS}/pdf-solid.svg" alt="Student workbook not available"></span>')
                continue
            shutil.copy2(src, os.path.join(page_dir, name))
            published.append(os.path.join(PAGE, name))
            copied += 1
            if suffix == "student-workbook":
                cells.append(f'<a class="ico" href="{name}" title="Student workbook (PDF)">'
                             f'<img src="{ICONS}/pdf-solid.svg" alt="Student workbook, PDF"></a>')
            else:
                cells.append(f'<a class="ico" href="{name}" title="Classroom slides (PDF)">'
                             f'<img src="{ICONS}/microsoft-powerpoint.svg" alt="Classroom slides, PDF"></a>')

        cells.append(f'<a class="ico" href="https://youtu.be/{vid}" target="_blank" rel="noopener" '
                     f'title="Quick-start video (YouTube)">'
                     f'<img src="{ICONS}/youtube.svg" alt="Quick-start video, YouTube"></a>')

        unit_rows.append(
            f'            <tr><td class="ln">{n:02d}</td>'
            f'<td class="lt">{title}<span>{gloss}</span></td>'
            f'<td class="ld">{"".join(cells)}</td></tr>')

    assess_rows = []
    for name, crits, names in ASSESSMENTS:
        badges = "".join(f'<span class="crit-badge">{c}</span>' for c in crits)
        assess_rows.append(f'            <tr><td class="a-name">{name}</td>'
                           f'<td class="a-crit">{badges} {names}</td></tr>')

    note = ""
    if any(m.endswith("student-workbook") for m in missing):
        note = ('        <p class="unit-note">Unit 13\'s student workbook is not yet available — '
                'the source file is corrupt. The slides, the video, and the '
                '<a href="https://makecode.microbit.org/courses/csintro/finalproject" '
                'target="_blank" rel="noopener">online Final Project lesson</a> '
                'cover the same ground.</p>\n')

    html = (TEMPLATE
            .replace("%%EYEBROW%%", EYEBROW)
            .replace("%%TITLE%%", TITLE)
            .replace("%%SUMMARY%%", SUMMARY)
            .replace("%%ASSESS_ROWS%%", "\n".join(assess_rows))
            .replace("%%UNIT_ROWS%%", "\n".join(unit_rows))
            .replace("%%UNIT_NOTE%%", note))

    with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    published.append(os.path.join(PAGE, "index.html"))

    # The custom PDF icon this page depends on.
    icon = "images/third-party/pdf-solid.svg"
    if os.path.isfile(os.path.join(ROOT, icon)):
        published.append(icon)

    # Declare outputs so Tim commits ONLY these (never a foreign edit).
    for p in published:
        print(f"PUBLISH: {p}")
    print(f"[build_design_units] {PAGE}: {copied} PDFs copied, "
          f"{len(missing)} missing{(' ' + ','.join(missing)) if missing else ''}")


if __name__ == "__main__":
    main()
