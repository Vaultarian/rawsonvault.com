#!/usr/bin/env python3
"""Build the Physics Lab Library page from the curated whitelist.

Whitelist rule (from the handoff): instruction sheets, lab manuals, report
templates, and investigation planners ONLY. Anything bearing a student name,
GRADED marker, or assignsubmission path is hard-excluded. The full
include/exclude audit is written to _build/publish-safety-log.md.
"""
import os, shutil, re, html, datetime

ROOT = os.path.expanduser('~/rawsonvault')
ORANGE = '/media/alex/orange_2tb/Alex Teaching/Physics/Labs'
OUT = os.path.join(ROOT, 'labs')

# (section anchor, section title, [(source path relative to ORANGE, display title)])
SECTIONS = [
    ('motion', 'Motion & Kinematics', [
        ('01 Graph Matching.docx', 'Graph Matching'),
        ('02 Back and Forth Motion.docx', 'Back and Forth Motion'),
        ('03 Cart on a Ramp.docx', 'Cart on a Ramp'),
        ('04 Determining g on Incline.docx', 'Determining g on an Incline'),
        ('2021 Acceleration Down an Incline - Instructions.docx', 'Acceleration Down an Incline — Instructions'),
        ('05 Picket Fence Free Fall.docx', 'Picket Fence Free Fall'),
        ('06 Ball Toss.docx', 'Ball Toss'),
        ('07 Bungee Jump.docx', 'Bungee Jump Accelerations'),
        ('08 Projectile Motion.docx', 'Projectile Motion'),
        ('21 Accel in Real World.docx', 'Acceleration in the Real World'),
    ]),
    ('forces', 'Forces & Circular Motion', [
        ('09 Newtons Second Law.docx', "Newton's Second Law"),
        ('10 Atwoods Machine.docx', "Atwood's Machine"),
        ('11 Newtons Third Law.docx', "Newton's Third Law"),
        ('12 Static Friction.docx', 'Static Friction'),
        ('13 Air Resistance.docx', 'Air Resistance'),
        ('20 Centripetal Turntable.docx', 'Centripetal Accelerations on a Turntable'),
        ('04 Airplane Lab/Airplane Circular Motion Lab.docx', 'Airplane Circular Motion Lab'),
    ]),
    ('energy-momentum', 'Energy & Momentum', [
        ('16 Energy of a Tossed Ball.docx', 'Energy of a Tossed Ball'),
        ('18 Momentum, Energy.docx', 'Momentum and Energy in Collisions'),
        ('19 Impulse and Momentum.docx', 'Impulse and Momentum'),
    ]),
    ('oscillations', 'Oscillations & SHM', [
        ('14 Pendulum Periods.docx', 'Pendulum Periods'),
        ('15 Simple Harmonic Motion.docx', 'Simple Harmonic Motion'),
        ('17 Energy in SHM.docx', 'Energy in Simple Harmonic Motion'),
        ('[Template] Pendulum Lab.docx', 'Pendulum Lab'),
        ('[Template] Hooke_s Law Lab.docx', "Hooke's Law Lab"),
    ]),
    ('waves-sound-light', 'Waves, Sound & Light', [
        ('32 Sound Waves and Beats.docx', 'Sound Waves and Beats'),
        ('33 Speed of Sound.docx', 'Speed of Sound'),
        ('01 Speed of Sound Lab/Speed of Sound Lab Instruction Sheet.docx', 'Speed of Sound Lab — Instruction Sheet'),
        ('35 Mathematics of Music.docx', 'Mathematics of Music'),
        ('28 Polarization of Light.docx', 'Polarization of Light'),
        ('29 Light and Distance.docx', 'Light and Distance (Inverse Square Law)'),
    ]),
    ('electricity-magnetism', 'Electricity & Magnetism', [
        ('22 Ohms Law.docx', "Ohm's Law"),
        ('23 Series and Parallel Circ.docx', 'Series and Parallel Circuits'),
        ('27 Electrical Energy.docx', 'Electrical Energy'),
        ('25 Magnetic Field in a Coil.docx', 'Magnetic Field in a Coil'),
        ('26 Magnetic Field in Slinky.docx', 'Magnetic Field in a Slinky'),
        ('31 Permanent Magnet.docx', 'Permanent Magnets'),
    ]),
    ('thermal', 'Thermal', [
        ('30 Newtons Law of Cooling.docx', "Newton's Law of Cooling"),
    ]),
    ('templates', 'Report Templates, Planners & Manuals', [
        ('LAB MANUAL.pdf', 'Lab Manual (PDF)'),
        ('Lab Manual 1-14.doc', 'Lab Manual — Labs 1–14'),
        ('0910_IB_Lab_Template.pdf', 'IB Lab Template (2009–10)'),
        ('1011 IB Lab Template.pdf', 'IB Lab Template (2010–11)'),
        ('labtemplate0708.pdf', 'Lab Template (2007–08)'),
        ('[Template] AP Physics Lab Report TEMPLATE.docx', 'AP Physics Lab Report Template'),
        ('Pendulum Lab Report Template.docx', 'Pendulum Lab Report Template'),
        ('Proficiency Lab Report Template.docx', 'Proficiency Lab Report Template'),
        ('Physics 20 - Lab Wirte Up - Template.doc', 'Physics 20 Lab Write-Up Template'),
        ('stage_1_investigation_planner_for_student.doc', 'Investigation Planner — Stage 1'),
        ('stage_2_investigation_planner_for_student.doc', 'Investigation Planner — Stage 2'),
        ('stage_3_dp_investigation_planner_for_stud.doc', 'Investigation Planner — Stage 3 (DP)'),
        ('stage_3_myp_investigation_planner_for_stu.doc', 'Investigation Planner — Stage 3 (MYP)'),
    ]),
]

BANNED = re.compile(r'(graded|assignsubmission)', re.I)


def slug(name):
    base, ext = os.path.splitext(os.path.basename(name))
    s = re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-')
    return s + ext.lower()


copied, excluded_hits = [], []
for anchor, title, files in SECTIONS:
    dest_dir = os.path.join(OUT, 'files', anchor)
    os.makedirs(dest_dir, exist_ok=True)
    for rel, label in files:
        src = os.path.join(ORANGE, rel)
        assert os.path.isfile(src), f'missing: {src}'
        assert not BANNED.search(src), f'banned token in path: {src}'
        dest = os.path.join(dest_dir, slug(rel))
        shutil.copy2(src, dest)
        copied.append((anchor, label, os.path.relpath(dest, ROOT), src))

# ---- page ----
def section_html(anchor, title, files):
    items = []
    for a, label, dest, _ in copied:
        if a == anchor:
            fname = os.path.basename(dest)
            ext = os.path.splitext(fname)[1][1:].upper()
            items.append(f'<li><a href="files/{anchor}/{fname}" download>{html.escape(label)}</a>'
                         f' <span class="doc-ext">{ext}</span></li>')
    return (f'<h2 id="{anchor}">{html.escape(title)}</h2>\n'
            '<ul class="linking">\n' + '\n'.join(items) + '\n</ul>\n')


sections = '\n<div class="rule--full"></div>\n'.join(section_html(a, t, f) for a, t, f in SECTIONS)
toc = ' · '.join(f'<a href="#{a}">{html.escape(t)}</a>' for a, t, _ in SECTIONS)

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Physics Lab Library — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../vault.css">
    <style>
        .linking li {{
            font-family: var(--font-body);
            font-size: 0.88rem;
            color: var(--gray-dark);
            padding: var(--gap-xs) 0;
            border-bottom: 1px solid #f0ece4;
            line-height: 1.6;
        }}
        .doc-ext {{
            font-family: var(--font-ui);
            font-size: 0.6rem;
            letter-spacing: 0.1em;
            color: var(--gray-silver);
        }}
        .toc {{
            font-family: var(--font-ui);
            font-size: 0.8rem;
            font-weight: 300;
            line-height: 2;
            margin: var(--gap-md) 0;
        }}
    </style>
</head>
<body>
    <div class="container">

        <nav class="breadcrumb">
            <a href="../">The Vault</a><span>·</span>
            Physics Lab Library
        </nav>

        <div class="section-header">
            <span class="eyebrow">Practical Physics · Instruction Sheets &amp; Templates</span>
            <h1>Physics Lab Library</h1>
            <p class="subtitle">Lab instruction sheets, report templates, and investigation planners. Instructions only — bring your own data.</p>
        </div>

        <div class="rule--full"></div>
        <p class="toc">{toc}</p>
        <div class="rule--full"></div>

        {sections}

        <footer class="site-footer">The Vault · Physics Lab Library · 2026</footer>

    </div>
</body>
</html>
'''
open(os.path.join(OUT, 'index.html'), 'w').write(page)

# ---- safety log ----
log = ['# Publish Safety Log — Labs + Video Support', '',
       f'*Generated {datetime.date.today()} by Tim (Website agent). Review before `git push origin main`.*', '',
       '## Labs — INCLUDED (instruction sheets / manuals / templates / planners only)', '']
for a, label, dest, src in copied:
    log.append(f'- ✅ `{dest}` ← `{src}`')
log += ['', '## Labs — EXCLUDED (hard privacy filter)', '',
        '- ❌ ALL files matching student-name pattern `* TEMPLATE - <Name>.docx` (9 named student copies at Labs root + Classroom/ duplicates)',
        '- ❌ ALL `Graded Labs/` folders, `*GRADED*` files, `*assignsubmission*` files (e.g. `03 Atwood Lab/PHYSICS-20-AR-LAB #3 …/` — graded student submissions)',
        '- ❌ Named student lab reports in numbered folders (`SpeedofSoundLab_<Name>.docx`, `Win Sereeyothin Graded.docx`, `Determining g data HANSON sample.xlsx`, etc.)',
        '- ❌ `APNC Lab Manual w comments.doc` — uncertain whether comments are student-linked; left out per "when unsure, leave it out"',
        '- ❌ `Airplane Lab video.mp4` — no large binaries in the repo',
        '- ❌ Thecus `Labs/` tree — every candidate file there is a duplicate of the Orange copy or student work; nothing unique included',
        '- ❌ Deeper unnumbered lab folders (Coffee Filter, Conical Pendulum, etc.) — not in the whitelist patterns; left for a future curated pass',
        '', '## Videos — verification', '',
        '- Every embedded video/playlist ID verified this session via YouTube oEmbed (HTTP 200 + author check).',
        '- Channels: Khan Academy (incl. Khan Academy Physics / khanacademymedicine), Flipping Physics, The Organic Chemistry Tutor, Tyler DeWitt, Physics with Professor Matt Anderson (module playlists).',
        '- Embeds use youtube-nocookie.com; no video files downloaded into the repo.',
        '- Source data: `_build/videos.json`.']
open(os.path.join(ROOT, '_build/publish-safety-log.md'), 'w').write('\n'.join(log) + '\n')
print(f'copied {len(copied)} lab files; page + safety log written')
