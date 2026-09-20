# -*- coding: utf-8 -*-
"""Render every AI Literacy episode page from the manifest."""
import re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from manifest import P, SEASONS

ROOT = pathlib.Path(__file__).resolve().parents[2] / "ai/students"
UP = "../../../../"


def grab(html, cls):
    """Return the 8-space-indented <div class="cls"> ... </div> block, inner text only."""
    m = re.search(r'^        <div class="%s">\n(.*?)\n        </div>$' % cls,
                  html, re.S | re.M)
    return m.group(1) if m else None


def objectives_html(items):
    li = "\n".join('                <li>%s</li>' % i for i in items)
    return '            <h2>What you\'ll be able to do</h2>\n            <ul>\n%s\n            </ul>' % li


def swap_objectives(article, items):
    """Replace the existing objectives h2+ul with a corrected one."""
    return re.sub(r"            <h2>What you'll be able to do</h2>\n            <ul>\n.*?\n            </ul>",
                  objectives_html(items), article, flags=re.S)


def add_objectives(article, items):
    """Insert an objectives block after the first paragraph run."""
    marker = "\n\n            <h2>"
    idx = article.find(marker)
    block = "\n\n" + objectives_html(items)
    return article[:idx] + block + article[idx:] if idx > -1 else article + block


def upgrade_sources(inner, note):
    """Rename the heading, add the trust note, tag the entries."""
    inner = re.sub(r'<h2>Readings</h2>', '<h2>Where these facts come from</h2>', inner)
    if 'trust-note' not in inner:
        inner = re.sub(r'(<h2>.*?</h2>\n)',
                       r'\1            <p class="trust-note">%s</p>\n' % note, inner, count=1)
    return inner


TRUST = ("Every source on this page was opened and checked before it went here. "
         "Click through and check anything you are about to rely on.")

# ------------------------------------------------------------------ nav chain
chain = [p for p in P if not p.get("stub")]
for i, p in enumerate(chain):
    p["_prev"] = chain[i - 1] if i else None
    p["_next"] = chain[i + 1] if i + 1 < len(chain) else None


def rel(frm, to):
    """Relative href from one page dir to another."""
    a, b = frm["dir"].split("/")[0], to["dir"].split("/")[0]
    slug = to["dir"].split("/")[1]
    return "../%s/" % slug if a == b else "../../%s/%s/" % (b, slug)


def navlinks(p):
    if p.get("stub"):
        return ('        <nav class="ep-nav">\n'
                '            <a class="ep-nav-prev" href="../">\n'
                '                <span class="ep-nav-dir">&larr; Back</span>\n'
                '                <span class="ep-nav-name">All lesson stubs</span>\n'
                '            </a>\n'
                '            <span></span>\n'
                '        </nav>')
    out = ['        <nav class="ep-nav">']
    if p["_prev"]:
        out.append('            <a class="ep-nav-prev" href="%s">\n'
                   '                <span class="ep-nav-dir">&larr; Previous</span>\n'
                   '                <span class="ep-nav-name">%s</span>\n'
                   '            </a>' % (rel(p, p["_prev"]), p["_prev"]["title"]))
    else:
        out.append('            <span></span>')
    if p["_next"]:
        out.append('            <a class="ep-nav-next" href="%s">\n'
                   '                <span class="ep-nav-dir">Next &rarr;</span>\n'
                   '                <span class="ep-nav-name">%s</span>\n'
                   '            </a>' % (rel(p, p["_next"]), p["_next"]["title"]))
    else:
        out.append('            <span></span>')
    out.append('        </nav>')
    return "\n".join(out)


def gemblock(p):
    if p.get("level0"):
        return ('        <div class="gem-link">\n'
                '            <p class="gem-note">This episode has no Gem, by design. '
                'It is the one session on the course that runs without AI in the room.</p>\n'
                '        </div>')
    if not p.get("gem"):
        return ""
    return ('        <div class="gem-link">\n'
            '            <a class="gem-btn" href="https://gemini.google.com/gem/%s" '
            'target="_blank" rel="noopener">Open the Gem &rarr;</a>\n'
            '            <p class="gem-note">Sign in with your St Leonards account to open this one.</p>\n'
            '        </div>' % p["gem"])


def header(p):
    if p.get("stub"):
        eyebrow = 'Lesson stub'
        crumb_parent = ('<a href="../">Lesson stubs</a>')
        big = ''
    else:
        eyebrow = 'Season %d &middot; %s &middot; Episode %d' % (
            p["season"], SEASONS[p["season"]][0], p["epi"])
        crumb_parent = '<a href="../">Season %d</a>' % p["season"]
        big = '<span class="ep-big">%s</span> ' % p["code"]
    badge = ('\n            <p class="stub-badge">Lesson stub &middot; shorter and less '
             'developed than a full episode</p>') if p.get("stub") else ''
    return crumb_parent, eyebrow, big, badge


def build(p):
    path = ROOT / p["dir"] / "index.html"
    old = path.read_text(encoding="utf-8") if path.exists() else ""

    # --- article -----------------------------------------------------------
    if p.get("article"):
        article = p["article"].strip("\n")
    else:
        article = grab(old, "article")
        if article is None:
            raise SystemExit("no article found for %s" % p["dir"])
        if p.get("objectives"):
            if "What you'll be able to do" in article:
                article = swap_objectives(article, p["objectives"])
            else:
                article = add_objectives(article, p["objectives"])
        # Chipp is retired; the bot is a Gem now.
        article = (article
                   .replace("my conversation with Chipp", "my conversation with the Gem")
                   .replace("Working with Chipp,", "Working with the Gem,")
                   .replace("Today's bot", "Today's Gem")
                   .replace("the bot will use it", "the Gem will use it"))

    # --- sources -----------------------------------------------------------
    if p.get("sources_html"):
        sources = p["sources_html"].strip("\n")
    else:
        inner = grab(old, "sources") or grab(old, "readings")
        sources = ('        <div class="sources">\n%s\n        </div>'
                   % upgrade_sources(inner, TRUST)) if inner else ""

    # --- documents (preserved if the page already had one) -----------------
    docs_inner = grab(old, "documents")
    docs = ('        <div class="documents">\n%s\n        </div>\n\n' % docs_inner) if docs_inner else ""

    crumb_parent, eyebrow, big, badge = header(p)

    question = ('        <div class="question-box">\n            %s\n        </div>\n\n'
                % p["question"]) if p.get("question") else ""

    vocab = ""
    if p.get("vocab"):
        rows = "\n".join('            <dt>%s</dt>\n            <dd>%s</dd>' % t for t in p["vocab"])
        vocab = ('        <div class="rule--full"></div>\n\n'
                 '        <h2>Key words</h2>\n        <dl class="vocab">\n%s\n        </dl>\n\n' % rows)

    gem = gemblock(p)
    gem = gem + "\n\n" if gem else ""
    src = sources + "\n\n" if sources else ""

    style = ""
    if p.get("level0"):
        style = ('\n    <style>\n'
                 '        .ai-page .article p.level-0 {\n'
                 '            border-left: 2px solid var(--bronze-light);\n'
                 '            padding-left: var(--gap-md);\n'
                 '            color: var(--gray-dark);\n'
                 '        }\n    </style>')

    foot = ("AI Literacy Course &middot; Lesson stub &middot; 2026" if p.get("stub")
            else "AI Literacy Course &middot; Season %d &middot; 2026" % p["season"])

    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{code} &middot; {title} — AI Literacy — The Vault</title>
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
                <a href="../../../">AI</a><span>&middot;</span>
                <a href="../../">Students</a><span>&middot;</span>
                {crumb_parent}<span>&middot;</span>
                {crumb}
            </nav>
            <a href="{up}" aria-label="The Vault — home"><img class="corner-logo" src="{up}images/brand/vault-icon.svg" alt="The Vault"></a>
        </div>

        <div class="section-header">
            <span class="eyebrow">{eyebrow}</span>
            <h1>{big}{title}</h1>
            <p class="subtitle">{subtitle}</p>{badge}
        </div>

        <div class="rule--full"></div>

{docs}        <div class="article">
{article}
        </div>

{question}{gem}{src}{vocab}{nav}

        <footer class="site-footer">{foot}</footer>

    </div>
</body>
</html>
""".format(code=p["code"], title=p["title"], up=UP, style=style,
           crumb_parent=crumb_parent, crumb=p["crumb"], eyebrow=eyebrow, big=big,
           subtitle=p["subtitle"], badge=badge, docs=docs, article=article,
           question=question, gem=gem, src=src, vocab=vocab, nav=navlinks(p), foot=foot)

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")
    return path


built = []
for p in P:
    if p.get("patch"):
        continue
    built.append(build(p))
print("rendered %d pages" % len(built))
for b in built:
    print("  ", b.relative_to(ROOT))
