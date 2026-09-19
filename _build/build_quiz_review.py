#!/usr/bin/env python3
"""Build the Quiz 1 review page for P2 Electricity.

A standalone revision page for the 21 Sep 2026 electricity quiz, reached from
the Physics 11 Q class page by a markdown link in that entry's `Publish:` field
(`WEB_LINK` in inject_class_pages.py) -- so no generator change is needed there.

Reuses the `.revise-*` component set already in vault.css (built for
inject_cs_revision.py). No new CSS.

CONTENT PROVENANCE. Every bullet is grounded in the handouts the class actually
sat, read from the LaTeX sources on 2026-09-19 -- not from the specification:

    p2-l06-charge-current-and-resistance-handout.tex   (7 Sep)
    p2-l04-series-and-parallel-circuits-handout.tex    (4 Sep)
    p2-review-01-series-resistors.tex                  (4 Sep)
    p2-review-02-parallel-resistors.tex                (4 Sep)
    p2-l05-rp15-resistance-of-a-wire-handout.tex       (16 Sep)
    p2-l07-ohmic-and-non-ohmic-conductors.tex          (18 Sep)

Two scope facts taken from those sources rather than assumed:
  * Parallel total resistance is NOT calculated at GCSE (AQA aP2-21) -- the
    qualitative explanation is what is examined. The page says so plainly.
  * The 18 Sep lesson covers FIVE components, not three: the thermistor and
    the LDR are plotted against temperature and light intensity, not as I-V.

VIDEOS. Every id below returned HTTP 200 from YouTube oEmbed with the author
name recorded here, verified 2026-09-19. All are free to view, no login, no
paywall -- the standing third-party rule in AGENTS.md.

NO AQA MATERIAL. p2-reference-circuit-symbols.pdf reproduces AQA's own chart
from spec p.128 and is print-only. Nothing from it is reproduced or linked.

Student-facing, so the positive-instruction rule applies (04-rules.md,
2026-09-17): the page states the correct move and gives a check that confirms
success. Diagnosis of what goes wrong belongs in the Class Log.
"""
import html
import os
import sys
from pathlib import Path

ROOT = Path(os.path.expanduser("~/rawsonvault"))
OUT = ROOT / "physics/aqa-gcse/p2-electricity/quiz-1-review"
REL = "physics/aqa-gcse/p2-electricity/quiz-1-review/index.html"
DEPTH = "../../../../"

SECTIONS = [
    dict(
        title="Circuit diagrams and symbols",
        spec="Taught Mon 7 Sep",
        blurb="Fourteen symbols are on the AQA chart and that is the whole list. "
              "You need them in both directions — name one you are shown, and draw one you are asked for.",
        bullets=[
            "Name each of the fourteen symbols, and draw the cell, lamp, ammeter and resistor from memory.",
            "Tell a cell from a battery: one long line and one short line is a cell, and the pattern repeated is a battery. The long thin line is the positive terminal.",
            "Put the meters in the right place — the ammeter goes <em>in</em> the loop, the voltmeter goes <em>across</em> the component. Both symbols are a circle with a letter, so position is what identifies them.",
            "Draw a circuit from a written description, such as “a cell, a closed switch, two lamps in series and an ammeter”. <strong>Check:</strong> trace one complete path all the way round with your finger and back to where you started.",
            "Name the three components whose resistance is not fixed — the variable resistor, the thermistor and the LDR — and say what changes each one.",
        ],
        video=dict(id="ZP30SB0tQdU", author="Physics Online",
                   title="Circuit Components and Symbols - GCSE Physics"),
    ),
    dict(
        title="Series circuits",
        spec="Taught Fri 4 Sep",
        blurb="One loop, one route. The three rules do all the work: "
              "<em>I</em><sub>1</sub> = <em>I</em><sub>2</sub> = <em>I</em><sub>supply</sub>, "
              "<em>V</em><sub>supply</sub> = <em>V</em><sub>1</sub> + <em>V</em><sub>2</sub>, and "
              "<em>R</em><sub>total</sub> = <em>R</em><sub>1</sub> + <em>R</em><sub>2</sub>.",
        bullets=[
            "State the three rules: the current is the same everywhere, the potential difference is shared out, and the resistances add.",
            "Work a circuit through in order — add the resistances, find the current from <em>I</em>&nbsp;=&nbsp;<em>V</em>/<em>R</em>, then find the p.d. across each resistor from <em>V</em>&nbsp;=&nbsp;<em>IR</em>.",
            "<strong>Check:</strong> add your two potential differences back together. They come to the supply p.d. <em>Worked example — 4&nbsp;Ω and 6&nbsp;Ω on 12&nbsp;V: R</em><sub>total</sub> <em>= 10&nbsp;Ω, I = 1.2&nbsp;A, V</em><sub>1</sub> <em>= 4.8&nbsp;V, V</em><sub>2</sub> <em>= 7.2&nbsp;V, and 4.8 + 7.2 = 12&nbsp;V.</em>",
            "Work backwards to an unknown resistance: find the total from the supply p.d. and the current, then subtract the resistance you were given.",
            "Explain why the bigger resistor takes the bigger share of the p.d., and say what the second lamp does when the first one is unscrewed.",
        ],
        video=dict(id="BiY3Qfo8EG4", author="Flipping Physics",
                   title="Basic Series and Parallel Resistor Circuit Demos and Animations"),
    ),
    dict(
        title="Parallel circuits",
        spec="Taught Fri 4 Sep",
        blurb="Separate branches, each with its own route back. Here it is the current that splits "
              "and the potential difference that stays the same: "
              "<em>V</em><sub>1</sub> = <em>V</em><sub>2</sub> = <em>V</em><sub>supply</sub> and "
              "<em>I</em><sub>total</sub> = <em>I</em><sub>1</sub> + <em>I</em><sub>2</sub>.",
        bullets=[
            "State the three rules: every branch gets the full supply p.d., the branch currents add to the supply current, and the total resistance is less than the smallest single resistor.",
            "Find each branch current from <em>I</em>&nbsp;=&nbsp;<em>V</em>/<em>R</em> using the full supply p.d., then add them. <em>Worked example — 4&nbsp;Ω and 6&nbsp;Ω across 12&nbsp;V: I</em><sub>1</sub> <em>= 3.0&nbsp;A, I</em><sub>2</sub> <em>= 2.0&nbsp;A, total 5.0&nbsp;A.</em>",
            "Say which branch carries the larger current and why — same p.d., smaller resistance, so larger current. This is the opposite way round to how p.d. divides in series.",
            "Explain in words why an extra parallel branch <em>lowers</em> the total resistance: the charge has another route available. <strong>Check:</strong> the 4&nbsp;Ω alone would draw 3.0&nbsp;A, and the pair draw 5.0&nbsp;A on the same supply — more current for the same p.d. means less resistance.",
            "Explain why the other branch keeps working when one lamp is removed: its own loop is still complete.",
            "AQA asks for that explanation in words. Calculating a total resistance in parallel is outside the Trilogy specification, and <em>R</em><sub>total</sub> = <em>R</em><sub>1</sub> + <em>R</em><sub>2</sub> belongs to series circuits only.",
        ],
        video=dict(id="7mdc-lRrW1c", author="The Organic Chemistry Tutor",
                   title="Series and Parallel Circuits"),
    ),
    dict(
        title="Resistance of a wire — RP15",
        spec="Taught Wed 16 Sep",
        blurb="The required practical. You cannot read resistance off a meter, so you measure "
              "<em>V</em> and <em>I</em> and calculate it: <em>R</em> = <em>V</em>/<em>I</em>. "
              "Length is the only thing you change.",
        bullets=[
            "Name the variables: the <strong>independent</strong> variable is the length of nichrome between the crocodile clips, the <strong>dependent</strong> variable is its resistance found from <em>V</em> and <em>I</em>, and the <strong>controls</strong> are the same wire throughout, the same supply setting, and a wire kept cool by disconnecting between readings.",
            "Calculate <em>R</em>&nbsp;=&nbsp;<em>V</em>/<em>I</em> for each length to two decimal places, and set one calculation out in full — formula across the middle, each value written underneath its own symbol, answer boxed with its unit.",
            "Plot <strong>resistance up the side against length along the bottom</strong>, and draw one straight line of best fit through your readings. <strong>Check:</strong> the line has a positive gradient and, extended backwards, heads towards the origin — although (0,&nbsp;0) is not one of your data points and the line is fitted to your readings only.",
            "State the conclusion: the resistance of the wire is <strong>directly proportional</strong> to its length.",
            "Use the line of best fit to read off the resistance at a length you did not measure, leaving your construction lines drawn on the graph — the construction lines are what is being marked.",
            "Explain the result in terms of the wire: a longer wire puts more metal ions in the way, so there are more collisions opposing the flow. Give one reason the line can miss the origin (the leads and the clip contacts add a fixed resistance to every reading) and one improvement (repeat each length and take a mean).",
        ],
        video=dict(id="m_3JrA-sDEg", author="Malmesbury Education",
                   title="Resistance of a Wire - GCSE Science Required Practical"),
    ),
    dict(
        title="Ohmic and non-ohmic devices",
        spec="Taught Fri 18 Sep",
        blurb="Five components, five shapes. Read the shape and you know the component. "
              "One equation covers every graph on the sheet: <em>R</em> = <em>V</em>/<em>I</em>.",
        bullets=[
            "Get the resistance off any graph the same way — <strong>pick a point, read <em>V</em> across, read <em>I</em> up, divide.</strong> <strong>Check:</strong> do it again at a second point. The same answer means the resistance is constant, and a different answer means it has changed.",
            "Convert milliamps to amps first, then divide. <em>At V = 3.0&nbsp;V and I = 25&nbsp;mA: 25&nbsp;mA = 0.025&nbsp;A, so R = 3.0 / 0.025 = 120&nbsp;Ω.</em>",
            "Name the component from its shape: a <strong>straight line through the origin</strong> is a fixed resistor and is ohmic; a curve that <strong>bends over towards the <em>V</em> axis on both sides</strong> is a filament lamp; a line that is <strong>flat along the axis one way and rises steeply the other</strong> is a diode.",
            "Explain the filament lamp: a bigger current makes the filament hotter, its ions vibrate more, there are more collisions, and the resistance increases — so each extra volt gives less extra current.",
            "Explain the diode: it conducts in one direction only, passing current once the p.d. is above about 0.6&nbsp;V forwards, and having a very high resistance backwards so almost no current flows.",
            "Describe the thermistor and the LDR, which are plotted on <strong>different axes</strong> — resistance against temperature, and resistance against light intensity. Both curves fall: hotter means less resistance, and brighter means less resistance.",
        ],
        video=dict(id="bp4T1Vqma3M", author="Science Shorts",
                   title="TESTING COMPONENTS - IV CHARACTERISTICS - Science GCSE Physics Required Practical"),
    ),
]


QUIZ_DATE = "Monday 21 September"

INTRO = (
    "The quiz covers the electricity we have done so far, which is the five topics below. "
    "Each one lists what you should be able to do, and ends with one video from a different "
    "teacher in case a second explanation helps. Every handout and answer key is already on "
    "your class page."
)


def video_cell(v):
    t = html.escape(v["title"])
    a = html.escape(v["author"])
    return ('<div class="video-grid video-grid--single">'
            '<figure class="video-cell">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/{v["id"]}" '
            f'title="{t} ({a})" loading="lazy" allowfullscreen '
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>'
            f'<figcaption>{t}<span class="video-author">{a}</span></figcaption>'
            '</figure></div>')


def section(i, s):
    out = ['<section class="revise-block">',
           f'<h3>{i}. {html.escape(s["title"])}'
           f'<span class="revise-spec">{html.escape(s["spec"])}</span></h3>']
    if s.get("blurb"):
        out.append(f'<p class="revise-blurb">{s["blurb"]}</p>')
    out.append('<ul class="understanding-list">')
    out.extend(f'<li>{b}</li>' for b in s["bullets"])
    out.append('</ul>')
    out.append(video_cell(s["video"]))
    out.append('</section>')
    return "\n".join(out)


def render():
    body = "\n".join(section(i, s) for i, s in enumerate(SECTIONS, 1))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz 1 Review &mdash; P2 Electricity &mdash; The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&amp;family=Merriweather:ital,wght@0,400;0,700;1,400&amp;family=Inter:wght@300;400;600&amp;display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{DEPTH}vault.css">
    <style>
        /* Page-local only: the bullet list and the quiz banner. Everything else
           is the shared .revise-* component set in vault.css. */
        .understanding-list {{ margin: 0 0 var(--gap-md); padding-left: 1.15em; }}
        .understanding-list li {{ margin-bottom: 0.55em; line-height: 1.6; }}
        .quiz-banner {{
            border: 1px solid var(--bronze-core);
            background: #fdf9f4;
            padding: var(--gap-sm) var(--gap-md);
            margin: 0 0 var(--gap-lg);
            font-family: var(--font-ui, Inter), sans-serif;
            font-size: 0.95rem;
        }}
        .quiz-banner strong {{ font-weight: 600; }}
        .back-link {{ margin-top: var(--gap-lg); font-size: 0.92rem; }}
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="{DEPTH}">The Vault</a><span>&middot;</span>
            <a href="../../../">Physics</a><span>&middot;</span>
            <a href="../../">AQA GCSE Physics</a><span>&middot;</span>
            <a href="../">P2 Electricity</a><span>&middot;</span>
            Quiz 1 Review
        </nav>
        <div class="section-header">
            <span class="eyebrow">AQA GCSE &middot; Trilogy 8464 &middot; Physics Paper 1 &middot; P2 Electricity</span>
            <h1>Quiz 1 &mdash; Review</h1>
            <p class="subtitle">Everything we have covered in electricity, in five parts.</p>
        </div>
        <div class="rule--full"></div>
        <p class="quiz-banner"><strong>Quiz: {QUIZ_DATE}.</strong> Higher tier.
        Bring a calculator, a ruler and a pencil &mdash; there is a graph to read.</p>
        <p class="revise-intro">{INTRO}</p>
{body}
        <p class="back-link"><a href="{DEPTH}classes/physics-11-q/">&larr; All the handouts and answer keys, on the Physics 11 Q page</a></p>
        <footer class="site-footer">The Vault &middot; AQA GCSE Physics &middot; P2 Electricity &middot; 2026</footer>
    </div>
</body>
</html>
"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(render(), encoding="utf-8")
    print(f"Quiz 1 review page: {len(SECTIONS)} sections, "
          f"{sum(len(s['bullets']) for s in SECTIONS)} bullets, "
          f"{len(SECTIONS)} verified videos")
    print(f"PUBLISH: {REL}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
