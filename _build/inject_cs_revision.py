#!/usr/bin/env python3
"""Inject a 'Revision' section into CS GCSE topic pages.

Same idempotent marker pattern as inject_cs_videos.py. One block per
sub-topic: three videos from three different channels, then the practice
links for that sub-topic.

Every video ID in _build/cs_videos.json['revision'] was verified via
YouTube oEmbed (HTTP 200 + author_name recorded alongside it) and every
practice link returned HTTP 200, on 2026-09-14. All sources are free to
view with no login and no paywall -- the standing third-party rule.
"""
import json, html, re, os

ROOT = os.path.expanduser('~/rawsonvault')
DATA = json.load(open(os.path.join(ROOT, '_build/cs_videos.json')))
R_START, R_END = '<!-- REVISION:START -->', '<!-- REVISION:END -->'


def cell(v):
    t = html.escape(v['title'])
    a = html.escape(v['author'])
    return ('<figure class="video-cell">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/{v["id"]}" '
            f'title="{t} ({a})" loading="lazy" allowfullscreen '
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>'
            f'<figcaption>{t}<span class="video-author">{a}</span></figcaption></figure>')


def links(ls):
    if not ls:
        return ''
    items = ' &middot; '.join(
        f'<a href="{html.escape(l["url"])}" target="_blank" rel="noopener">'
        f'{html.escape(l["title"])}</a> <span class="revise-source">{html.escape(l["source"])}</span>'
        for l in ls)
    return f'<p class="revise-links"><span class="revise-practise">Practise</span>{items}</p>'


def block(slug):
    blocks = DATA.get('revision', {}).get(slug, [])
    if not blocks:
        return None
    out = [R_START, '<div class="rule--full"></div>', '<h2>Revision</h2>',
           '<p class="revise-intro">Three explanations of each idea, from three different '
           'teachers &mdash; if one does not land, try the next. Then practise it.</p>']
    for b in blocks:
        out.append('<section class="revise-block">')
        out.append(f'<h3>{html.escape(b["title"])}'
                   f'<span class="revise-spec">{html.escape(b["spec"])}</span></h3>')
        if b.get('blurb'):
            out.append(f'<p class="revise-blurb">{html.escape(b["blurb"])}</p>')
        out.append('<div class="video-grid">')
        out.extend(cell(v) for v in b['videos'])
        out.append('</div>')
        out.append(links(b.get('links', [])))
        out.append('</section>')
    foot = DATA.get('revision_footer', {}).get(slug)
    if foot:
        out.append('<section class="revise-block revise-block--footer">')
        out.append(f'<h3>{html.escape(foot["title"])}</h3>')
        out.append('<div class="video-grid video-grid--single">' + cell(foot['video']) + '</div>')
        out.append('</section>')
    out.append('<p class="revise-credit">Videos remain on their creators\' YouTube channels and '
               'are embedded, not copied. Practice pages link out to their own sites. '
               'Craig\'n\'Dave &middot; Mr Moore &middot; CSNewbs &middot; 101 Computing.</p>')
    out.append(R_END)
    return '\n'.join(out)


changed = 0
for slug in sorted(DATA.get('revision', {})):
    path = os.path.join(ROOT, 'cs/gcse', slug, 'index.html')
    content = open(path).read()
    blk = block(slug)
    if R_START in content:
        new = re.sub(re.escape(R_START) + '.*?' + re.escape(R_END), lambda m: blk, content, flags=re.S)
    else:
        # sits directly under the progress panel, above the article prose
        anchor = '<!-- PROGRESS:END -->'
        assert anchor in content, f'no anchor in {slug}'
        new = content.replace(anchor, anchor + '\n' + blk, 1)
    if new != content:
        open(path, 'w').write(new)
        changed += 1
        print(f'[revision] {slug}: written')
print(f'[revision] {changed} page(s) changed')
