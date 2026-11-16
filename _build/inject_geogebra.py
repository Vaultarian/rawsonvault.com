#!/usr/bin/env python3
"""Inject a 'Simulations' section of embedded GeoGebra apps into topic pages (embed only, never hosted).

Source data and its verification record: _build/geogebra.json.
Idempotent: the section lives between <!-- GEOGEBRA:START/END --> markers and is replaced on re-run;
on a first run it is inserted above Labs (or Video Support, or the footer).

LICENCE POSTURE: each app runs from geogebra.org through GeoGebra's own embed route
(the applet-only /material/iframe/id/<id>/... form from GeoGebra's Share > Embed; it answers HTTP 410
to scripted fetches but loads in a browser, verified by headless-Chrome screenshot 16 Nov 2026), unaltered, with the author
named and linked under it. Nothing is copied to this site. Removed on request.
Declares each file it writes with a 'PUBLISH: <repo-relative path>' line (Tim's scoped commit).
Stdlib only, so it runs on the host as well as in Tim's pod.
"""
import json, html, os, re

ROOT = os.environ.get('RAWSON_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, '_build/geogebra.json')))

G_START, G_END = '<!-- GEOGEBRA:START -->', '<!-- GEOGEBRA:END -->'
ANCHORS = ('<!-- LAB-LINKS:START -->', '<!-- VIDEO-SUPPORT:START -->', '        <footer class="site-footer">')


def block(items):
    esc = html.escape
    cells = ''
    for i in items:
        page = f'https://www.geogebra.org/m/{i["id"]}'
        credit = (f'<strong>{esc(i["title"])}</strong> by '
                  f'<a href="{esc(i["author_url"])}" target="_blank" rel="noopener noreferrer">{esc(i["author"])}</a>, '
                  f'on <a href="{esc(page)}" target="_blank" rel="noopener noreferrer">GeoGebra</a>. '
                  f'{esc(i["text"])} Embedded from geogebra.org, unaltered; removed on request.')
        cells += ('<figure class="video-cell" style="max-width:'+str(i["width"]+2)+'px">'
                  f'<iframe src="https://www.geogebra.org/material/iframe/id/{esc(i["id"])}/width/{i["width"]}/height/{i["height"]}'
                  '/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/false/rc/false/ld/false/sdz/false/ctl/false" '
                  f'title="{esc(i["title"])}, {esc(i["author"])}, GeoGebra" '
                  'allowfullscreen referrerpolicy="strict-origin-when-cross-origin" '
                  f'style="width:100%;aspect-ratio:{i["width"]}/{i["height"]};height:auto;background:#fff;border:1px solid #e1e4e8">'
                  '</iframe>'
                  f'<figcaption>{credit}</figcaption></figure>\n')
    return (f'{G_START}\n<div class="rule--full"></div>\n<h2>Simulations</h2>\n'
            f'{cells}{G_END}')


def upsert(content, blk):
    if G_START in content:
        return re.sub(re.escape(G_START) + '.*?' + re.escape(G_END), lambda m: blk, content, flags=re.S)
    for anchor in ANCHORS:
        if anchor in content:
            return content.replace(anchor, blk + '\n' + anchor, 1)
    raise SystemExit('no insertion point (Labs, Video Support or footer) found')


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
