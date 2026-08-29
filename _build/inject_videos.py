#!/usr/bin/env python3
"""Inject 'Video Support' and 'Lab Library' sections into Physics topic pages.

Idempotent: content lives between HTML markers and is replaced on re-run.
All video IDs in _build/videos.json were verified via YouTube oEmbed
(HTTP 200 + channel author check) before entering the file.
"""
import json, html, re, os

ROOT = os.path.expanduser('~/rawsonvault')
DATA = json.load(open(os.path.join(ROOT, '_build/videos.json')))

PAGES = {
    'A1': 'physics/dp/theme-a/a1-kinematics', 'A2': 'physics/dp/theme-a/a2-forces-momentum',
    'A3': 'physics/dp/theme-a/a3-work-energy-power', 'A4': 'physics/dp/theme-a/a4-rigid-body',
    'A5': 'physics/dp/theme-a/a5-special-relativity', 'B1': 'physics/dp/theme-b/b1-thermal-energy',
    'B2': 'physics/dp/theme-b/b2-greenhouse', 'B3': 'physics/dp/theme-b/b3-gas-laws',
    'B4': 'physics/dp/theme-b/b4-thermodynamics', 'B5': 'physics/dp/theme-b/b5-circuits',
    'C1': 'physics/dp/theme-c/c1-shm', 'C2': 'physics/dp/theme-c/c2-wave-model',
    'C3': 'physics/dp/theme-c/c3-wave-phenomena', 'C4': 'physics/dp/theme-c/c4-standing-waves',
    'C5': 'physics/dp/theme-c/c5-doppler', 'D1': 'physics/dp/theme-d/d1-gravitational',
    'D2': 'physics/dp/theme-d/d2-electric-magnetic', 'D3': 'physics/dp/theme-d/d3-em-motion',
    'D4': 'physics/dp/theme-d/d4-induction', 'E1': 'physics/dp/theme-e/e1-structure-atom',
    'E2': 'physics/dp/theme-e/e2-quantum', 'E3': 'physics/dp/theme-e/e3-radioactive',
    'E4': 'physics/dp/theme-e/e4-fission', 'E5': 'physics/dp/theme-e/e5-fusion-stars',
    'P1': 'physics/aqa-gcse/p1-energy', 'P2': 'physics/aqa-gcse/p2-electricity',
    'P3': 'physics/aqa-gcse/p3-particle-model', 'P4': 'physics/aqa-gcse/p4-atomic-structure',
    'P5': 'physics/aqa-gcse/p5-forces', 'P6': 'physics/aqa-gcse/p6-waves',
    'P7': 'physics/aqa-gcse/p7-magnetism',
}

SOURCES = [
    ('khan', 'Khan Academy'),
    ('flipping', 'Flipping Physics'),
    ('oct', 'The Organic Chemistry Tutor'),
    ('dewitt', 'Tyler DeWitt'),
    ('vanbiezen', 'Michel van Biezen'),
    ('wny', 'WNY Tutor — worked problems'),
]

PLAYLIST_SOURCES = [
    ('anderson', 'Physics with Professor Matt Anderson — full course modules'),
    ('wny_playlists', 'WNY Tutor — worked-problem sets'),
]

# Lab Library section anchor per topic (labs page)
LAB_LINKS = {
    'A1': [('motion', 'Motion & Kinematics labs')],
    'A2': [('forces', 'Forces & Circular Motion labs')],
    'A3': [('energy-momentum', 'Energy & Momentum labs')],
    'A4': [('forces', 'Forces & Circular Motion labs')],
    'B1': [('thermal', 'Thermal labs')],
    'B5': [('electricity-magnetism', 'Electricity & Magnetism labs')],
    'C1': [('oscillations', 'Oscillations & SHM labs')],
    'C2': [('waves-sound-light', 'Waves, Sound & Light labs')],
    'C4': [('waves-sound-light', 'Waves, Sound & Light labs')],
    'C5': [('waves-sound-light', 'Waves, Sound & Light labs')],
    'D2': [('electricity-magnetism', 'Electricity & Magnetism labs')],
    'D4': [('electricity-magnetism', 'Electricity & Magnetism labs')],
    'P1': [('energy-momentum', 'Energy & Momentum labs'), ('thermal', 'Thermal labs')],
    'P2': [('electricity-magnetism', 'Electricity & Magnetism labs')],
    'P3': [('thermal', 'Thermal labs')],
    'P5': [('motion', 'Motion & Kinematics labs'), ('forces', 'Forces & Circular Motion labs')],
    'P6': [('waves-sound-light', 'Waves, Sound & Light labs')],
    'P7': [('electricity-magnetism', 'Electricity & Magnetism labs')],
}

V_START, V_END = '<!-- VIDEO-SUPPORT:START -->', '<!-- VIDEO-SUPPORT:END -->'
L_START, L_END = '<!-- LAB-LINKS:START -->', '<!-- LAB-LINKS:END -->'


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


def video_block(topic):
    rows = []
    for key, label in SOURCES:
        vids = DATA.get(key, {}).get(topic, [])
        if vids:
            rows.append(f'<div class="video-source-label">{label}</div>\n'
                        '<div class="video-grid">\n' +
                        '\n'.join(cell(v) for v in vids) + '\n</div>')
    for key, label in PLAYLIST_SOURCES:
        pls = DATA.get(key, {}).get(topic, [])
        if pls:
            rows.append(f'<div class="video-source-label">{label}</div>\n'
                        '<div class="video-grid">\n' +
                        '\n'.join(playlist_cell(p) for p in pls) + '\n</div>')
    if not rows:
        return None
    return (f'{V_START}\n<div class="rule--full"></div>\n<h2>Video Support</h2>\n' +
            '\n'.join(rows) + f'\n{V_END}')


def lab_block(topic, depth):
    links = LAB_LINKS.get(topic)
    if not links:
        return None
    rel = '../' * depth + 'labs/'
    items = '\n'.join(
        f'<li><a href="{rel}#{anchor}">{html.escape(label)}</a> — instruction sheets from the Physics Lab Library</li>'
        for anchor, label in links)
    return (f'{L_START}\n<div class="rule--full"></div>\n<h2>Labs</h2>\n'
            f'<ul class="linking">\n{items}\n</ul>\n{L_END}')


def upsert(content, start, end, block):
    if start in content:
        return re.sub(re.escape(start) + '.*?' + re.escape(end), block, content, flags=re.S)
    # insert before the footer
    return content.replace('        <footer class="site-footer">',
                           block + '\n        <footer class="site-footer">', 1)


changed = 0
for topic, rel in PAGES.items():
    path = os.path.join(ROOT, rel, 'index.html')
    content = open(path).read()
    depth = rel.count('/') + 1
    # labs first so Video Support lands at the very bottom of the page
    for block in (lab_block(topic, depth), video_block(topic)):
        if block:
            content = upsert(content, block.split('\n', 1)[0], block.rsplit('\n', 1)[1], block)
    open(path, 'w').write(content)
    changed += 1
print(f'updated {changed} topic pages')
