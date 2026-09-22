#!/usr/bin/env python3
"""Build 'Data Representation of Sound' -- exact-size WAV files students play and download.

Page:   cs/gcse/1-2-memory-storage/data-representation-sound/index.html
Files:  cs/gcse/1-2-memory-storage/data-representation-sound/files/*.wav
Link:   an EXACT-SOUND block on the §1.2 page, inserted before PRACTICE.

Source: ~/vault/01-Teaching/Computer Science - GCSE/1.2 Memory and Storage/
        figures/Alfred exact sounds/  (made by make-exact-sounds.py beside it)

The sound twin of build_exact_images.py (22 Sep). Same rule: every number on the
page is READ FROM THE FILE -- sample rate, bit depth and data length out of the WAV
header -- and the build refuses unless size == rate x seconds x bits / 8 + 44.

📌 "SOUNDS LIKE" FILES are rounded to 16 or 4 levels but stored at 8 bits, because
   browsers do not play 4- or 2-bit WAV. Their card says so, and their sum uses the
   8 bits actually stored. Never label them as 4-bit or 2-bit files.

📌 CREDITS (third-party rule, AGENTS.md): the voice is Piper + the VCTK corpus,
   CC BY 4.0, University of Edinburgh -- the credit line is a licence condition.
   The tune is Beethoven (public domain), synthesised in code.

Idempotent. Prints PUBLISH: lines for publisher.py.
"""
import html, os, shutil, struct

ROOT = os.environ.get("EXACT_SOUND_ROOT", os.path.expanduser("~/rawsonvault"))
SRC = os.path.expanduser("~/vault/01-Teaching/Computer Science - GCSE/1.2 Memory and Storage/"
                         "figures/Alfred exact sounds")
REL = "cs/gcse/1-2-memory-storage/data-representation-sound"
HUB = "cs/gcse/1-2-memory-storage/index.html"
M_START, M_END = "<!-- EXACT-SOUND:START -->", "<!-- EXACT-SOUND:END -->"

CD = " (CD quality)"
# (heading, blurb, [(file, label, note)], credit)
SECTIONS = [
    ("The tune: sample rate",
     "Ode to Joy, 6 seconds, 16 bits per sample every time. Only the sample rate changes. Listen "
     "from the top down: the notes lose their brightness, and at 4,000 Hz some of them come out "
     "wrong, because the wave is not being measured often enough to follow it.",
     [("tune-44100hz-16bit.wav", "44,100 Hz" + CD, ""),
      ("tune-22050hz-16bit.wav", "22,050 Hz", ""),
      ("tune-11025hz-16bit.wav", "11,025 Hz", ""),
      ("tune-8000hz-16bit.wav", "8,000 Hz", ""),
      ("tune-4000hz-16bit.wav", "4,000 Hz", "")],
     "Ode to Joy, Ludwig van Beethoven (1824, public domain). Synthesised in code for this page by Mr Rawson."),
    ("The tune: bit depth",
     "Now the sample rate stays at 22,050 Hz and the bit depth changes. Fewer bits means fewer "
     "heights to round each sample to. Listen for a hiss that grows as the notes fade away.",
     [("tune-22050hz-16bit.wav", "16-bit · 65,536 levels", ""),
      ("tune-22050hz-8bit.wav", "8-bit · 256 levels", ""),
      ("tune-22050hz-sounds-4bit.wav", "Sounds like 4-bit · 16 levels",
       "Rounded to 16 levels, but stored with 8 bits per sample, because browsers only play 8- and 16-bit sound."),
      ("tune-22050hz-sounds-2bit.wav", "Sounds like 2-bit · 4 levels",
       "Rounded to 4 levels, but stored with 8 bits per sample, because browsers only play 8- and 16-bit sound.")],
     "Ode to Joy, Ludwig van Beethoven (1824, public domain). Synthesised in code for this page by Mr Rawson."),
    ("A voice: sample rate",
     "The same sentence, 4 seconds, 16 bits per sample. Speech stays understandable a long way down, "
     "which is why phone calls use a low sample rate, but listen to how the s sounds disappear.",
     [("voice-alfred-22050hz-16bit.wav", "22,050 Hz", ""),
      ("voice-alfred-11025hz-16bit.wav", "11,025 Hz", ""),
      ("voice-alfred-8000hz-16bit.wav", "8,000 Hz (phone call)", ""),
      ("voice-alfred-4000hz-16bit.wav", "4,000 Hz", "")],
     "VOICE"),
    ("A voice: bit depth",
     "The same sentence at 22,050 Hz, with the bit depth changing.",
     [("voice-alfred-22050hz-16bit.wav", "16-bit · 65,536 levels", ""),
      ("voice-alfred-22050hz-8bit.wav", "8-bit · 256 levels", ""),
      ("voice-alfred-22050hz-sounds-4bit.wav", "Sounds like 4-bit · 16 levels",
       "Rounded to 16 levels, but stored with 8 bits per sample, because browsers only play 8- and 16-bit sound.")],
     "VOICE"),
]
VOICE_CREDIT = ('Voice: speaker 76 of the <a href="https://datashare.ed.ac.uk/handle/10283/3443">VCTK corpus</a>, '
                'Centre for Speech Technology Research, University of Edinburgh, used under '
                '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Spoken by the open-source '
                '<a href="https://github.com/rhasspy/piper">Piper</a> text-to-speech on Mr Rawson\'s computer.')


def read_wav(path):
    """Sample rate, bit depth, seconds and header length, read from the file itself."""
    with open(path, "rb") as f:
        head = f.read(44)
    riff, _, wavefmt, fmt, _, pcm, ch, rate, _, _, bits, data_tag, data_len = \
        struct.unpack("<4sI4s4sIHHIIHH4sI", head)
    assert (riff, wavefmt, fmt, data_tag, pcm, ch) == (b"RIFF", b"WAVE", b"fmt ", b"data", 1, 1), path
    size = os.path.getsize(path)
    per_sec = rate * bits // 8
    assert data_len % per_sec == 0, f"{path}: not a whole number of seconds"
    secs = data_len // per_sec
    assert size == rate * secs * bits // 8 + 44, f"{path}: size does not match the formula"
    return rate, bits, secs, size


def n(x):
    return f"{x:,}"


def card(fn, label, note):
    rate, bits, secs, size = read_wav(os.path.join(SRC, fn))
    data = rate * secs * bits // 8
    extra = f'<div class="snd-note">{html.escape(note)}</div>' if note else ""
    return f"""
<div class="snd-card">
  <div class="snd-label">{html.escape(label)}</div>
  <audio controls preload="none" src="files/{fn}"></audio>
  <div class="snd-facts">{n(rate)} samples per second · {bits} bits per sample · {secs} seconds<br>
  <strong>Header: 44 bytes</strong></div>{extra}
  <details class="snd-check"><summary>Check your answer</summary>
  <p>{n(rate)} × {secs} × {bits} ÷ 8 = <strong>{n(data)}</strong> bytes of samples<br>
  + 44 bytes of header<br>= <strong>{n(size)} bytes</strong></p></details>
  <a class="snd-dl" href="files/{fn}" download>Download {fn}</a>
</div>"""


def page():
    parts, files = [], []
    for title, blurb, items, credit in SECTIONS:
        cards = []
        for fn, label, note in items:
            cards.append(card(fn, label, note))
            if fn not in files:
                files.append(fn)
        cred = VOICE_CREDIT if credit == "VOICE" else html.escape(credit)
        parts.append(f"""
        <h2>{html.escape(title)}</h2>
        <p class="lede">{html.escape(blurb)}</p>
        <div class="snd-grid">{''.join(cards)}
        </div>
        <p class="diagram-credit">{cred}</p>""")
    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Representation of Sound — §1.2 — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../../vault.css">
    <style>
        .eq-box {{ font-family: var(--font-body); font-style: italic; font-size: 0.95rem; color: var(--ink-black); background: #fdf9f4; border-left: 3px solid var(--bronze-light); padding: var(--gap-sm) var(--gap-md); margin: var(--gap-xs) 0; }}
        .lede, .steps li {{ font-family: var(--font-body); font-size: 0.92rem; color: var(--gray-dark); line-height: 1.6; }}
        .steps {{ margin: var(--gap-sm) 0 var(--gap-md) 1.2em; }}
        .snd-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--gap-sm); margin: var(--gap-sm) 0; }}
        .snd-card {{ border: 1px solid #e4ddd0; background: #fffdf9; padding: var(--gap-sm); }}
        .snd-label {{ font-family: var(--font-ui, Inter, sans-serif); font-weight: 600; font-size: 0.88rem; color: var(--bronze-dark); margin-bottom: 0.4em; }}
        .snd-card audio {{ width: 100%; }}
        .snd-facts, .snd-note {{ font-family: var(--font-body); font-size: 0.82rem; color: var(--gray-dark); margin: 0.4em 0; line-height: 1.5; }}
        .snd-note {{ color: #8a8378; font-style: italic; }}
        .snd-check {{ font-family: var(--font-body); font-size: 0.82rem; margin: 0.4em 0; }}
        .snd-check summary {{ cursor: pointer; color: var(--bronze-dark); }}
        .snd-dl {{ font-family: var(--font-ui, Inter, sans-serif); font-size: 0.75rem; }}
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../../">The Vault</a><span>·</span>
            <a href="../../../">Computer Science</a><span>·</span>
            <a href="../../">GCSE CS</a><span>·</span>
            <a href="../">§1.2 Memory and Storage</a><span>·</span>
            Data Representation of Sound
        </nav>
        <div class="section-header">
            <span class="eyebrow">OCR J277 · §1.2.4 · Sound</span>
            <h1>Data Representation of Sound</h1>
            <p class="subtitle">Real sound files you can hear, and whose size you can calculate to the exact byte.</p>
        </div>
        <div class="rule--full"></div>

        <h2>The idea</h2>
        <p class="lede">Every sound below is a real file, stored as a <strong>WAV</strong>. A WAV stores every
        sample with no compression, plus a <strong>44-byte header</strong> at the front: the metadata that
        records the sample rate, the bit depth and the length. That header is always 44 bytes.</p>
        <div class="eq-box">file size (bytes) = sample rate × seconds × bit depth ÷ 8 + 44</div>

        <h2>Check it yourself</h2>
        <ol class="steps">
            <li>Work out the file size in bytes with the formula, before you look.</li>
            <li>Download the file with the link under the player (or the player's ⋮ menu, then <strong>Download</strong>).</li>
            <li>Find the saved file. On Windows, right-click it and choose <strong>Properties</strong>: the <em>Size</em> line shows the exact number of bytes.</li>
            <li>Open <strong>Check your answer</strong> and compare all three numbers.</li>
        </ol>
        <p class="lede">Use headphones if the room is busy.</p>
{''.join(parts)}
        <div class="rule--full"></div>
        <p class="lede"><a href="../data-representation-images/">Data Representation of Images →</a></p>
        <p class="lede"><a href="../">← Back to §1.2 Memory and Storage</a></p>
    </div>
</body>
</html>
"""
    return body, files


def hub_block():
    return f"""{M_START}
<div class="rule--full"></div>
<h2>Data Representation of Sound</h2>
<ul class="linking">
<li><a href="data-representation-sound/">Data Representation of Sound</a> — real sound files at different sample rates and bit depths. Listen, calculate the size, download the file, and check it to the exact byte.</li>
</ul>
{M_END}"""


def main():
    out = os.path.join(ROOT, REL)
    os.makedirs(os.path.join(out, "files"), exist_ok=True)
    body, files = page()
    for fn in files:
        shutil.copyfile(os.path.join(SRC, fn), os.path.join(out, "files", fn))
        print(f"PUBLISH: {REL}/files/{fn}")
    for fn in os.listdir(os.path.join(out, "files")):
        if fn not in files:
            os.remove(os.path.join(out, "files", fn))
            print(f"PUBLISH: {REL}/files/{fn}")
    with open(os.path.join(out, "index.html"), "w") as f:
        f.write(body)
    print(f"PUBLISH: {REL}/index.html")
    hub = os.path.join(ROOT, HUB)
    s = open(hub).read()
    block = hub_block()
    if M_START in s:
        a, b = s.index(M_START), s.index(M_END) + len(M_END)
        s = s[:a] + block + s[b:]
    else:
        anchor = "<!-- PRACTICE:START -->"
        assert anchor in s, "no PRACTICE marker on the §1.2 page"
        s = s.replace(anchor, block + "\n" + anchor, 1)
    open(hub, "w").write(s)
    print(f"PUBLISH: {HUB}")


if __name__ == "__main__":
    main()
