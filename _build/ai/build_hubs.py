# -*- coding: utf-8 -*-
"""Rebuild the four season hubs, the lesson-stub hub, and the students index."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from manifest import P, SEASONS

ROOT = pathlib.Path(__file__).resolve().parents[2] / "ai/students"

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{up}vault.css">{style}
</head>

<body class="ai-page">
    <div class="container">

        <div class="page-top">
            <nav class="breadcrumb">
                <a href="{up}">The Vault</a><span>&middot;</span>
                <a href="../../">AI</a><span>&middot;</span>
                <a href="../">Students</a><span>&middot;</span>
                {crumb}
            </nav>
            <a href="{up}" aria-label="The Vault — home"><img class="corner-logo" src="{up}images/brand/vault-icon.svg" alt="The Vault"></a>
        </div>

        <div class="section-header">
            <span class="eyebrow">{eyebrow}</span>
            <h1>{h1}</h1>
            <p class="subtitle">{subtitle}</p>
        </div>

        <div class="rule--full"></div>

{rows}
        <footer class="site-footer">{foot}</footer>

    </div>
</body>
</html>
"""

ROW = """        <a class="ep-row" href="{href}">
            <span class="ep-code">{code}</span>
            <span>
                <span class="ep-title">{title}</span>
                <span class="ep-sub">{sub}</span>
            </span>
        </a>

"""

# ------------------------------------------------------------- season hubs
for n in (1, 2, 3, 4):
    name, blurb = SEASONS[n]
    eps = [p for p in P if p.get("season") == n]
    rows = "".join(ROW.format(href=p["dir"].split("/")[1] + "/",
                              code="S%d &middot; E%d" % (n, p["epi"]),
                              title=p["title"], sub=p["subtitle"]) for p in eps)
    (ROOT / ("season-%d" % n) / "index.html").write_text(
        HEAD.format(title="Season %d &middot; %s — AI Literacy — The Vault" % (n, name),
                    up="../../../", style="", crumb="Season %d" % n,
                    eyebrow="AI Literacy Course &middot; Season %d" % n,
                    h1=name, subtitle=blurb, rows=rows,
                    foot="AI Literacy Course &middot; Season %d &middot; 2026" % n),
        encoding="utf-8")
    print("season-%d hub: %d episodes" % (n, len(eps)))

# --------------------------------------------------------------- stub hub
stubs = [p for p in P if p.get("stub")]
rows = "".join(ROW.format(href=p["dir"].split("/")[1] + "/", code="Stub",
                          title=p["title"], sub=p["subtitle"]) for p in stubs)
(ROOT / "stubs" / "index.html").write_text(
    HEAD.format(title="Lesson stubs — AI Literacy — The Vault", up="../../../",
                style="", crumb="Lesson stubs",
                eyebrow="AI Literacy Course", h1="Lesson stubs",
                subtitle="Written, usable, and honestly shorter than a full episode.",
                rows=('        <p class="about-text">These two sessions are real and they work, '
                      'but they are less developed than the seventeen numbered episodes. They are '
                      'kept here, labelled as what they are, rather than padded out to look equal '
                      'to the rest.</p>\n\n' + rows),
                foot="AI Literacy Course &middot; Lesson stubs &middot; 2026"),
    encoding="utf-8")
print("stub hub: %d stubs" % len(stubs))
