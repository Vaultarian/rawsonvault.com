#!/usr/bin/env python3
"""Build MYP Physics unit pages (lean layout) from the Orange lesson PDFs.

Whitelist discipline: every lesson PDF is listed explicitly in UNITS below —
nothing is globbed wholesale. For each unit this:
  1. copies each whitelisted lesson PDF into the repo page folder (renamed to a
     web-friendly slug),
  2. regenerates index.html (summary · assessments · lessons table).

Runnable standalone (`python3 build_myp_lessons.py`) or as a Tim injector.
Orange path auto-detects host (/Volumes) vs container (/media).
"""
import glob
import os
import shutil

ROOT = os.path.expanduser("~/rawsonvault")
# Orange is the production store. ~/scribe-staging is the local fallback used when
# Orange is unavailable (e.g. the volume is held read-only by a running VM) so a
# build is never blocked by the drive. First root that holds the unit folder wins.
SOURCE_ROOTS = [p for p in ("/Volumes/orange_2tb", "/media/alex/orange_2tb",
                            os.path.expanduser("~/scribe-staging"))
                if os.path.isdir(p)]

UNITS = [
    {
        "page": "myp/physics/light-em-spectrum",
        "orange": "Alex Teaching/Physics - MYP/Y8 Physics/Light and EM Spectrum",
        "eyebrow": "MYP Physics · Year 8 · Unit 1",
        "title": "Light &amp; the EM Spectrum",
        "summary": ("This Year 8 unit follows light from the everyday to the invisible. "
                    "Students investigate sources, reflection, refraction and lenses, model "
                    "light as rays, then travel out across the electromagnetic spectrum — "
                    "radio to gamma — exploring how unseen waves shape communication, "
                    "medicine, and what we are able to perceive."),
        "assessments": [
            ("Reflection &amp; Refraction Investigation", ["B", "C"],
             "Inquiring &amp; designing · Processing &amp; evaluating"),
            ("End-of-Unit Test", ["A"], "Knowing &amp; understanding"),
            ("EM &amp; Society Discussion", ["D"], "Reflecting on the impacts of science"),
        ],
        # (Orange folder number-prefix, display no., title, web slug)
        "lessons": [
            ("01", "1.1", "Light Sources &amp; Reflectors", "1.1-light-sources-reflectors"),
            ("02", "1.2", "The Law of Reflection", "1.2-the-law-of-reflection"),
            ("03", "1.3", "Refraction", "1.3-refraction"),
            ("04", "1.4", "Lenses &amp; Image Formation", "1.4-lenses-and-image-formation"),
            ("05", "1.5", "Shadows &amp; Eclipses", "1.5-shadows-and-eclipses"),
            ("06", "1.6", "The Electromagnetic Spectrum", "1.6-the-em-spectrum"),
            ("07", "1.7", "Infrared", "1.7-infrared"),
            ("08", "1.8", "Radio &amp; Microwaves", "1.8-radio-and-microwaves"),
            ("09", "1.9", "X-rays &amp; Gamma Rays", "1.9-xrays-and-gamma-rays"),
            ("10", "1.10", "Colour", "1.10-colour"),
            ("11", "1.11", "Fluorescence &amp; Phosphorescence", "1.11-fluorescence-and-phosphorescence"),
        ],
    },
    {
        # Unit order follows the StL MYP Long Term Plan 2026-27 (Oscillations &
        # Waves is the Year 9 opener, from 24 Aug) — not the inherited folder
        # numbering, which put Mechanics first.
        "page": "myp/physics/oscillations-and-waves",
        "orange": "Alex Teaching/Physics - MYP/Y9 Physics/Oscillations and Waves",
        "eyebrow": "MYP Physics · Year 9 · Unit 1",
        "title": "Oscillations &amp; Waves",
        "summary": ("This Year 9 unit begins with the simplest repeating motion — a "
                    "swinging pendulum — and builds towards the waves that carry energy "
                    "through ropes, water and air. Students measure period and frequency, "
                    "model transverse and longitudinal waves, and finish by asking why "
                    "matching a system&rsquo;s natural frequency can shake a bridge apart."),
        "assessments": [
            ("Pendulum Investigation", ["B", "C"],
             "Inquiring &amp; designing · Processing &amp; evaluating"),
            ("Resonance Research Report", ["D"],
             "Reflecting on the impacts of science"),
            ("End-of-Unit Test", ["A"], "Knowing &amp; understanding"),
        ],
        # (source folder number-prefix, display no., title, web slug)
        "lessons": [
            ("01", "1.1", "Oscillations &amp; Frequency", "1.1-oscillations-and-frequency"),
            ("02", "1.2", "Period &amp; Frequency", "1.2-period-and-frequency"),
            ("03", "1.3", "Measuring the Period of a Pendulum", "1.3-measuring-the-period-of-a-pendulum"),
            ("04", "1.4", "Transverse Waves", "1.4-transverse-waves"),
            ("05", "1.5", "Longitudinal Waves", "1.5-longitudinal-waves"),
            ("06", "1.6", "Sound Waves", "1.6-sound-waves"),
            ("07", "1.7", "The Speed of Sound in Different Substances", "1.7-speed-of-sound-in-different-substances"),
            ("08", "1.8", "The Wave Equation", "1.8-the-wave-equation"),
            ("09", "1.9", "Reflection, Refraction &amp; Diffraction", "1.9-reflection-refraction-and-diffraction"),
            ("10", "1.10", "Natural Frequency &amp; Resonance", "1.10-natural-frequency-and-resonance"),
            ("11", "1.11", "Damping &amp; Engineering Solutions", "1.11-damping-and-engineering-solutions"),
        ],
    },
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%%TITLE%% — MYP Physics — The Vault</title>
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
        .lesson-table .ld { width: 6rem; text-align: right; white-space: nowrap; }
        .lesson-table .ld a { font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--bronze-light); text-decoration: none; border: 1px solid var(--bronze-light); border-radius: 3px; padding: 0.18rem 0.6rem; }
        .lesson-table .ld a:hover { background: var(--bronze-light); color: #fff; }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../">The Vault</a><span>·</span>
            <a href="../../">MYP</a><span>·</span>
            <a href="../">Physics</a><span>·</span>
            %%TITLE%%
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

        <!-- LESSONS:START -->
        <h2>Lessons</h2>
        <table class="lesson-table">
%%LESSON_ROWS%%
        </table>
        <!-- LESSONS:END -->

        <footer class="site-footer">The Vault · MYP Physics · %%TITLE%% · 2026</footer>
    </div>
</body>
</html>
"""


def find_pdf(orange_folder, prefix):
    for d in sorted(glob.glob(os.path.join(orange_folder, prefix + " -*"))):
        pdfs = glob.glob(os.path.join(d, "*.pdf"))
        if pdfs:
            return pdfs[0]
    return None


def resolve_source(rel):
    """First source root that actually holds this unit's folder."""
    for base in SOURCE_ROOTS:
        cand = os.path.join(base, rel)
        if os.path.isdir(cand):
            return cand
    return None


def build_unit(u):
    orange_folder = resolve_source(u["orange"])
    if not orange_folder:
        print(f"[build_myp_lessons] {u['page']}: source folder not found in "
              f"{SOURCE_ROOTS} — skipping")
        return
    page_dir = os.path.join(ROOT, u["page"])
    os.makedirs(page_dir, exist_ok=True)

    published = []   # repo-relative paths this injector wrote (Tim commits only these)
    lesson_rows, copied, missing = [], 0, []
    for prefix, num, title, slug in u["lessons"]:
        src = find_pdf(orange_folder, prefix)
        if not src:
            missing.append(prefix)
            continue
        shutil.copy2(src, os.path.join(page_dir, slug + ".pdf"))
        published.append(os.path.join(u["page"], slug + ".pdf"))
        copied += 1
        lesson_rows.append(
            f'            <tr><td class="ln">{num}</td>'
            f'<td class="lt">{title}</td>'
            f'<td class="ld"><a href="{slug}.pdf">PDF</a></td></tr>')

    # Safety gate: never regenerate a page from a source we could not actually read.
    # A degraded/held volume can make the folder stat fine while every lookup inside
    # it fails — which would silently republish the page with an empty lessons table.
    if missing:
        print(f"[build_myp_lessons] {u['page']}: ABORTED — {len(missing)} of "
              f"{len(u['lessons'])} lesson PDFs not readable ({','.join(missing)}). "
              f"Source: {orange_folder}. Page left untouched.")
        return

    assess_rows = []
    for name, crits, names in u["assessments"]:
        badges = "".join(f'<span class="crit-badge">{c}</span>' for c in crits)
        assess_rows.append(
            f'            <tr><td class="a-name">{name}</td>'
            f'<td class="a-crit">{badges} {names}</td></tr>')

    html = (TEMPLATE
            .replace("%%EYEBROW%%", u["eyebrow"])
            .replace("%%TITLE%%", u["title"])
            .replace("%%SUMMARY%%", u["summary"])
            .replace("%%ASSESS_ROWS%%", "\n".join(assess_rows))
            .replace("%%LESSON_ROWS%%", "\n".join(lesson_rows)))
    with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    published.append(os.path.join(u["page"], "index.html"))
    # Declare outputs so Tim commits ONLY these (never a foreign edit).
    for p in published:
        print(f"PUBLISH: {p}")
    print(f"[build_myp_lessons] {u['page']}: {copied} PDFs copied, "
          f"{len(missing)} missing{(' ' + ','.join(missing)) if missing else ''}")


def main():
    if not SOURCE_ROOTS:
        print("[build_myp_lessons] no source root available (Orange not mounted, "
              "no ~/scribe-staging) — skipping")
        return
    for u in UNITS:
        build_unit(u)


if __name__ == "__main__":
    main()
