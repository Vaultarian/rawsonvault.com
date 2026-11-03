#!/usr/bin/env python3
"""Publish the Human CPU whiteboard site -- fetch-decode-execute, step by step.

Page:   cs/gcse/1-1-systems-architecture/human-cpu/  (a static, offline site)
Link:   a HUMAN-CPU block on the §1.1 page, after the Diagrams section.

Source: ~/vault/01-Teaching/Computer Science - GCSE/1.2 Memory and Storage/human-cpu/
        Built and tested there (tests.html); this injector only copies it.

📌 WHITELIST: only the files in FILES ship. tests.html and README.md stay in the
   vault. The site makes no network requests, and student names typed into its
   seat editor live only in that browser's localStorage -- nothing named is in
   any file here.

📌 WHY §1.1: the fetch-execute cycle is J277 1.1.1, even though the build sits in
   the vault's 1.2 folder beside the paper kit.

Added 2026-11-03 (v1.2 of the site: the Kitchen CPU script in CPU names, drawn
on a Von Neumann diagram). Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import os, shutil

ROOT = os.environ.get("HUMAN_CPU_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Computer Science - GCSE/"
                         "1.2 Memory and Storage/human-cpu")
REL = "cs/gcse/1-1-systems-architecture/human-cpu"
HUB = "cs/gcse/1-1-systems-architecture/index.html"
FILES = ["index.html", "styles.css", "app.js", "data.js", "print-kit.html"]
M_START, M_END = "<!-- HUMAN-CPU:START -->", "<!-- HUMAN-CPU:END -->"
ANCHOR = "<!-- TEXTBOOK-DIAGRAMS:END -->"

BLOCK = f"""{M_START}
<div class="rule--full"></div>
<h2>Interactive</h2>
<ul class="linking">
<li><a href="human-cpu/">Human CPU: the fetch-decode-execute cycle</a> — every step of the cycle on a Von Neumann diagram: who acts, what they say, and what each register holds. Press Space to step through, R to restart.</li>
</ul>
{M_END}"""


def main():
    dest = os.path.join(ROOT, REL)
    os.makedirs(dest, exist_ok=True)
    for f in FILES:
        src = os.path.join(SRC, f)
        if not os.path.isfile(src):
            raise SystemExit(f"missing source file: {src}")
        out = os.path.join(dest, f)
        with open(src, "rb") as a:
            data = a.read()
        old = open(out, "rb").read() if os.path.exists(out) else None
        if old != data:
            with open(out, "wb") as b:
                b.write(data)
        print(f"PUBLISH: {REL}/{f}")
    for f in os.listdir(dest):            # the folder holds only the whitelist
        if f not in FILES:
            p = os.path.join(dest, f)
            (shutil.rmtree if os.path.isdir(p) else os.remove)(p)
            print(f"PUBLISH: {REL}/{f}")

    hub = os.path.join(ROOT, HUB)
    page = open(hub, encoding="utf-8").read()
    if M_START in page:
        a = page.index(M_START); b = page.index(M_END) + len(M_END)
        new = page[:a] + BLOCK + page[b:]
    else:
        if ANCHOR not in page:
            raise SystemExit(f"anchor {ANCHOR} not found in {HUB}")
        new = page.replace(ANCHOR, ANCHOR + "\n" + BLOCK, 1)
    if new != page:
        open(hub, "w", encoding="utf-8").write(new)
    print(f"PUBLISH: {HUB}")


if __name__ == "__main__":
    main()
