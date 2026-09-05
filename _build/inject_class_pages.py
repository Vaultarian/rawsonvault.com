#!/usr/bin/env python3
"""Class pages — one student-facing running log per class, grouped by week.

The Daily Print slices the Class Logs by DATE (one day, every class, for Alex
at the printer). This slices the same source the other way: one CLASS, every
date, for students looking back to find which sheet went with which lesson.

Two rules make these safe to publish, both decided by Alex on 2026-08-29:

  1. THE DAY IT HAPPENS. A log entry is published once its date has arrived,
     whatever its status -- except "Did not run", which never appears at all.
     The gate is the calendar, not the status flip: students get the sheet on
     the morning of the lesson, and next week's plans still stay private until
     next week. (Changed 2026-09-03; was "Taught" only. The status flip was
     doing nothing but withholding documents Alex wanted students to have.)

  2. WHITELIST THE DOCUMENTS. A lesson's PDFs appear only if the entry has a
     `- **Publish:** …` field listing them as wikilinks. `Resources:` is NOT
     used here: it routinely holds answer keys and staff lesson plans. Absent
     field means no documents. Uncertainty resolves to exclusion.

Emits  classes/index.html  and  classes/<slug>/index.html (+ files/*.pdf)
"""
import html
import os
import re
import shutil
import subprocess
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

HOME = Path.home()
sys.path.insert(0, str(HOME / "AlfredOS/scripts"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from school_week import week_for, monday_of, term_for  # noqa: E402
# Shared with the Daily Print injector on purpose: two parsers of the same log
# format would drift, and the pages would quietly disagree with each other.
from inject_daily_print import field, strip_md, pdf_links, page_count  # noqa: E402

VAULT = HOME / "vault"
LOGS = VAULT / "01-Teaching/Class Logs"
REPO = Path(os.environ.get("RAWSONVAULT_PATH", HOME / "rawsonvault")).expanduser()
OUT = REPO / "classes"

MONTHS = "%-d %B"

# Document icons. A matched pair, after the ones Alex used on the 07/08 Vault
# site (images/worksheet1.png, images/worksheetanswers.png): one tag shape, a
# red pencil for the sheet you write on, a green tick for the sheet you check
# against. Redrawn as inline SVG rather than copied, because the originals are
# 24px and go soft on a retina screen, and because the class-page injector
# copies PDFs only -- an inline icon adds no asset to carry.
_PENCIL_D = "M12.4 21.6l5.3-5.3 2.5 2.5-5.3 5.3-3.3.8z"
_TICK_D = "M12.8 18.9l3 3 6.1-6.4"
# The tag is scaled back to 0.84 so the badge has room to overlap its corner
# and still sit inside the 24px box. All three icons carry the same transform,
# or the plain one renders visibly larger than its siblings.
_TAG = ('<g transform="translate(-1,-1) scale(0.84)">'
        '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6'
        'a2 2 0 0 1 0 2.8z" fill="#e0d3a4" stroke="#9c8b4e" stroke-width="1.4"'
        ' stroke-linejoin="round"/>'
        '<circle cx="6.9" cy="6.9" r="1.55" fill="#fdfbf3" stroke="#9c8b4e"'
        ' stroke-width="1.2"/></g>')


def _svg(*body):
    return ('<svg class="doc-ico" viewBox="0 0 24 24" width="22" height="22" '
            'aria-hidden="true" focusable="false">' + _TAG + "".join(body)
            + "</svg>")


# Each badge is drawn twice: once as a thick page-coloured stroke that knocks a
# gap out of the tag behind it, then again in colour. Cheaper and cleaner than
# a disc, which bit a notch out of the tag's diagonal edge.
ICON_SHEET = _svg(
    f'<path d="{_PENCIL_D}" fill="none" stroke="#fdfbf3" stroke-width="2.6"'
    ' stroke-linejoin="round"/>',
    f'<path d="{_PENCIL_D}" fill="#c0392b"/>',
    '<path d="M17.7 16.3l1.2-1.2a1 1 0 0 1 1.4 0l1.1 1.1a1 1 0 0 1 0 1.4'
    'l-1.2 1.2z" fill="#7e2d21" stroke="#fdfbf3" stroke-width="0.7"/>')

ICON_KEY = _svg(
    f'<path d="{_TICK_D}" fill="none" stroke="#fdfbf3" stroke-width="5.2"'
    ' stroke-linecap="round" stroke-linejoin="round"/>',
    f'<path d="{_TICK_D}" fill="none" stroke="#3f8f2c" stroke-width="2.8"'
    ' stroke-linecap="round" stroke-linejoin="round"/>')

# The bare tag, for documents that are not worksheets -- a course expectations
# sheet, a reference page. The pencil would tell a student to write on it.
ICON_DOC = _svg()

# Reference material -- read, not written on. Everything else gets the pencil,
# because listing what a student writes on turns out to be the longer and
# leakier list: it missed "Colour Perception -- Beau Lotto worksheet" and
# "Optical Illusions -- Write-up" on the first pass.
REFERENCE = re.compile(
    r"(expectations|overview|syllabus|record|reference|progression|"
    r"policy|guide|glossary|vocab)", re.I)


def pair_docs(docs):
    """Group each worksheet with its answer key.

    <stem>.pdf and <stem>-answers.pdf are one row with two icons, which is the
    layout of the 07/08 homework page: name on the left, sheet and answers to
    the right. A key published without its sheet still gets its own row -- that
    happens legitimately, e.g. when the sheet went out under an earlier entry.
    Order follows the Publish: whitelist.
    """
    rows, seen = [], {}
    for p, lbl, n in docs:
        is_key = p.stem.endswith("-answers")
        base = p.stem[:-len("-answers")] if is_key else p.stem
        if base not in seen:
            seen[base] = {"label": None, "sheet": None, "key": None}
            rows.append(base)
        slot = seen[base]
        slot["key" if is_key else "sheet"] = (p, n)
        # The worksheet's label names the lesson; the key's label just repeats
        # it with "answer key" appended. Prefer the sheet's.
        if not is_key or slot["label"] is None:
            slot["label"] = lbl or base
    return [(seen[b]["label"], seen[b]["sheet"], seen[b]["key"]) for b in rows]

# Narrow, opt-in escape hatch for publishing an entry ahead of its DATE --
# the one thing rule 1 no longer allows on its own:
#   CLASS_PAGES_FORCE="Computer Science 10|2026-09-01,…"
# Unset by default, so the scheduled 05:30 run is untouched. It lifts the date
# check only: a "Did not run" entry stays unpublished even when named here, and
# the Publish: whitelist (rule 2) is never bypassed -- a forced entry still
# publishes only what it whitelists.
FORCE = {t.strip() for t in os.environ.get("CLASS_PAGES_FORCE", "").split(",") if t.strip()}


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def parse_log(path):
    """(subtitle, [entry]) for one Class Log.

    entry = {date, status, topic, docs}. Every dated block is returned; the
    visibility filter is applied by the caller so the console report can say
    how many entries were held back.
    """
    text = path.read_text()
    lines = text.splitlines()

    # The line under the '# <Class> — Class Log' title, e.g.
    # '**Year 10 (GCSE)** · Group R'. Used as the page subtitle.
    subtitle = ""
    for ln in lines[1:]:
        if ln.startswith("### "):
            break
        if ln.strip() and not ln.startswith("#"):
            subtitle = strip_md(ln)
            break

    entries, cur, buf = [], None, []

    def flush():
        if not cur:
            return
        block = "\n".join(buf)
        entries.append(dict(
            date=cur[0], status=cur[1],
            topic=strip_md(field(block, "Topic")),
            docs=pdf_links(field(block, "Publish")),  # whitelist, never Resources
        ))

    for ln in lines:
        if ln.startswith("### "):
            flush()
            head = ln[4:].strip()
            m = re.match(r"(\d{4}-\d{2}-\d{2})\s*(?:·\s*(.*))?$", head)
            cur = (date.fromisoformat(m.group(1)), (m.group(2) or "").strip()) if m else None
            buf = []
        elif cur:
            buf.append(ln)
    flush()
    return subtitle, entries


def week_label(monday):
    """'Week A · 25–29 August' -- the range covers the teaching week only."""
    wk = week_for(monday)
    friday = monday + timedelta(days=4)
    if monday.month == friday.month:
        span = f"{monday.strftime('%-d')}–{friday.strftime(MONTHS)}"
    else:
        span = f"{monday.strftime(MONTHS)} – {friday.strftime(MONTHS)}"
    return (f"Week {wk} · {span}" if wk else span)


# ── rendering ───────────────────────────────────────────────────────────────

HEAD = """    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{css}">"""

STYLE = """    <style>
      .wk {{ margin: 2.5rem 0 0.4rem; font-family: var(--font-ui);
        font-size: 0.72rem; letter-spacing: 0.11em; text-transform: uppercase;
        color: var(--bronze-rich); }}
      .lesson {{ display: grid; grid-template-columns: 8.5rem 1fr; gap: 0 1.5rem;
        padding: 1rem 0; border-top: 1px solid var(--bronze-cream); }}
      .lesson-date {{ font-family: 'Cinzel', Georgia, serif; font-size: 0.95rem;
        padding-top: 0.1rem; }}
      .lesson-topic {{ font-family: var(--font-body); margin: 0 0 0.5rem; }}
      .lesson-doc {{ display: block; font-family: var(--font-ui);
        font-size: 0.85rem; margin-bottom: 0.3rem; }}
      .lesson-doc .pp {{ opacity: 0.55; font-size: 0.75rem; }}
      /* Name on the left, sheet and answer-key icons on the right --
         the 07/08 Vault homework layout. */
      .doc-row {{ display: flex; align-items: center; gap: 0.6rem;
        padding: 0.18rem 0; }}
      .doc-name {{ font-family: var(--font-ui); font-size: 0.85rem;
        flex: 1 1 auto; min-width: 0; }}
      .doc-icons {{ display: flex; gap: 0.25rem; flex: 0 0 auto; }}
      .doc-link {{ display: inline-flex; line-height: 0; padding: 2px;
        border-radius: 5px; transition: background 0.12s ease; }}
      .doc-link:hover {{ background: rgba(128,128,128,0.18); }}
      .doc-ico {{ display: block; }}
      .lesson-none {{ font-family: var(--font-ui); font-size: 0.82rem;
        opacity: 0.45; }}
      .empty-note {{ font-family: var(--font-body); opacity: 0.6;
        margin: 2rem 0 3rem; }}
      @media (max-width: 620px) {{
        .lesson {{ grid-template-columns: 1fr; gap: 0.3rem; }}
      }}
      .vocab-bar {{ display: flex; align-items: baseline; gap: 0.55rem;
        flex-wrap: wrap; margin: 1.3rem 0 0; }}
      .vocab-label {{ font-family: var(--font-ui); font-size: 0.7rem;
        letter-spacing: 0.09em; text-transform: uppercase;
        color: var(--bronze-rich); margin-right: 0.25rem; }}
      .vocab-link {{ font-family: var(--font-ui); font-size: 0.82rem;
        padding: 0.28rem 0.8rem; border: 1px solid var(--bronze-cream);
        border-radius: 2px; text-decoration: none; }}
      .vocab-link:hover {{ background: var(--bronze-rich); color: #fff;
        border-color: var(--bronze-rich); }}
    </style>"""


# Home-language vocabulary support. One page per class holds all three languages
# (see the vocabulary spec in the vault); these are three bookmarkable doors into it,
# so a student can save the one in their own language. Labels are the languages' own
# names rather than flags -- a Spanish speaker is not necessarily Spanish.
#
# Every class that has a vocabulary page shows ALL THREE, never a subset. A subset
# would publicly signal which languages a given class contains, which in a class of
# twenty is close to naming a student.
VOCAB_LANGS = [("fr", "Français"), ("de", "Deutsch"), ("es", "Español")]


def vocab_bar(name):
    if not (OUT / slug(name) / "vocab" / "index.html").exists():
        return ""
    links = "\n          ".join(
        f'<a class="vocab-link" href="vocab/?lang={c}">{lbl}</a>'
        for c, lbl in VOCAB_LANGS)
    return ('\n        <div class="vocab-bar">'
            '\n          <span class="vocab-label">Vocabulary</span>'
            f'\n          {links}'
            '\n        </div>')


def render_class(name, subtitle, weeks):
    e = html.escape
    blocks = []
    for monday, entries in weeks:
        rows = []
        for en in entries:
            if en["docs"]:
                parts = []
                for lbl, sheet, key in pair_docs(en["docs"]):
                    icons = ""
                    # A row with an answer key is a worksheet by definition.
                    # Otherwise test the label AND the filename -- Alex's
                    # labels often say "worksheet" where the filename does not.
                    written = bool(key) or not REFERENCE.search(
                        f"{lbl} {sheet[0].name}" if sheet else lbl)
                    for slot, icon, what in (
                            (sheet, ICON_SHEET if written else ICON_DOC,
                             "Worksheet" if written else "Document"),
                            (key, ICON_KEY, "Answer key")):
                        if not slot:
                            continue
                        p, n = slot
                        tip = f"{what} — {n}pp" if n else what
                        icons += (f'<a class="doc-link" href="files/{e(p.name)}"'
                                  f' title="{e(tip)}" aria-label="{e(lbl)} —'
                                  f' {e(tip)}">{icon}</a>')
                    parts.append(f'<div class="doc-row">'
                                 f'<span class="doc-name">{e(lbl)}</span>'
                                 f'<span class="doc-icons">{icons}</span></div>')
                docs = "".join(parts)
            else:
                docs = '<span class="lesson-none">No handout</span>'
            rows.append(f"""          <div class="lesson">
            <div class="lesson-date">{e(en['date'].strftime('%a %-d %b'))}</div>
            <div>
              <p class="lesson-topic">{e(en['topic'] or '—')}</p>
              {docs}
            </div>
          </div>""")
        blocks.append(f'        <p class="wk">{e(week_label(monday))}</p>\n'
                      + "\n".join(rows))

    body = ("\n".join(blocks) if blocks else
            '        <p class="empty-note">No lessons published yet. Entries appear '
            'here on the day of each lesson.</p>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
{HEAD.format(title=e(name), css="../../vault.css")}
{STYLE.format()}
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../">The Vault</a><span>·</span>
            <a href="../">Classes</a><span>·</span>
            {e(name)}
        </nav>
        <div class="section-header">
            <span class="eyebrow">Class Log</span>
            <h1>{e(name)}</h1>
            <p class="subtitle">{e(subtitle)}</p>
        </div>
        <div class="rule--full"></div>{vocab_bar(name)}
{body}
        <footer class="site-footer">The Vault · {e(name)} · updated {datetime.now().strftime('%-d %B %Y')}</footer>
    </div>
</body>
</html>
"""


def render_index(classes):
    e = html.escape
    cards = "".join(f"""            <a class="nav-card" href="{e(s)}/">
                <p class="card-eyebrow">{e(sub)}</p>
                <p class="card-title">{e(n)}</p>
                <p class="card-desc">{cnt} lesson{'' if cnt == 1 else 's'} published</p>
                <span class="card-arrow">Enter →</span>
            </a>
""" for n, s, sub, cnt in classes)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
{HEAD.format(title="Classes", css="../vault.css")}
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../">The Vault</a><span>·</span>
            Classes
        </nav>
        <div class="section-header">
            <span class="eyebrow">The Vault</span>
            <h1>Classes</h1>
            <p class="subtitle">What we did each lesson, and the handouts that went with it.</p>
        </div>
        <div class="rule--full"></div>
        <nav class="nav-grid">
{cards}        </nav>
        <footer class="site-footer">The Vault · Classes · updated {datetime.now().strftime('%-d %B %Y')}</footer>
    </div>
</body>
</html>
"""


# ── main ────────────────────────────────────────────────────────────────────

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    classes, touched, held = [], [], 0
    today = date.today()

    for path in sorted(LOGS.glob("*.md")):
        name = path.stem
        subtitle, entries = parse_log(path)

        # Tolerant status match on purpose: a stray capital in a hand-typed
        # log must not silently publish a lesson that never ran.
        published = [en for en in entries
                     if en["status"].strip().lower() != "did not run"
                     and (en["date"] <= today
                          or f"{name}|{en['date']}" in FORCE)]
        held += len(entries) - len(published)

        # Newest first, all the way down: newest week at the top, and newest
        # day at the top inside each week. The common question is "what did we
        # just do?", so the answer should never be scrolled to.
        by_week = {}
        for en in published:
            en["docs"] = [(p, lbl, page_count(p)) for p, lbl in en["docs"]]
            by_week.setdefault(monday_of(en["date"]), []).append(en)
        weeks = [(mon, sorted(v, key=lambda x: x["date"], reverse=True))
                 for mon, v in sorted(by_week.items(), reverse=True)]

        s = slug(name)
        cdir = OUT / s
        (cdir / "files").mkdir(parents=True, exist_ok=True)

        wanted = set()
        for _, ens in weeks:
            for en in ens:
                for pdf, _lbl, _n in en["docs"]:
                    shutil.copy2(pdf, cdir / "files" / pdf.name)
                    wanted.add(pdf.name)

        for stale in (cdir / "files").iterdir():
            if stale.is_file() and stale.name not in wanted:
                stale.unlink()

        (cdir / "index.html").write_text(render_class(name, subtitle, weeks))
        classes.append((name, s, subtitle, len(published)))
        print(f"  {name:24} {len(published):>2} live · {len(wanted)} doc(s)")

    (OUT / "index.html").write_text(render_index(classes))

    # This injector owns classes/ outright, so declare the whole subtree's diff
    # rather than only what it wrote -- an undeclared deletion never commits.
    try:
        r = subprocess.run(
            ["git", "-C", str(REPO), "status", "--porcelain", "-uall", "--", "classes"],
            capture_output=True, text=True, timeout=30)
        touched = [ln[3:].strip('"') for ln in r.stdout.splitlines() if len(ln) >= 4]
    except (OSError, subprocess.SubprocessError):
        touched = ["classes/index.html"]

    print(f"{len(classes)} class page(s); "
          f"{held} entry(ies) held back (future-dated or did not run)")
    for p in sorted(set(touched)):
        print(f"PUBLISH: {p}")


if __name__ == "__main__":
    main()
