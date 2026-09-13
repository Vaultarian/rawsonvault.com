#!/usr/bin/env python3
"""Manage the `Upcoming summative:` line on the class pages.

    ./summative.py                                  what every class says now
    ./summative.py set "Physics 9A" "Light and the EM Spectrum"
    ./summative.py set "Design 8B" "Robot Control Program" \
                       --pdf "01-Teaching/.../y8-criterion-b.pdf" \
                       --label "What you are marked on"
    ./summative.py clear "Physics 9A"               once the test has been sat

There is nothing to copy between pages. The stylesheet lives in one `STYLE`
block inside inject_class_pages.py and every class page is rendered from it, so
all sixteen already carry the summative CSS and will show the strip the moment
their Class Log has the field. This script only writes that field -- it is a
typist for the Class Log header, not a page builder.

Run it with the AlfredOS venv, which has PyYAML:

    ~/AlfredOS/.venv/bin/python3 summative.py

Nothing here publishes. Changes reach the site on Tim's next run, or at 05:30
with the rest of the class pages.
"""

import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from inject_class_pages import LOGS, VAULT, read_summative, CALENDARS, slug  # noqa: E402

FIELD = "**Upcoming summative:**"

# Tutor Time is registration, not a taught course. It has no calendar and will
# never have a summative, so it is not a gap and must not be reported as one.
NOT_TAUGHT = {"tutor-time-8-axr"}

# The header block ends at the first dated entry. Everything this script
# touches lives above that line.
FIRST_ENTRY = re.compile(r"^### \d{4}-\d{2}-\d{2}", re.M)


def logs():
    """Every Class Log, in the order they appear on disk."""
    return sorted(LOGS.glob("*.md"))


def find_log(name):
    """Resolve 'Physics 9A', 'physics-9a' or 'physics 9a' to its Class Log."""
    want = slug(name)
    for p in logs():
        if slug(p.stem) == want:
            return p
    sys.exit(f"no Class Log matches {name!r}. Try: ./summative.py")


def header_bounds(lines):
    """(start, end) of the header block -- title line to the first entry."""
    for i, ln in enumerate(lines):
        if ln.startswith("### "):
            return 0, i
    return 0, len(lines)


def cmd_status(_args):
    """What every class currently says, and what it is missing."""
    print(f"{'CLASS':<22} {'CAL':<4} SUMMATIVE")
    missing = []
    for p in logs():
        label, docs = read_summative(p)
        cal = "yes" if slug(p.stem) in CALENDARS else "—"
        if label or docs:
            extra = f"  [{len(docs)} sheet{'s' if len(docs) != 1 else ''}]" if docs else ""
            print(f"{p.stem:<22} {cal:<4} {label}{extra}")
        else:
            print(f"{p.stem:<22} {cal:<4} —")
            if slug(p.stem) not in NOT_TAUGHT:
                missing.append(p.stem)
    if missing:
        print(f"\n{len(missing)} without a summative line:")
        for m in missing:
            print(f"  ./summative.py set {m!r} \"<topic>\"")
        print("\nThe label is the TOPIC, not the date -- \"Greeting Card Design\n"
              "Brief\", not \"Criterion A, Wed 7 Oct\". A date beside the word\n"
              "summative is a countdown; the topic tells them what to revise.")


def cmd_set(args):
    p = find_log(args.klass)
    lines = p.read_text().splitlines()
    _, end = header_bounds(lines)

    if args.pdf and not (VAULT / args.pdf).exists():
        sys.exit(f"no such PDF under the vault: {args.pdf}")

    block = [f"{FIELD} {args.topic}"]
    if args.pdf:
        label = args.label or Path(args.pdf).stem
        block.append(f"  - [[{args.pdf}|{label}]]")

    # Drop any field already there, then re-insert. Simpler than editing in
    # place, and it means `set` is idempotent however the old one was shaped.
    old_start = next((i for i in range(end) if lines[i].startswith(FIELD)), None)
    if old_start is not None:
        old_end = old_start + 1
        while old_end < end and lines[old_end].startswith(("  -", "\t-")):
            old_end += 1
        was = lines[old_start][len(FIELD):].strip()
        lines[old_start:old_end] = block
        print(f"  ~ {p.stem}: {was!r} -> {args.topic!r}")
    else:
        # Straight under the '**Year …**' subtitle, which is the line the page
        # already renders beneath the class name.
        at = next((i for i in range(1, end) if lines[i].strip().startswith("**Year")), 0)
        lines[at + 1:at + 1] = block
        print(f"  + {p.stem}: {args.topic!r}")

    p.write_text("\n".join(lines) + "\n")


def cmd_clear(args):
    p = find_log(args.klass)
    lines = p.read_text().splitlines()
    _, end = header_bounds(lines)
    start = next((i for i in range(end) if lines[i].startswith(FIELD)), None)
    if start is None:
        print(f"  = {p.stem}: no summative line to clear")
        return
    stop = start + 1
    while stop < end and lines[stop].startswith(("  -", "\t-")):
        stop += 1
    gone = lines[start][len(FIELD):].strip()
    del lines[start:stop]
    p.write_text("\n".join(lines) + "\n")
    print(f"  - {p.stem}: cleared {gone!r}")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd")

    sub.add_parser("status", help="what every class says now (the default)")

    s = sub.add_parser("set", help="set or replace a class's summative line")
    s.add_argument("klass", help="'Physics 9A' or 'physics-9a'")
    s.add_argument("topic", help="the CONTENT title, e.g. 'Greeting Card Design Brief'")
    s.add_argument("--pdf", help="vault-relative path to a sheet, e.g. 01-Teaching/...")
    s.add_argument("--label", help="button text (default: the PDF's filename)")

    c = sub.add_parser("clear", help="remove the line once the test has been sat")
    c.add_argument("klass")

    args = ap.parse_args()
    {"set": cmd_set, "clear": cmd_clear}.get(args.cmd, cmd_status)(args)


if __name__ == "__main__":
    main()
