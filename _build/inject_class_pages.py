#!/usr/bin/env python3
"""Class pages — one student-facing running log per class, grouped by week.

The Daily Print slices the Class Logs by DATE (one day, every class, for Alex
at the printer). This slices the same source the other way: one CLASS, every
date, for students looking back to find which sheet went with which lesson.

Two rules make these safe to publish, both decided by Alex on 2026-08-29:

  1. TAUGHT ONLY. A log entry is published only if its heading status is
     exactly "Taught". "Planned" and "Did not run" never appear -- otherwise
     next week's plans go public the moment they are written.

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


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def parse_log(path):
    """(subtitle, [entry]) for one Class Log.

    entry = {date, status, topic, docs}. Every dated block is returned; the
    Taught filter is applied by the caller so the console report can say how
    many entries were held back.
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
      .lesson-none {{ font-family: var(--font-ui); font-size: 0.82rem;
        opacity: 0.45; }}
      .empty-note {{ font-family: var(--font-body); opacity: 0.6;
        margin: 2rem 0 3rem; }}
      @media (max-width: 620px) {{
        .lesson {{ grid-template-columns: 1fr; gap: 0.3rem; }}
      }}
    </style>"""


def render_class(name, subtitle, weeks):
    e = html.escape
    blocks = []
    for monday, entries in weeks:
        rows = []
        for en in entries:
            if en["docs"]:
                docs = "".join(
                    f'<a class="lesson-doc" href="files/{e(p.name)}">{e(lbl or p.stem)}'
                    + (f' <span class="pp">{n}pp</span>' if n else "") + "</a>"
                    for p, lbl, n in en["docs"])
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
            'here once a lesson has been taught.</p>')

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
        <div class="rule--full"></div>
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

    for path in sorted(LOGS.glob("*.md")):
        name = path.stem
        subtitle, entries = parse_log(path)

        taught = [en for en in entries if en["status"] == "Taught"]
        held += len(entries) - len(taught)

        # newest week first -- the common question is "what did we just do?"
        by_week = {}
        for en in taught:
            en["docs"] = [(p, lbl, page_count(p)) for p, lbl in en["docs"]]
            by_week.setdefault(monday_of(en["date"]), []).append(en)
        weeks = [(mon, sorted(v, key=lambda x: x["date"]))
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
        classes.append((name, s, subtitle, len(taught)))
        print(f"  {name:24} {len(taught):>2} taught · {len(wanted)} doc(s)")

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

    print(f"{len(classes)} class page(s); {held} entry(ies) held back (not Taught)")
    for p in sorted(set(touched)):
        print(f"PUBLISH: {p}")


if __name__ == "__main__":
    main()
