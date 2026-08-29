#!/usr/bin/env python3
"""Build the CS GCSE practice library from the PG Online (Paul Long) J277 pack.

Whitelist-only (privacy gate): every published file is named explicitly below.
Source: blank publisher Question Templates on the Orange — verified free of
student work and school metadata before listing (author metadata: Paul Long).
The TCP/IP-model extension template is deliberately excluded (off-spec).

Does three things, all idempotent:
  1. converts each whitelisted docx -> PDF in worksheets/cs/<page-slug>/
  2. writes worksheets/cs/index.html + one index.html per topic folder
  3. injects a 'Practice' section (between markers) into each CS topic page
Prints the whitelist for appending to _build/publish-safety-log.md.
"""
import html, os, re, subprocess, sys

ROOT = os.path.expanduser('~/rawsonvault')
SRC = '/media/alex/orange_2tb/Alex Teaching/Digital Textbooks/GCSE Computer Science - Paul Long/OCR'
P_START, P_END = '<!-- PRACTICE:START -->', '<!-- PRACTICE:END -->'

# page slug -> (page title, [(chapter dir, docx, pdf name, display name), ...])
PAGES = {
    '1-1-systems-architecture': ('§1.1 Systems Architecture', [
        ('Chapter 1 - Computer Hardware', '1-1 - Question Template.docx', 'hardware-questions.pdf', 'Hardware'),
        ('Chapter 1 - Computer Hardware', '1-2 - Question Template.docx', 'central-processing-unit-questions.pdf', 'Central Processing Unit'),
        ('Chapter 1 - Computer Hardware', '1-5 - Question Template.docx', 'embedded-systems-questions.pdf', 'Embedded Systems'),
    ]),
    '1-2-memory-storage': ('§1.2 Memory and Storage', [
        ('Chapter 1 - Computer Hardware', '1-3 - Question Template.docx', 'main-memory-questions.pdf', 'Main Memory'),
        ('Chapter 1 - Computer Hardware', '1-4 - Question Template.docx', 'secondary-storage-questions.pdf', 'Secondary Storage'),
        ('Chapter 1 - Computer Hardware', '3-2 - Question Template.docx', 'memory-extra-questions.pdf', 'Memory (extra set)'),
        ('Chapter 2 - Data Representation', '2-1 - Question Template.docx', 'units-of-information-questions.pdf', 'Units of Information'),
        ('Chapter 2 - Data Representation', '2-2 - Question Template.docx', 'number-bases-questions.pdf', 'Number Bases'),
        ('Chapter 2 - Data Representation', '2-3 - Question Template.docx', 'converting-number-bases-questions.pdf', 'Converting between Number Bases'),
        ('Chapter 2 - Data Representation', '2-4 - Question Template.docx', 'binary-arithmetic-questions.pdf', 'Binary Arithmetic'),
        ('Chapter 2 - Data Representation', '2-5 - Question Template.docx', 'character-sets-questions.pdf', 'Character Sets'),
        ('Chapter 2 - Data Representation', '2-6 - Question Template.docx', 'representing-images-questions.pdf', 'Representing Images'),
        ('Chapter 2 - Data Representation', '2-7 - Question Template.docx', 'representing-sound-questions.pdf', 'Representing Sound'),
        ('Chapter 2 - Data Representation', '2-8 - Question Template.docx', 'data-compression-questions.pdf', 'Data Compression'),
    ]),
    '1-3-networks': ('§1.3 Computer Networks, Connections and Protocols', [
        ('Chapter 3 - Networks and Security', '3-1 - Question Template.docx', 'network-structures-questions.pdf', 'Network Structures'),
        ('Chapter 3 - Networks and Security', '3-2 - Question Template.docx', 'network-protocols-questions.pdf', 'Network Protocols'),
        ('Chapter 3 - Networks and Security', '3-3 - Question Template.docx', 'the-internet-questions.pdf', 'The Internet'),
    ]),
    '1-4-network-security': ('§1.4 Network Security', [
        ('Chapter 3 - Networks and Security', '3-4 - Question Template.docx', 'cyber-security-threats-questions.pdf', 'Cyber Security Threats'),
        ('Chapter 3 - Networks and Security', '3-5 - Question Template.docx', 'detecting-preventing-threats-questions.pdf', 'Detecting and Preventing Threats'),
    ]),
    '1-5-systems-software': ('§1.5 Systems Software', [
        ('Chapter 4 - Systems Software', '4-1 - Question Template.docx', 'hardware-and-software-questions.pdf', 'Hardware and Software'),
        ('Chapter 4 - Systems Software', '4-2 - Question Template.docx', 'operating-systems-questions.pdf', 'Operating Systems'),
        ('Chapter 4 - Systems Software', '4-3 - Question Template.docx', 'utility-programs-questions.pdf', 'Utility Programs'),
    ]),
    '1-6-impacts': ('§1.6 Ethical, Legal, Cultural and Environmental Impacts', [
        ('Chapter 5 - Ethics and Society', '5-1 - Question Template.docx', 'software-ownership-questions.pdf', 'Software Ownership'),
        ('Chapter 5 - Ethics and Society', '5-2 - Question Template.docx', 'privacy-issues-questions.pdf', 'Privacy Issues'),
        ('Chapter 5 - Ethics and Society', '5-3 - Question Template.docx', 'environmental-issues-questions.pdf', 'Environmental Issues'),
        ('Chapter 5 - Ethics and Society', '5-4 - Question Template.docx', 'cultural-and-ethical-issues-questions.pdf', 'Cultural and Ethical Issues'),
    ]),
    '2-1-algorithms': ('§2.1 Algorithms', [
        ('Chapter 6 - Algorithms', '6-1 - Question Template.docx', 'representing-algorithms-questions.pdf', 'Representing Algorithms'),
        ('Chapter 6 - Algorithms', '6-2 - Question Template.docx', 'understanding-algorithms-questions.pdf', 'Understanding Algorithms'),
        ('Chapter 6 - Algorithms', '6-3 - Question Template.docx', 'searching-algorithms-questions.pdf', 'Searching Algorithms'),
        ('Chapter 6 - Algorithms', '6-4 - Question Template.docx', 'sorting-algorithms-questions.pdf', 'Sorting Algorithms'),
    ]),
    '2-2-programming': ('§2.2 Programming Fundamentals', [
        ('Chapter 7 - Programming', '7-1 - Question Template.docx', 'working-with-data-questions.pdf', 'Working with Data'),
        ('Chapter 7 - Programming', '7-2 - Question Template.docx', 'data-types-questions.pdf', 'Data Types'),
        ('Chapter 7 - Programming', '7-3 - Question Template.docx', 'arithmetic-operations-questions.pdf', 'Arithmetic Operations'),
        ('Chapter 7 - Programming', '7-4 - Question Template.docx', 'string-manipulation-questions.pdf', 'String Manipulation'),
        ('Chapter 7 - Programming', '7-5 - Question Template.docx', 'programming-concepts-questions.pdf', 'Programming Concepts'),
        ('Chapter 7 - Programming', '7-6 - Question Template.docx', 'using-lists-questions.pdf', 'Using Lists of Data'),
        ('Chapter 7 - Programming', '7-7 - Question Template.docx', 'subroutines-questions.pdf', 'Subroutines'),
    ]),
    '2-3-robust-programs': ('§2.3 Producing Robust Programs', [
        ('Chapter 8 - Robust Systems', '8-1 - Question Template.docx', 'defensive-design-questions.pdf', 'Defensive Design'),
        ('Chapter 8 - Robust Systems', '8-2 - Question Template.docx', 'maintainability-questions.pdf', 'Maintainability of Code'),
        ('Chapter 8 - Robust Systems', '8-3 - Question Template.docx', 'testing-questions.pdf', 'Testing'),
    ]),
    '2-4-boolean-logic': ('§2.4 Boolean Logic', [
        ('Chapter 9 - Boolean Logic', '9-1 - Question Template.docx', 'boolean-logic-questions.pdf', 'Boolean Logic'),
    ]),
    '2-5-languages-ides': ('§2.5 Programming Languages and IDEs', [
        ('Chapter 10 - Programming Languages', '10-1 - Question Template.docx', 'levels-of-language-questions.pdf', 'Levels of Programming Language'),
        ('Chapter 10 - Programming Languages', '10-2 - Question Template.docx', 'translators-questions.pdf', 'Translators'),
        ('Chapter 10 - Programming Languages', '10-3 - Question Template.docx', 'ide-questions.pdf', 'Integrated Development Environment'),
    ]),
}

WS_STYLE = '''    <style>
        .ws-list { list-style: none; margin: var(--gap-md) 0 var(--gap-lg); }
        .ws-item { display: flex; align-items: baseline; gap: 1rem; padding: var(--gap-xs) 0; border-bottom: 1px solid #f0ece4; }
        .ws-link { font-family: var(--font-body); font-size: 0.9rem; color: var(--ink-black); text-decoration: none; flex: 1; }
        .ws-link:hover { color: var(--bronze-dark, #7a4000); text-decoration: underline; }
        .ws-count { font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray-mid); margin-bottom: var(--gap-md); }
        .ws-related { font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-dark); margin: var(--gap-md) 0; padding: var(--gap-sm) var(--gap-md); background: #fdf9f4; border-left: 3px solid var(--bronze-light); }
        .ws-related a { color: var(--ink-black); }
        .ws-related-label { font-family: var(--font-display); font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gray-mid); margin-right: 0.5em; }
    </style>'''

HEAD = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{css}">
{style}</head>'''

CREDIT = ('Question sets from the PG Online (Paul Long) OCR J277 textbook pack. '
          'Used under the school site licence. Blank publisher templates only.')


def convert_pdfs():
    converted = []
    for slug, (_, sets) in PAGES.items():
        outdir = os.path.join(ROOT, 'worksheets/cs', slug)
        os.makedirs(outdir, exist_ok=True)
        for chapter, docx, pdf, _ in sets:
            src = os.path.join(SRC, chapter, 'Question Template', docx)
            dest = os.path.join(outdir, pdf)
            if not os.path.exists(dest):
                r = subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf',
                                    '--outdir', outdir, src], capture_output=True, text=True)
                produced = os.path.join(outdir, docx[:-5] + '.pdf')
                if os.path.exists(produced):
                    os.rename(produced, dest)
                else:
                    print(f'CONVERT FAIL: {src}\n{r.stderr[:200]}', file=sys.stderr)
                    continue
            converted.append((dest.replace(ROOT + '/', ''), os.path.join(chapter, 'Question Template', docx)))
    return converted


def topic_index(slug, title, sets):
    items = '\n'.join(
        f'            <li class="ws-item">\n'
        f'              <a class="ws-link" href="{pdf}">{html.escape(disp)} questions</a>\n'
        f'            </li>' for _, _, pdf, disp in sets)
    n = len(sets)
    return f'''{HEAD.format(title=f'{title} Practice — GCSE CS', css='../../../vault.css', style=WS_STYLE + chr(10))}
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../">The Vault</a><span>·</span>
            <a href="../../">Worksheets</a><span>·</span>
            <a href="../">Computer Science</a><span>·</span>
            {html.escape(title)}
        </nav>
        <div class="section-header">
            <span class="eyebrow">Worksheet Library · Computer Science · OCR J277</span>
            <h1>{html.escape(title)}</h1>
            <p class="subtitle">Practice question sets, printable PDFs.</p>
        </div>
        <div class="rule--full"></div>
        <p class="ws-count">{n} question set{'s' if n != 1 else ''}</p>
        <div class="ws-related">
            <span class="ws-related-label">Related topic page:</span> <a href="../../../cs/gcse/{slug}/">{html.escape(title)}</a>
        </div>
        <ul class="ws-list">
{items}
        </ul>
        <p class="ws-related">{CREDIT}</p>
        <footer class="site-footer">The Vault · CS Practice · {html.escape(title)} · 2026</footer>
    </div>
</body>
</html>
'''


def subject_index():
    cards = '\n'.join(f'''            <a class="nav-card" href="{slug}/">
                <span class="card-eyebrow">CS Practice</span>
                <span class="card-title">{html.escape(title)}</span>
                <span class="card-desc">{len(sets)} question set{'s' if len(sets) != 1 else ''} from the PG Online J277 pack.</span>
                <span class="card-arrow">Open →</span>
            </a>''' for slug, (title, sets) in PAGES.items())
    total = sum(len(s) for _, s in PAGES.values())
    return f'''{HEAD.format(title='Computer Science Worksheets', css='../../vault.css', style='')}
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../">The Vault</a><span>·</span>
            <a href="../">Worksheets</a><span>·</span>
            Computer Science Worksheets
        </nav>
        <div class="section-header">
            <span class="eyebrow">Worksheet Library · Computer Science</span>
            <h1>Computer Science Worksheets</h1>
            <p class="subtitle">{total} practice question sets across the 11 OCR J277 sub-topics.</p>
        </div>
        <div class="rule--full"></div>
        <div class="nav-grid">
{cards}
        </div>
        <p style="font-family: var(--font-body); font-size: 0.85rem; color: var(--gray-mid); font-style: italic;">{CREDIT}</p>
        <footer class="site-footer">The Vault · Worksheet Library · Computer Science · 2026</footer>
    </div>
</body>
</html>
'''


def inject_practice():
    for slug, (title, sets) in PAGES.items():
        path = os.path.join(ROOT, 'cs/gcse', slug, 'index.html')
        content = open(path).read()
        n = len(sets)
        blk = (f'{P_START}\n<div class="rule--full"></div>\n<h2>Practice</h2>\n'
               f'<ul class="linking">\n'
               f'<li><a href="../../../worksheets/cs/{slug}/">{html.escape(title)} practice questions</a>'
               f' — {n} printable question set{"s" if n != 1 else ""} from the PG Online textbook pack</li>\n'
               f'</ul>\n{P_END}')
        if P_START in content:
            content = re.sub(re.escape(P_START) + '.*?' + re.escape(P_END), blk, content, flags=re.S)
        else:
            content = content.replace('        <footer class="site-footer">',
                                      blk + '\n        <footer class="site-footer">', 1)
        open(path, 'w').write(content)


converted = convert_pdfs()
for slug, (title, sets) in PAGES.items():
    p = os.path.join(ROOT, 'worksheets/cs', slug, 'index.html')
    open(p, 'w').write(topic_index(slug, title, sets))
open(os.path.join(ROOT, 'worksheets/cs/index.html'), 'w').write(subject_index())
inject_practice()
print(f'{len(converted)} PDFs in place; 11 topic indexes + subject index written; Practice sections injected.')
print('\nWhitelist (for publish-safety-log.md):')
for dest, src in converted:
    print(f'- ✅ `{dest}` ← `{src}`')
