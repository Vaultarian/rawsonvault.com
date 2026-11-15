#!/usr/bin/env python3
"""Inject an 'Animations' section into topic pages (link-and-embed, never hosted).

Source data and its verification record: _build/animations.json.
Idempotent: the section lives between <!-- ANIMATIONS:START/END --> markers and is replaced on
re-run; on a first run it is inserted above Video Support (or above the footer).

LICENCE POSTURE: Dan Russell's animations are CC BY-NC-ND 4.0. We neither copy nor adapt them.
Each item links to the file on Penn State's server, and Penn State's own page is embedded
unaltered in a sandboxed, lazy iframe, with the credit and licence link under it.
Declares each file it writes with a 'PUBLISH: <repo-relative path>' line (Tim's scoped commit).
Stdlib only, so it runs on the host as well as in Tim's pod.
"""
import json, html, os, re

ROOT = os.environ.get('RAWSON_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, '_build/animations.json')))
SRC = DATA['source']

A_START, A_END = '<!-- ANIMATIONS:START -->', '<!-- ANIMATIONS:END -->'
V_START = '<!-- VIDEO-SUPPORT:START -->'
FOOTER = '        <footer class="site-footer">'


def block(items):
    esc = html.escape
    lis = '\n'.join(
        f'<li><a href="{esc(SRC["base"] + i["file"])}" target="_blank" rel="noopener noreferrer">'
        f'{esc(i["title"])}</a> — {esc(i["text"])}</li>' for i in items)
    credit = (f'Animations by {esc(SRC["author"])}, {esc(SRC["affiliation"])}, licensed '
              f'<a href="{esc(SRC["licence_url"])}" target="_blank" rel="noopener noreferrer">{esc(SRC["licence"])}</a>. '
              'Shown by embedding the author\'s own page, unaltered; nothing is copied to this site. '
              'Removed on request.')
    return (f'{A_START}\n<div class="rule--full"></div>\n<h2>Animations</h2>\n'
            f'<div class="video-source-label">{esc(SRC["label"])}</div>\n'
            f'<p>Open the full set on <a href="{esc(SRC["page"])}" target="_blank" rel="noopener noreferrer">'
            f'{esc(SRC["author"])}\'s Wave Motion page (Penn State)</a>, or open any single animation below.</p>\n'
            f'<ul class="linking">\n{lis}\n</ul>\n'
            '<figure class="video-cell">'
            f'<iframe src="{esc(SRC["page"])}" title="Wave Motion animations, {esc(SRC["author"])}, Penn State" '
            'loading="lazy" sandbox="" referrerpolicy="no-referrer" '
            'style="aspect-ratio:auto;height:640px;background:#fff"></iframe>'
            f'<figcaption>{credit}</figcaption></figure>\n{A_END}')


def upsert(content, blk):
    if A_START in content:
        return re.sub(re.escape(A_START) + '.*?' + re.escape(A_END), lambda m: blk, content, flags=re.S)
    for anchor in (V_START, FOOTER):
        if anchor in content:
            return content.replace(anchor, blk + '\n' + anchor, 1)
    raise SystemExit('no insertion point (Video Support marker or footer) found')


changed = 0
for topic, t in DATA['topics'].items():
    rel = os.path.join(t['page'], 'index.html')
    path = os.path.join(ROOT, rel)
    content = open(path).read()
    new = upsert(content, block(t['items']))
    if new != content:
        open(path, 'w').write(new)
        changed += 1
    print(f'PUBLISH: {rel}')
print(f'updated {changed} topic page(s)')
