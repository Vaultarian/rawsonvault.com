#!/usr/bin/env python3
"""Inject 'Video Support' sections into CS GCSE topic pages.

Same idempotent marker pattern as inject_videos.py (Physics). Every ID in
_build/cs_videos.json was verified via YouTube oEmbed (HTTP 200 + author
check: Craig'n'Dave) before entering the file.
"""
import json, html, re, os

ROOT = os.path.expanduser('~/rawsonvault')
DATA = json.load(open(os.path.join(ROOT, '_build/cs_videos.json')))
V_START, V_END = '<!-- VIDEO-SUPPORT:START -->', '<!-- VIDEO-SUPPORT:END -->'


def cell(vid):
    t = html.escape(vid['title'])
    return ('<figure class="video-cell">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/{vid["id"]}" '
            f'title="{t}" loading="lazy" allowfullscreen '
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>'
            f'<figcaption>{t}</figcaption></figure>')


def playlist_cell(pl):
    t = html.escape(pl['title'])
    return ('<figure class="video-cell">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/videoseries?list={pl["list"]}" '
            f'title="{t}" loading="lazy" allowfullscreen '
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>'
            f'<figcaption>{t}</figcaption></figure>')


def block(slug):
    rows = []
    pls = DATA['playlists'].get(slug, [])
    if pls:
        rows.append('<div class="video-source-label">Craig\'n\'Dave — OCR J277</div>\n'
                    '<div class="video-grid">\n' +
                    '\n'.join(playlist_cell(p) for p in pls) + '\n</div>')
    vids = DATA['videos'].get(slug, [])
    if vids:
        rows.append('<div class="video-source-label">Craig\'n\'Dave — OCR J277</div>\n'
                    '<div class="video-grid">\n' +
                    '\n'.join(cell(v) for v in vids) + '\n</div>')
    if not rows:
        return None
    return (f'{V_START}\n<div class="rule--full"></div>\n<h2>Video Support</h2>\n' +
            '\n'.join(rows) + f'\n{V_END}')


changed = 0
slugs = set(DATA['playlists']) | set(DATA['videos'])
for slug in sorted(slugs):
    path = os.path.join(ROOT, 'cs/gcse', slug, 'index.html')
    content = open(path).read()
    blk = block(slug)
    if V_START in content:
        content = re.sub(re.escape(V_START) + '.*?' + re.escape(V_END), blk, content, flags=re.S)
    else:
        content = content.replace('        <footer class="site-footer">',
                                  blk + '\n        <footer class="site-footer">', 1)
    open(path, 'w').write(content)
    changed += 1
print(f'updated {changed} CS topic pages')
