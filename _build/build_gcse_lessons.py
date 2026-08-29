#!/usr/bin/env python3
"""Build GCSE Physics unit pages (lean layout) — the GCSE sibling of build_myp_lessons.py.

Same house layout as the MYP unit pages: summary · assessments · lessons table.
Two differences that the GCSE side forces:

  1. A lesson row may have no PDF yet. GCSE units are sequenced from the spec
     before the workbooks exist, so a lesson declares `None` as its slug and
     renders as a plain row. The safety gate still applies to every lesson that
     DOES declare a PDF — a declared-but-unreadable PDF aborts the unit rather
     than republishing the page with a hole in it.
  2. Page depth is computed, not hardcoded, so a unit can be staged under test/
     and moved to its live path without touching the template.

Runnable standalone (`python3 build_gcse_lessons.py`) or as a Tim injector.
"""
import glob
import os
import shutil

ROOT = os.path.expanduser("~/rawsonvault")
SOURCE_ROOTS = [p for p in ("/Volumes/orange_2tb", "/media/alex/orange_2tb",
                            os.path.expanduser("~/scribe-staging"))
                if os.path.isdir(p)]

UNITS = [
    {
        "page": "physics/aqa-gcse/p1-energy",
        # No lesson PDFs exist for this unit yet — sequence first, workbooks later.
        "orange": None,
        "eyebrow": "AQA GCSE · Trilogy 8464 · Physics Paper 1 · Spec section 6.1",
        "title": "P1 Energy",
        "breadcrumb": [("The Vault", ""), ("Physics", "physics/"),
                       ("AQA GCSE Physics", "physics/aqa-gcse/")],
        "footer": "The Vault · AQA GCSE Physics",
        "summary": ("Energy cannot be created or destroyed — only stored differently and "
                    "transferred between stores. This topic builds the habit of naming the "
                    "stores before and after a change, then putting numbers to them: "
                    "kinetic, gravitational and elastic potential energy, thermal energy "
                    "and specific heat capacity, and power as the rate of transfer."),
        # Documents that sit directly under the Summary. (label, absolute source
        # path, web filename). Sourced from the vault, not the Orange, because
        # these are authored one-offs rather than generated lesson PDFs.
        "documents": [
            ("Unit Overview",
             "/Users/alex/vault/01-Teaching/Physics - GCSE/Content/P1 - Energy/"
             "p1-energy-overview.pdf",
             "p1-energy-overview.pdf"),
        ],
        # Pages on this site that belong under the Summary alongside the documents.
        # (label, href relative to the unit page).
        "links": [
            ("Visual Walkthrough", "walkthrough/"),
        ],
        # (name, [criteria/paper badges], detail) — empty list renders the heading alone.
        "assessments": [],
        # Spec sub-topic → its lessons. (section label, [(display no., title, pdf slug
        # or None), ...]) — the section label renders as a banded row above its lessons.
        "sections": [
            ("P1.1 · Energy changes in a system", [
                ("P1.1.1", "Energy stores and systems", None),
                ("P1.1.2", "Changes in energy", None),
                ("P1.1.3", "Energy changes in systems", None),
                ("P1.1.4", "Power", None),
            ]),
            ("P1.2 · Conservation and dissipation of energy", [
                ("P1.2.1", "Energy transfers in a system", None),
                ("P1.2.2", "Efficiency", None),
            ]),
            # AQA does not subdivide spec section 6.1.3 — it is a single sub-topic,
            # so it carries one row rather than an invented P1.3.x code.
            ("P1.3 · National and global energy resources", [
                ("P1.3", "Energy resources, renewable and non-renewable", None),
            ]),
        ],
    },
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>%%TITLE%% — AQA GCSE Physics — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="%%UP%%vault.css">
    <style>
        .section-header h1 { font-size: clamp(2.1rem, 5.5vw, 3.2rem); }
        .summary { font-family: var(--font-body); font-size: 0.95rem; color: var(--ink-black); line-height: 1.7; margin: var(--gap-xs) 0 var(--gap-lg); }
        .criteria-table { width: 100%; border-collapse: collapse; margin: var(--gap-xs) 0 var(--gap-lg); font-family: var(--font-body); }
        .criteria-table td { padding: 0.65rem 0.4rem; border-bottom: 1px solid #ece7dd; vertical-align: baseline; }
        .crit-badge { display: inline-block; min-width: 1.35rem; text-align: center; font-weight: 700; font-size: 0.78rem; color: #fff; background: var(--bronze-light); border-radius: 3px; padding: 0.1rem 0.34rem; margin-right: 0.25rem; }
        .a-name { color: var(--ink-black); font-weight: 700; font-size: 0.96rem; width: 46%; }
        .a-crit { color: var(--gray-dark); font-size: 0.88rem; }
        .lesson-table { width: 100%; border-collapse: collapse; margin: var(--gap-xs) 0 var(--gap-lg); font-family: var(--font-body); }
        .lesson-table td { padding: 0.7rem 0.4rem; border-bottom: 1px solid #ece7dd; vertical-align: baseline; }
        .lesson-table tr:hover td { background: #fdf9f4; }
        .lesson-table .ln { width: 4.6rem; color: var(--bronze-light); font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
        .lesson-table .lt { color: var(--ink-black); font-size: 0.98rem; }
        .lesson-table .ld { width: 6rem; text-align: right; white-space: nowrap; }
        .lesson-table .ld a { font-size: 0.82rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--bronze-light); text-decoration: none; border: 1px solid var(--bronze-light); border-radius: 3px; padding: 0.18rem 0.6rem; }
        .lesson-table .ld a:hover { background: var(--bronze-light); color: #fff; }
        .chapter-row td { background: #faf7f2; font-family: 'Cinzel', Georgia, serif; font-size: 0.9rem; letter-spacing: 0.04em; color: var(--bronze-core); padding: 0.75rem 0.4rem 0.6rem; border-bottom: 1px solid #e6dfd2; }
        .chapter-row:hover td { background: #faf7f2; }
        .doc-row { display: flex; align-items: center; gap: 0.15rem; margin: calc(-1 * var(--gap-sm)) 0 var(--gap-lg); }
        .doc-row .doc-label { font-family: var(--font-body); font-size: 0.95rem; color: var(--ink-black); text-decoration: none; border-bottom: 1px solid transparent; }
        .doc-row .doc-label:hover { border-bottom-color: var(--bronze-light); }
        .doc-row .doc-label--page { color: var(--bronze-light); margin-left: 0.15rem; }
        .ico { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; text-decoration: none; transition: transform 0.15s; }
        .ico img { width: 26px; height: 26px; object-fit: contain; display: block; }
        .ico:hover { transform: translateY(-1px) scale(1.06); }
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
%%BREADCRUMB%%
        </nav>
        <div class="section-header">
            <span class="eyebrow">%%EYEBROW%%</span>
            <h1>%%TITLE%%</h1>
        </div>
        <div class="rule--full"></div>

        <h2>Summary</h2>
        <p class="summary">%%SUMMARY%%</p>
%%DOCUMENTS%%

        <h2>Assessments</h2>
%%ASSESSMENTS%%
        <div class="rule--full"></div>

        <!-- LESSONS:START -->
        <h2>Lessons</h2>
        <table class="lesson-table">
%%LESSON_ROWS%%
        </table>
        <!-- LESSONS:END -->

        <footer class="site-footer">%%FOOTER%% · %%TITLE%% · 2026</footer>
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
    if not rel:
        return None
    for base in SOURCE_ROOTS:
        cand = os.path.join(base, rel)
        if os.path.isdir(cand):
            return cand
    return None


def build_unit(u):
    page_dir = os.path.join(ROOT, u["page"])
    os.makedirs(page_dir, exist_ok=True)
    up = "../" * len(u["page"].strip("/").split("/"))   # page depth → site root

    all_lessons = [l for _, lessons in u["sections"] for l in lessons]
    orange_folder = resolve_source(u.get("orange"))
    wants_pdfs = any(slug for _, _, slug in all_lessons)
    if wants_pdfs and not orange_folder:
        print(f"[build_gcse_lessons] {u['page']}: ABORTED — lessons declare PDFs but "
              f"the source folder was not found in {SOURCE_ROOTS}. Page left untouched.")
        return

    published = []   # repo-relative paths this injector wrote (Tim commits only these)
    lesson_rows, copied, missing = [], 0, []
    for section, lessons in u["sections"]:
        lesson_rows.append(
            f'            <tr class="chapter-row"><td colspan="3">{section}</td></tr>')
        for num, title, slug in lessons:
            link = ""
            if slug:
                src = find_pdf(orange_folder, num)
                if not src:
                    missing.append(num)
                    continue
                shutil.copy2(src, os.path.join(page_dir, slug + ".pdf"))
                published.append(os.path.join(u["page"], slug + ".pdf"))
                copied += 1
                link = f'<a href="{slug}.pdf">PDF</a>'
            lesson_rows.append(
                f'            <tr><td class="ln">{num}</td>'
                f'<td class="lt">{title}</td>'
                f'<td class="ld">{link}</td></tr>')

    # Safety gate: never regenerate a page from a source we could not actually read.
    # Only lessons that DECLARE a PDF are gated — a sequence-only unit is legitimate.
    if missing:
        print(f"[build_gcse_lessons] {u['page']}: ABORTED — {len(missing)} declared "
              f"lesson PDFs not readable ({','.join(missing)}). "
              f"Source: {orange_folder}. Page left untouched.")
        return

    # Documents under the Summary. A declared-but-missing source aborts the unit
    # for the same reason a missing lesson PDF does: a page that silently loses a
    # document looks healthy.
    doc_rows = []
    for label, src, name in u.get("documents", []):
        if not os.path.isfile(src):
            print(f"[build_gcse_lessons] {u['page']}: ABORTED — document source not "
                  f"readable: {src}. Page left untouched.")
            return
        shutil.copy2(src, os.path.join(page_dir, name))
        published.append(os.path.join(u["page"], name))
        doc_rows.append(
            f'        <div class="doc-row">'
            f'<a class="ico" href="{name}" title="{label} (PDF)">'
            f'<img src="{up}images/third-party/pdf-solid.svg" alt="{label}, PDF"></a>'
            f'<a class="doc-label" href="{name}">{label}</a></div>')

    for label, href in u.get("links", []):
        doc_rows.append(
            f'        <div class="doc-row">'
            f'<a class="doc-label doc-label--page" href="{href}">{label} &rarr;</a></div>')

    crumbs = []
    for label, path in u["breadcrumb"]:
        crumbs.append(f'            <a href="{up}{path}">{label}</a><span>·</span>')
    crumbs.append(f'            {u["title"]}')

    if u["assessments"]:
        rows = []
        for name, badges, detail in u["assessments"]:
            b = "".join(f'<span class="crit-badge">{x}</span>' for x in badges)
            rows.append(f'            <tr><td class="a-name">{name}</td>'
                        f'<td class="a-crit">{b} {detail}</td></tr>')
        assessments = ('        <table class="criteria-table">\n'
                       + "\n".join(rows) + "\n        </table>\n")
    else:
        assessments = "\n"   # heading stands alone until the assessments are decided

    html = (TEMPLATE
            .replace("%%BREADCRUMB%%", "\n".join(crumbs))
            .replace("%%EYEBROW%%", u["eyebrow"])
            .replace("%%SUMMARY%%", u["summary"])
            .replace("%%DOCUMENTS%%", "\n".join(doc_rows))
            .replace("%%ASSESSMENTS%%", assessments)
            .replace("%%LESSON_ROWS%%", "\n".join(lesson_rows))
            .replace("%%FOOTER%%", u["footer"])
            .replace("%%UP%%", up)
            .replace("%%TITLE%%", u["title"]))
    with open(os.path.join(page_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    published.append(os.path.join(u["page"], "index.html"))
    # Declare outputs so Tim commits ONLY these (never a foreign edit).
    for p in published:
        print(f"PUBLISH: {p}")
    print(f"[build_gcse_lessons] {u['page']}: {len(u['sections'])} section(s), "
          f"{len(all_lessons)} lessons, {copied} PDFs copied")


def main():
    for u in UNITS:
        build_unit(u)


if __name__ == "__main__":
    main()
