#!/usr/bin/env python3
"""Build the MYP Design Y9 Interactive Animations & Games unit page.

Replaces the earlier prose page with the lean protocol used by the Physics and
Y8 Design pages: summary · assessments · lessons table.

What ships:
  1. Four St Leonards summative booklets (Criteria A-D), Scribe-built from the
     MacGregor handover tasks. These are the school's own assessment material.
  2. A regenerated index.html whose lessons table links out to code.org's own
     lesson pages — the course itself is NOT re-hosted.

Whitelist discipline: the four booklets and all 28 lessons are listed explicitly
below. Nothing is globbed.

Third-party grounds (AGENTS.md): the course is code.org's CS Discoveries unit
"Interactive Animations and Games" (script csd3-2025), licensed CC BY-NC-SA 4.0
for non-commercial classroom use. We link to it rather than copy it; the credit
line names code.org and the licence. Lesson numbers and titles were read from
code.org's own unit data on 2026-08-16, not transcribed by hand.

Source PDFs: Orange per the storage convention, falling back to the vault render
staging folder while the Orange volume is unavailable (see the unit map).

Runnable standalone (`python3 build_y9_design.py`) or as a Tim injector.
"""
import os
import shutil

ROOT = os.path.expanduser("~/rawsonvault")
VAULT = os.path.expanduser("~/vault")
ORANGE_BASE = next((p for p in ("/Volumes/orange_2tb", "/media/alex/orange_2tb")
                    if os.path.isdir(p)), None)

PAGE = "myp/design/y9-animations-games"

# Preferred source (Orange), then the vault staging copy.
SOURCE_DIRS = [p for p in [
    os.path.join(ORANGE_BASE, "Alex Teaching/Computer Science/Y9 Design/Animations and Games")
    if ORANGE_BASE else None,
    os.path.join(VAULT, "01-Teaching/Computer Science - MYP/Y9 MYP Design/"
                        "Animations & Games/_summatives/_render"),
] if p]

EYEBROW = "MYP Design · Year 9 · Main unit"
TITLE = "Interactive Animations &amp; Games"
SUMMARY = ("Year 9 Design moves from physical robots to the screen. Students learn to program "
           "in Game Lab — shapes and sprites, the draw loop, conditionals and user input — while "
           "a parallel strand runs the design cycle: judging what makes a good game, writing a "
           "brief and a specification, then building and evaluating an interactive card of their own.")

COURSE_URL = "https://studio.code.org/s/interactive-games-animations"
# Per-lesson deep links. The /s/<script>/lessons/N form 404s; this is the form
# code.org's own unit data emits, and every one of the 28 was verified 200 on
# 2026-08-16 (see AGENTS.md verification discipline).
LESSON_URL = ("https://studio.code.org/courses/interactive-games-animations-2025"
              "/units/1/lessons/%d")

# (criterion letter, criterion name, booklet title, source filename stem, web slug)
SUMMATIVES = [
    ("A", "Inquiring &amp; analysing", "What Makes a Good Game?",
     "Summative A - What Makes a Good Game", "summative-a-what-makes-a-good-game"),
    ("B", "Developing ideas", "Interactive Card: Specification &amp; Designs",
     "Summative B - Interactive Card Specification and Designs", "summative-b-specification-and-designs"),
    ("C", "Creating the solution", "Building the Interactive Card",
     "Summative C - Building the Interactive Card", "summative-c-building-the-card"),
    ("D", "Evaluating", "Evaluating the Interactive Card",
     "Summative D - Evaluating the Interactive Card", "summative-d-evaluating-the-card"),
]

# code.org lesson list, read from the unit's own data 2026-08-16 (script csd3-2025).
# (number, title, gloss or "")
CHAPTERS = [
    ("Chapter 1 — Images and Animations", [
        (1,  "Programming for a Purpose", ""),
        (2,  "Plotting Shapes", "Unplugged — communicating how to draw."),
        (3,  "Drawing in Game Lab", "First contact with the editor and the 400 × 400 grid."),
        (4,  "Shapes and Parameters", ""),
        (5,  "Variables", ""),
        (6,  "Random Numbers", ""),
        (7,  "Mini-Project — Robot Faces", "Consolidates shapes, parameters and randomness."),
        (8,  "Sprites", ""),
        (9,  "Sprite Properties", ""),
        (10, "Text", ""),
        (11, "Mini-Project — Captioned Scenes", ""),
        (12, "The Draw Loop", "The idea that makes animation possible."),
        (13, "Sprite Movement", ""),
        (14, "Mini-Project — Animation", ""),
        (15, "Conditionals", ""),
        (16, "Keyboard Input", ""),
        (17, "Mouse Input", ""),
        (18, "Project — Interactive Card", "The build assessed under Criterion C."),
    ]),
    ("Chapter 2 — Building Games", [
        (19, "Velocity", ""),
        (20, "Collision Detection", ""),
        (21, "Mini-Project — Side Scroller", ""),
        (22, "Complex Sprite Movement", ""),
        (23, "Collisions", ""),
        (24, "Mini-Project — Flyer Game", ""),
        (25, "Functions", ""),
        (26, "The Game Design Process", ""),
        (27, "Using the Game Design Process", ""),
        (28, "Project — Design a Game", "The extension route for students making a game."),
    ]),
]

ICONS = "../../../images/third-party"

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Animations &amp; Games — MYP Design — The Vault</title>
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
        .a-dl { width: 3rem; text-align: right; white-space: nowrap; }
        .lesson-table { width: 100%; border-collapse: collapse; margin: var(--gap-xs) 0 var(--gap-lg); font-family: var(--font-body); }
        .lesson-table td { padding: 0.7rem 0.4rem; border-bottom: 1px solid #ece7dd; vertical-align: baseline; }
        .lesson-table tr:hover td { background: #fdf9f4; }
        .lesson-table .ln { width: 3.2rem; color: var(--bronze-light); font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
        .lesson-table .lt { color: var(--ink-black); font-size: 0.98rem; }
        .lesson-table .lt span { display: block; color: var(--gray-dark); font-size: 0.84rem; line-height: 1.5; margin-top: 0.15rem; }
        .lesson-table .ld { width: 4rem; text-align: right; white-space: nowrap; }
        .chapter-row td { background: #faf7f2; font-family: 'Cinzel', Georgia, serif; font-size: 0.9rem; letter-spacing: 0.04em; color: var(--bronze-core); padding: 0.75rem 0.4rem 0.6rem; border-bottom: 1px solid #e6dfd2; }
        .chapter-row:hover td { background: #faf7f2; }
        .ico { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-left: 0.4rem; border-radius: 6px; text-decoration: none; transition: transform 0.15s, opacity 0.15s; }
        .ico img { width: 26px; height: 26px; object-fit: contain; display: block; }
        .ico:hover { transform: translateY(-1px) scale(1.06); }
        .lesson-link { font-family: var(--font-body); font-size: 0.82rem; color: var(--bronze-light); text-decoration: none; border-bottom: 1px solid transparent; }
        .lesson-link:hover { border-bottom-color: var(--bronze-light); }
        @media (max-width: 640px) {
            .lesson-table .ld { width: auto; }
            .ico { margin: 0.1rem 0 0.1rem 0.25rem; }
        }
        .unit-note { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); line-height: 1.6; margin: calc(-1 * var(--gap-sm)) 0 var(--gap-lg); }
        .unit-note a { color: var(--bronze-light); }
        .credit-note { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); font-style: italic; background: #faf7f2; border: 1px solid #f0ece4; border-radius: 4px; padding: var(--gap-sm) var(--gap-md); margin: var(--gap-md) 0; line-height: 1.6; }
        .credit-note a { color: var(--bronze-light); }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../">The Vault</a><span>·</span>
            <a href="../../">MYP</a><span>·</span>
            <a href="../">Design</a><span>·</span>
            Interactive Animations &amp; Games
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
        <p class="unit-note">One project runs across all four criteria — most students build an interactive greetings card, and stronger coders extend the same brief into a small game. Where a task asks for the student's own design thinking, AI-generated text scores zero.</p>


        <div class="rule--full"></div>

        <!-- UNITS:START -->
        <h2>Lessons</h2>
        <table class="lesson-table">
%%UNIT_ROWS%%
        </table>
        <!-- UNITS:END -->

        <p class="unit-note">Lessons run on <a href="%%COURSE_URL%%" target="_blank" rel="noopener">code.org</a> — each row links to that lesson. Chapter 1 plus the four summatives is the core route through the year; Chapter 2 is where students who push ahead into building games end up.</p>

        <div class="credit-note">
            The course is <em>Interactive Animations and Games</em>, a CS Discoveries unit by <a href="https://code.org" target="_blank" rel="noopener">code.org</a>, taught in their free Game Lab environment; code.org's curriculum is released under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a> for non-commercial classroom use. Their lessons are linked, not copied. The four summative booklets are St Leonards' own assessment material, built on tasks inherited from Robert MacGregor, and adapt the planning handout from code.org's Lesson 18 under the same licence.
        </div>

        <footer class="site-footer">The Vault · MYP Design · Interactive Animations &amp; Games · 2026</footer>
    </div>
</body>
</html>
"""


def find_booklet(stem):
    """Locate one whitelisted booklet PDF. Named exactly — never globbed."""
    for d in SOURCE_DIRS:
        p = os.path.join(d, stem + ".pdf")
        try:
            if os.path.isfile(p):
                return p
        except OSError:
            continue          # unreadable volume — fall through to the next source
    return None


def main():
    page_dir = os.path.join(ROOT, PAGE)
    os.makedirs(page_dir, exist_ok=True)

    published, assess_rows, missing = [], [], []
    copied = 0

    for letter, crit_name, booklet, stem, slug in SUMMATIVES:
        src = find_booklet(stem)
        name = f"{slug}.pdf"
        if src is None:
            missing.append(f"summative-{letter.lower()}")
            cell = ('<span class="ico ico--none" title="Booklet not yet available">'
                    f'<img src="{ICONS}/pdf-solid.svg" alt="Booklet not available"></span>')
        else:
            shutil.copy2(src, os.path.join(page_dir, name))
            published.append(os.path.join(PAGE, name))
            copied += 1
            cell = (f'<a class="ico" href="{name}" title="{booklet} (PDF)">'
                    f'<img src="{ICONS}/pdf-solid.svg" alt="{booklet}, PDF"></a>')
        assess_rows.append(
            f'            <tr><td class="a-name">{booklet}</td>'
            f'<td class="a-crit"><span class="crit-badge">{letter}</span> {crit_name}</td>'
            f'<td class="a-dl">{cell}</td></tr>')

    unit_rows = []
    for chapter, lessons in CHAPTERS:
        unit_rows.append(f'            <tr class="chapter-row"><td colspan="3">{chapter}</td></tr>')
        for n, title, gloss in lessons:
            gloss_html = f"<span>{gloss}</span>" if gloss else ""
            unit_rows.append(
                f'            <tr><td class="ln">{n:02d}</td>'
                f'<td class="lt">{title}{gloss_html}</td>'
                f'<td class="ld"><a class="lesson-link" href="{LESSON_URL % n}" '
                f'target="_blank" rel="noopener">code.org &#8599;</a></td></tr>')

    html = (TEMPLATE
            .replace("%%EYEBROW%%", EYEBROW)
            .replace("%%TITLE%%", TITLE)
            .replace("%%SUMMARY%%", SUMMARY)
            .replace("%%COURSE_URL%%", COURSE_URL)
            .replace("%%ASSESS_ROWS%%", "\n".join(assess_rows))
            .replace("%%UNIT_ROWS%%", "\n".join(unit_rows)))

    with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    published.append(os.path.join(PAGE, "index.html"))

    icon = "images/third-party/pdf-solid.svg"
    if os.path.isfile(os.path.join(ROOT, icon)):
        published.append(icon)

    # Declare outputs so Tim commits ONLY these (never a foreign edit).
    for p in published:
        print(f"PUBLISH: {p}")
    print(f"[build_y9_design] {PAGE}: {copied} booklets copied, "
          f"{len(missing)} missing{(' ' + ','.join(missing)) if missing else ''}")


if __name__ == "__main__":
    main()
