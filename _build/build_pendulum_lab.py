#!/usr/bin/env python3
"""Publish the Year 9 Pendulum investigation interactive page.

Source of truth is the vault, not this repo: one self-contained HTML file built by
`Interactive/_src/build.py` (shared sidebar shell + pendulum-investigation.src.html).
This injector only COPIES the finished file, so the repo never holds a second edited copy.

    vault: 01-Teaching/Physics - MYP/Year 9/1. Oscillations & Waves/Interactive/pendulum-investigation.html
    repo:  myp/physics/oscillations-and-waves/pendulum-investigation/index.html

Whitelist discipline (AGENTS.md): exactly one file, listed below, nothing globbed.

CONTENT PROVENANCE. Alex's own packet (Period of a Pendulum investigation, Criteria B and C)
turned into click-through visuals. All data on the page is generated from the pendulum physics
with a seeded random timing error and is labelled as an example class set. No student names,
no real student data, no third-party material, nothing behind a login. Fonts load from Google
Fonts like every other page on the site.

Runnable standalone (`python3 build_pendulum_lab.py`) or as a Tim injector.
Declares the written file with a `PUBLISH:` line so Tim commits only this one.
"""
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(os.path.expanduser("~/rawsonvault"))
VAULT = next((Path(p) for p in (os.path.expanduser("~/vault"), "/home/alex/vault") if os.path.isdir(p)),
             Path(os.path.expanduser("~/vault")))
SRC = VAULT / "01-Teaching/Physics - MYP/Year 9/1. Oscillations & Waves/Interactive"
UNIT = "myp/physics/oscillations-and-waves"

PAGES = [
    ("pendulum-investigation.html", "pendulum-investigation"),
]


def main():
    rc = 0
    for fname, slug in PAGES:
        src = SRC / fname
        if not src.is_file():
            print(f"SKIP {fname}: not found at {src}", file=sys.stderr)
            rc = 1
            continue
        dest_rel = f"{UNIT}/{slug}/index.html"
        dest = ROOT / dest_rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
        print(f"PUBLISH: {dest_rel}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
