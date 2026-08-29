#!/usr/bin/env python3
"""Inject 'Diagrams' sections into CS GCSE topic pages.

Idempotent: content lives between HTML markers and is replaced on re-run
(same pattern as inject_videos.py). Image files are curated extracts from
the PG Online (Paul Long) OCR J277 textbook pack on the Orange, placed in
cs/gcse/<slug>/img/ and published under the school site licence.
"""
import json, html, re, os

ROOT = os.path.expanduser('~/rawsonvault')
DATA = json.load(open(os.path.join(ROOT, '_build/diagrams.json')))
CREDIT = DATA.pop('_credit')

D_START, D_END = '<!-- TEXTBOOK-DIAGRAMS:START -->', '<!-- TEXTBOOK-DIAGRAMS:END -->'
ANCHOR = re.compile(r'(\s*<div class="rule--full"></div>\s*<h2>Linking questions</h2>)')


def figure(slug, item):
    alt = html.escape(item['alt'], quote=True)
    cap = html.escape(item['caption'])
    return (f'<figure class="diagram-figure">'
            f'<img src="img/{item["file"]}" alt="{alt}" loading="lazy">'
            f'<figcaption>{cap}</figcaption></figure>')


def block(slug, items):
    figs = '\n'.join(figure(slug, i) for i in items)
    return (f'{D_START}\n<div class="rule--full"></div>\n<h2>Diagrams</h2>\n'
            f'{figs}\n<p class="diagram-credit">{html.escape(CREDIT)}</p>\n{D_END}')


changed = 0
for slug, items in DATA.items():
    path = os.path.join(ROOT, 'cs/gcse', slug, 'index.html')
    content = open(path).read()
    blk = block(slug, items)
    if D_START in content:
        content = re.sub(re.escape(D_START) + '.*?' + re.escape(D_END), blk, content, flags=re.S)
    else:
        m = ANCHOR.search(content)
        if not m:
            print(f'SKIP {slug}: no anchor found')
            continue
        content = content[:m.start(1)] + '\n' + blk + m.group(1) + content[m.end(1):]
    open(path, 'w').write(content)
    changed += 1
print(f'updated {changed} CS topic pages')
