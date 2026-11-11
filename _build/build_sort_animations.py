#!/usr/bin/env python3
"""Publish the three sorting animations (bubble, insertion, merge) for CS GCSE 2.1.3.

Pages:  cs/gcse/2-1-algorithms/sorting-animations/{bubble-sort,insertion-sort,merge-sort}.html
Link:   a SORT-ANIMATIONS block on the §2.1 Algorithms page, after the Practice block.

Source: ~/vault/01-Teaching/Computer Science - GCSE/2.1 Algorithms/Animations/
        Built and tested there; this injector only copies them. Each file is one
        self-contained HTML page: no libraries, no network requests, no cookies, and
        no student data. The code each one steps through is the Python on the
        Algorithms 4 handout (alg-04-sorting), line numbers matching.

📌 WHITELIST: only the files in FILES ship (source name -> published name). The
   folder holds only the whitelist; anything else in it is removed.

📌 OWN WORK: written from scratch for this site. No third-party code or artwork. (The
   Isaac Computer Science page supplied example data on the handout, not code here.)

Added 2026-11-11. Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import os, shutil

ROOT = os.environ.get("SORT_ANIM_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Computer Science - GCSE/"
                         "2.1 Algorithms/Animations")
REL = "cs/gcse/2-1-algorithms/sorting-animations"
HUB = "cs/gcse/2-1-algorithms/index.html"
FILES = {
    "bubble-sort-animation.html": "bubble-sort.html",
    "insertion-sort-animation.html": "insertion-sort.html",
    "merge-sort-animation.html": "merge-sort.html",
}
M_START, M_END = "<!-- SORT-ANIMATIONS:START -->", "<!-- SORT-ANIMATIONS:END -->"
ANCHOR = "<!-- PRACTICE:END -->"

BLOCK = f"""{M_START}
<div class="rule--full"></div>
<h2>Sorting animations</h2>
<ul class="linking">
<li><a href="sorting-animations/bubble-sort.html">Bubble sort</a> — the Python from Algorithms 4, one line at a time, on bars. Back and Next, or the arrow keys.</li>
<li><a href="sorting-animations/insertion-sort.html">Insertion sort</a> — the card in hand, the sorted part growing, and every shift to the right.</li>
<li><a href="sorting-animations/merge-sort.html">Merge sort</a> — every split, every call and every comparison inside merge, with the calls waiting shown.</li>
</ul>
{M_END}"""


def main():
    dest = os.path.join(ROOT, REL)
    os.makedirs(dest, exist_ok=True)
    for src_name, out_name in FILES.items():
        src = os.path.join(SRC, src_name)
        if not os.path.isfile(src):
            raise SystemExit(f"missing source file: {src}")
        out = os.path.join(dest, out_name)
        with open(src, "rb") as a:
            data = a.read()
        old = open(out, "rb").read() if os.path.exists(out) else None
        if old != data:
            with open(out, "wb") as b:
                b.write(data)
        print(f"PUBLISH: {REL}/{out_name}")
    keep = set(FILES.values())
    for f in os.listdir(dest):            # the folder holds only the whitelist
        if f not in keep:
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
