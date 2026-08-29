#!/usr/bin/env python3
"""Daily Print injector — rebuilds /daily_print for one date.

Tim runs this unattended every school morning.  It resolves the day's
teaching grid, reads the matching dated block out of each Class Log,
copies the linked PDFs into the repo and rewrites the page.

Sources, all hand-maintained by Alex, all read-only here:
  vault/01-Teaching/St Leonards 2627 Schedule/timetable.yaml   the A/B grid
  vault/01-Teaching/Class Logs/<Subject> <Class>.md            topic + [[links]]
  vault/01-Teaching/St Leonards 2627 Schedule/Student Roster.md class sizes

Copies default to the class size from the roster; an explicit "To print:"
line in the Class Log overrides that, verbatim.

Tim's injector contract: print `PUBLISH: <repo-relative-path>` for every
file touched.  Removals count -- `git add` stages a deletion -- so a PDF
that drops out of the day must be declared too, or the working tree keeps
a deletion that never commits and files/ grows without bound.

Date: today, or $DAILY_PRINT_DATE (YYYY-MM-DD) for testing.
"""
import html
import os
import re
import shutil
import subprocess
import sys
from datetime import date, datetime
from pathlib import Path

HOME = Path.home()
# The canonical A/B lookup lives outside this repo and is mounted read-only.
# Never re-implement it here: each term resets to Week A, so parity arithmetic
# from an anchor Monday is wrong for 12 of the year's 37 teaching weeks.
sys.path.insert(0, str(HOME / "AlfredOS/scripts"))
from school_week import week_for, describe  # noqa: E402

VAULT = HOME / "vault"
SCHED = VAULT / "01-Teaching/St Leonards 2627 Schedule"
LOGS = VAULT / "01-Teaching/Class Logs"

REPO = Path(os.environ.get("RAWSONVAULT_PATH", HOME / "rawsonvault")).expanduser()
OUT = REPO / "daily_print"
FILES = OUT / "files"

PERIODS = ["tutor", "P1", "P2", "P3", "P4", "P5", "P6"]
PERIOD_LABEL = {"tutor": "Tutor"}


# ── reading the sources ─────────────────────────────────────────────────────

def load_day(day):
    """(week, [(period, subject, class)]) for `day`, in timetable order."""
    import yaml
    week = week_for(day)
    if week is None or day.weekday() > 4:
        return week, []
    tt = yaml.safe_load((SCHED / "timetable.yaml").read_text())
    grid = tt["weeks"][week].get(day.strftime("%A").lower()) or {}
    return week, [(p, grid[p]["subject"], grid[p]["class"])
                  for p in PERIODS if p in grid]


def class_sizes():
    """Parse 'Class Subject (n)' entries out of the Student Roster table."""
    text = (SCHED / "Student Roster.md").read_text()
    return {re.sub(r"\s+", "", label).upper(): int(n)
            for label, n in re.findall(r"([\w ]+?)\s*\((\d+)\)", text)}


def size_for(subject, klass, sizes):
    if subject == "Tutor Time":
        return sizes.get("Y8TUTORGROUP")
    return sizes.get(re.sub(r"\s+", "", klass + subject).upper())


def log_block(subject, klass, day):
    """The '### <day>' section of the Class Log for this class, or ''."""
    path = LOGS / f"{subject} {klass}.md"
    if not path.exists():
        return ""
    out, keep = [], False
    for line in path.read_text().splitlines():
        if line.startswith("### "):
            keep = line.startswith(f"### {day.isoformat()}")
            continue
        if keep:
            out.append(line)
    return "\n".join(out)


def field(block, name):
    """Value of a '- **Name:** ...' field, including its continuation lines."""
    m = re.search(rf"^-\s*\*\*{name}:?\*\*\s*(.*(?:\n(?!\s*-\s*\*\*).*)*)",
                  block, re.M)
    return m.group(1).strip() if m else ""


def strip_md(s):
    s = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"\*\*([^*]*)\*\*", r"\1", s).replace("---", "—")
    return re.sub(r"\s+", " ", s).strip()


def pdf_links(block):
    """[(path, label)] for the PDF wikilinks in this block.

    `label` is the text after the pipe in [[path|label]], or None. The class
    pages use it as the visible link text -- a student reads "Course
    Expectations", not "y11r-physics-gcse".
    """
    found, seen = [], set()
    for target, label in re.findall(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]", block):
        target = target.strip()
        if not target.lower().endswith(".pdf"):
            continue
        p = VAULT / target
        if p.exists() and p not in seen:
            seen.add(p)
            found.append((p, (label or "").strip() or None))
    return found


def pdfs_in(block):
    """Vault-relative PDF paths named by wikilinks in this block."""
    return [p for p, _ in pdf_links(block)]


def page_count(pdf):
    """Page count, or None. Never raises -- a missing count is cosmetic.

    Uses pypdf rather than `mdls`: mdls is macOS-only, and inside Tim's
    Linux container a missing binary raises FileNotFoundError, which is an
    OSError and would crash the whole run over a decorative number.
    """
    try:
        from pypdf import PdfReader
        return len(PdfReader(str(pdf)).pages)
    except Exception:
        return None


def build_rows(day):
    week, grid = load_day(day)
    sizes = class_sizes()
    rows = []
    for period, subject, klass in grid:
        block = log_block(subject, klass, day)
        override = strip_md(field(block, "To print"))
        size = size_for(subject, klass, sizes)
        rows.append(dict(
            period=PERIOD_LABEL.get(period, period),
            klass=f"{subject} {klass}",
            topic=strip_md(field(block, "Topic")) or "—",
            copies=override or (str(size) if size else "—"),
            docs=[(p, page_count(p)) for p in pdfs_in(block)],
        ))
    return week, rows


# ── rendering ───────────────────────────────────────────────────────────────

def render(day, week, rows, files):
    e = html.escape
    trs = []
    for r in rows:
        if r["docs"]:
            links = "".join(
                f'<a class="print-doc" href="files/{e(files[p].name)}">{e(files[p].stem)}'
                + (f' <span class="pp">{n}pp</span>' if n else "") + "</a>"
                for p, n in r["docs"])
        else:
            links = '<span class="print-none">—</span>'
        cls = "print-copies-n" if r["copies"].isdigit() else "print-copies-t"
        trs.append(f"""          <tr>
            <th scope="row">{e(r['period'])}</th>
            <td class="print-class">{e(r['klass'])}</td>
            <td class="print-topic">{e(r['topic'])}</td>
            <td><span class="{cls}">{e(r['copies'])}</span></td>
            <td>{links}</td>
          </tr>""")

    if rows:
        subtitle = f"{day.strftime('%A %-d %B %Y')} · {describe(day)} · copies to run for each period"
        body = f"""        <table class="print-table">
          <colgroup>
            <col style="width:7%"><col style="width:17%"><col style="width:29%">
            <col style="width:14%"><col style="width:33%">
          </colgroup>
          <thead>
            <tr><th>Period</th><th>Class</th><th>Lesson</th><th>Copies</th><th>Documents</th></tr>
          </thead>
          <tbody>
{chr(10).join(trs)}
          </tbody>
        </table>"""
    else:
        # A weekend, a holiday, or a date outside the published year. Say so
        # plainly -- an empty page is honest, a stale one is dangerous.
        subtitle = f"{day.strftime('%A %-d %B %Y')} · {describe(day)}"
        body = ('        <p class="print-empty">No classes scheduled. '
                'Nothing to print.</p>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Daily Print — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../vault.css">
    <style>
      .print-table {{
        width: 100%; table-layout: fixed; border-collapse: collapse;
        margin: 1.5rem 0 2.5rem; }}
      .print-table th, .print-table td {{
        padding: 0.9rem 1rem 0.9rem 0; text-align: left; vertical-align: top;
        border-bottom: 1px solid var(--bronze-cream);
        font-family: var(--font-body); line-height: 1.45; }}
      .print-table td:last-child, .print-table th:last-child {{ padding-right: 0; }}
      .print-table thead th {{
        font-family: var(--font-ui); font-size: 0.7rem;
        letter-spacing: 0.1em; text-transform: uppercase; font-weight: 400;
        color: var(--bronze-rich); padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--bronze-light); }}
      .print-table tbody th {{
        font-family: 'Cinzel', Georgia, serif; font-size: 0.95rem;
        letter-spacing: 0.04em; }}
      .print-table tbody tr:hover {{ background: rgba(184,128,64,0.05); }}
      .print-class {{ font-weight: 700; }}
      .print-topic {{ font-size: 0.9rem; }}
      /* A bare number is the thing he reads at the printer -- make it loud.
         A "To print:" override is prose, so it stays at reading size. */
      .print-copies-n {{ font-family: 'Cinzel', Georgia, serif; font-size: 1.75rem;
        line-height: 1; color: var(--bronze-deep); }}
      .print-copies-t {{ font-size: 0.85rem; }}
      .print-doc {{ display: block; margin-bottom: 0.45rem;
        font-family: var(--font-ui); font-size: 0.85rem; line-height: 1.35;
        overflow-wrap: anywhere; }}
      .print-doc:last-child {{ margin-bottom: 0; }}
      .print-doc .pp {{ opacity: 0.55; font-size: 0.75rem; white-space: nowrap; }}
      .print-none {{ opacity: 0.35; }}
      .print-empty {{ font-family: var(--font-body); opacity: 0.6;
        margin: 2rem 0 3rem; }}
      @media (max-width: 720px) {{
        .print-table, .print-table tbody, .print-table tr,
        .print-table th, .print-table td {{ display: block; width: auto; }}
        .print-table thead {{ display: none; }}
        .print-table tr {{
          padding: 0.9rem 0; border-bottom: 1px solid var(--bronze-light); }}
        .print-table th, .print-table td {{ border: 0; padding: 0.1rem 0; }}
        .print-table tbody th {{ color: var(--bronze-rich); }}
        .print-copies-n {{ font-size: 1.4rem; }}
      }}
    </style>
</head>
<body>
    <div class="container container--wide">
        <nav class="breadcrumb">
            <a href="../">The Vault</a><span>·</span>
            Daily Print
        </nav>
        <div class="section-header">
            <span class="eyebrow">The Vault · Staff</span>
            <h1>Daily Print</h1>
            <p class="subtitle">{subtitle}</p>
        </div>
        <div class="rule--full"></div>
{body}
        <footer class="site-footer">The Vault · Daily Print · generated {datetime.now().strftime('%Y-%m-%d %H:%M')}</footer>
    </div>
</body>
</html>
"""


# ── main ────────────────────────────────────────────────────────────────────

def main():
    raw = os.environ.get("DAILY_PRINT_DATE", "").strip()
    day = date.fromisoformat(raw) if raw else date.today()

    week, rows = build_rows(day)
    FILES.mkdir(parents=True, exist_ok=True)

    # Copy in the PDFs this day needs, then remove any left from a previous
    # run. Both are declared: an undeclared deletion never gets committed.
    files, wanted = {}, set()
    for r in rows:
        for pdf, _ in r["docs"]:
            dest = FILES / pdf.name
            shutil.copy2(pdf, dest)
            files[pdf] = dest
            wanted.add(dest.name)

    touched = [f"daily_print/files/{n}" for n in sorted(wanted)]
    for stale in sorted(FILES.iterdir()):
        if stale.is_file() and stale.name not in wanted:
            stale.unlink()
            touched.append(f"daily_print/files/{stale.name}")

    (OUT / "index.html").write_text(render(day, week, rows, files))
    touched.append("daily_print/index.html")

    # This injector owns daily_print/ outright, so it declares the whole
    # subtree's diff rather than only the files it personally wrote. Without
    # this, a deletion made by an earlier or manual run is never declared,
    # so Tim leaves it uncommitted and it strands in the working tree forever
    # while files/ keeps growing in git.
    try:
        out = subprocess.run(
            ["git", "-C", str(REPO), "status", "--porcelain", "-uall", "--", "daily_print"],
            capture_output=True, text=True, timeout=30)
        for line in out.stdout.splitlines():
            if len(line) >= 4:
                touched.append(line[3:].strip('"'))
    except (OSError, subprocess.SubprocessError):
        pass  # no git: fall back to declaring only what we wrote

    print(f"{day} · {describe(day)} · {len(rows)} period(s) · {len(wanted)} PDF(s)")
    for r in rows:
        print(f"  {r['period']:6} {r['klass']:22} copies={r['copies']:<34}"
              f"{len(r['docs'])} doc(s)")
    for path in sorted(set(touched)):
        print(f"PUBLISH: {path}")


if __name__ == "__main__":
    main()
