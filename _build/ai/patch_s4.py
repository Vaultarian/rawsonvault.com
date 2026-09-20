# -*- coding: utf-8 -*-
"""Patch the two rich Season 4 pages in place, preserving their bespoke markup."""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import build_pages as B          # reuses the nav chain and gem block
from manifest import P

ROOT = pathlib.Path(__file__).resolve().parents[2] / "ai/students"
by_dir = {p["dir"]: p for p in P}

for slug in ("season-4/s4e1-post-truth", "season-4/s4e2-environmentalist-debate"):
    p = by_dir[slug]
    f = ROOT / slug / "index.html"
    h = f.read_text(encoding="utf-8")
    before = h

    # 1. title
    h = h.replace("— AI Club — The Vault</title>", "— AI Literacy — The Vault</title>")

    # 2. season name in the eyebrow
    h = h.replace("Season 4 &middot; Truth &amp; Trust &middot; Episode",
                  "Season 4 &middot; Harkness Dialogues &middot; Episode")
    h = h.replace("Season 4 · Truth &amp; Trust · Episode",
                  "Season 4 · Harkness Dialogues · Episode")

    # 3. page-top wrapper + corner logo (S4E1 only; S4E2 already has it)
    if '<div class="page-top">' not in h:
        m = re.search(r'^        <nav class="breadcrumb">\n(.*?)\n        </nav>$', h, re.S | re.M)
        inner = "\n".join("    " + l for l in m.group(1).split("\n"))
        h = h[:m.start()] + (
            '        <div class="page-top">\n'
            '            <nav class="breadcrumb">\n%s\n            </nav>\n'
            '            <a href="../../../../" aria-label="The Vault — home">'
            '<img class="corner-logo" src="../../../../images/brand/vault-icon.svg" alt="The Vault"></a>\n'
            '        </div>' % inner) + h[m.end():]

    # 4. oversized episode code in the h1
    h = re.sub(r'<h1>(?!<span class="ep-big">)', '<h1><span class="ep-big">%s</span> ' % p["code"], h, count=1)

    # 5. drop the Chipp row from the documents list -- a bot is not a document
    h = re.sub(r'\n *<li>\n(?:(?! *</li>).)*?\.on\.chipp\.ai.*?\n *</li>', '', h, flags=re.S)

    # 6. the standard Gem call to action, after the question box
    if 'class="gem-link"' not in h:
        m = re.search(r'^        <div class="question-box">\n.*?\n        </div>\n$', h, re.S | re.M)
        h = h[:m.end()] + "\n" + B.gemblock(p) + "\n" + h[m.end():]

    # 7. prev / next, immediately before the footer
    if 'class="ep-nav"' not in h:
        h = h.replace('\n        <footer class="site-footer">',
                      "\n" + B.navlinks(p) + '\n\n        <footer class="site-footer">')

    # 8. footer
    h = re.sub(r'<footer class="site-footer">.*?</footer>',
               '<footer class="site-footer">AI Literacy Course &middot; Season 4 &middot; 2026</footer>', h)

    f.write_text(h, encoding="utf-8")
    print("%-42s %s" % (slug, "patched" if h != before else "UNCHANGED"))
    for probe in ("chipp", "Perth", "ep-nav", "gem-link", "corner-logo", "ep-big"):
        print("     %-12s %d" % (probe, h.lower().count(probe.lower())))
