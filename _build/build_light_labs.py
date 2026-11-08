#!/usr/bin/env python3
"""Publish the two Year 8 Light interactive lab pages (Refraction, Reflection).

Source of truth is the vault, not this repo: each page is a single self-contained HTML
file built by `Interactive/_src/build.py` (shared sidebar shell + one source per packet).
This injector only COPIES the two finished files, so the repo never holds a second edited copy.

    vault: 01-Teaching/Physics - MYP/Year 8/1. Light & EM Spectrum/Interactive/<name>.html
    repo:  myp/physics/light-em-spectrum/<slug>/index.html

Whitelist discipline (AGENTS.md): exactly two files, listed below, nothing globbed.

CONTENT PROVENANCE. Both pages are Alex's own packets turned into click-through visuals.
The only data in them is last year's class averages for the refraction packet, which the
packet itself prints as an anonymous table (no names, no class label). No third-party
material, no exam-board questions, nothing behind a login. Fonts load from Google Fonts
like every other page on the site.

Runnable standalone (`python3 build_light_labs.py`) or as a Tim injector.
Declares each written file with a `PUBLISH:` line so Tim commits only these two.
"""
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(os.path.expanduser("~/rawsonvault"))
VAULT = next((Path(p) for p in (os.path.expanduser("~/vault"), "/home/alex/vault") if os.path.isdir(p)),
             Path(os.path.expanduser("~/vault")))
SRC = VAULT / "01-Teaching/Physics - MYP/Year 8/1. Light & EM Spectrum/Interactive"
UNIT = "myp/physics/light-em-spectrum"

PAGES = [
    ("refraction-investigation.html", "refraction-investigation"),
    ("law-of-reflection.html", "law-of-reflection"),
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
