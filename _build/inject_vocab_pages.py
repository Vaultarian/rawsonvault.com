#!/usr/bin/env python3
"""Vocabulary pages — per-class language support for home-language students.

Design spec: ~/vault/01-Teaching/Languages/00 Vocabulary Support — Design Spec.md

One source per COURSE (a YAML file in ~/vault/01-Teaching/Languages/), one page per
CLASS at classes/<slug>/vocab/. All languages ship inside the same page; the student
picks once and localStorage remembers. ?lang=fr|de|es pre-selects.

Three properties this file must keep:

  1. NO STUDENT DATA. Subject vocabulary only. Every class that has a source file gets
     the same languages, so nothing on the public site hints at who is in which class.

  2. THE BETA LINE IS MANDATORY (spec §6). Alex ships these without a native-speaker
     check, deliberately (spec §9). The line telling students the page is new and that
     they are probably right if a word looks wrong is what turns unverified output into
     student-corrected output. Never quietly drop it to make the page look finished.

  3. THIS INJECTOR DOES NOT TOUCH classes/<slug>/index.html. That file is regenerated
     wholesale by inject_class_pages.py, which would wipe anything written here. The
     link from a class page to its vocabulary page belongs in THAT injector.

Emits  classes/<slug>/vocab/index.html
"""
import html
import json
import os
import sys
import unicodedata
from datetime import date
from pathlib import Path

import yaml

HOME = Path.home()
SRC = HOME / "vault/01-Teaching/Languages"
REPO = Path(os.environ.get("RAWSONVAULT_PATH", HOME / "rawsonvault")).expanduser()
OUT = REPO / "classes"

LANGS = ["es", "fr", "de"]
LANG_NAME = {"es": "Español", "fr": "Français", "de": "Deutsch"}

# Written for the age group that reads them. Mandatory -- see property 2 above.
BETA = {
    "es": ("Esta página la ha escrito <strong>Alfred</strong>, el sistema de IA del Sr. Rawson, "
           "para ayudarte a estudiar en inglés. <strong>Es nueva, y Alfred todavía está aprendiendo "
           "tu idioma, así que algunas cosas estarán mal.</strong> Si una palabra te parece "
           "incorrecta, seguramente tengas razón: díselo al Sr. Rawson y la corregimos. Si falta "
           "una palabra que necesitas, o se te ocurre cómo mejorar esta página, díselo también. "
           "Cambia siempre que lo pidas."),
    "fr": ("Cette page a été écrite par <strong>Alfred</strong>, le système d'IA de M. Rawson, "
           "pour t'aider à étudier en anglais. <strong>Elle est toute nouvelle, et Alfred apprend "
           "encore ta langue : certaines choses seront donc fausses.</strong> Si un mot te semble "
           "incorrect, tu as sans doute raison : dis-le à M. Rawson et nous le corrigerons. S'il "
           "manque un mot dont tu as besoin, ou si tu as une idée pour améliorer cette page, "
           "dis-le-lui aussi. Elle change dès que tu le demandes."),
    "de": ("Diese Seite hat <strong>Alfred</strong> geschrieben, das KI-System von Mr Rawson, "
           "damit du auf Englisch lernen kannst. <strong>Sie ist ganz neu, und Alfred lernt deine "
           "Sprache noch — manches wird also falsch sein.</strong> Wenn dir ein Wort falsch "
           "vorkommt, hast du wahrscheinlich recht: Sag Mr Rawson Bescheid, dann korrigieren wir "
           "es. Wenn ein Wort fehlt, das du brauchst, oder dir einfällt, wie diese Seite besser "
           "wird, sag ihm das auch. Sie ändert sich, sobald du es sagst."),
}

UI = {
    "es": {"ph": "Escribe una palabra — en español o en inglés",
           "all": "Todos los temas", "none": "No se ha encontrado nada.",
           "sort_en": "Orden: inglés", "sort_xx": "Orden: español", "count": "términos"},
    "fr": {"ph": "Tape un mot — en français ou en anglais",
           "all": "Tous les thèmes", "none": "Aucun résultat.",
           "sort_en": "Tri : anglais", "sort_xx": "Tri : français", "count": "termes"},
    "de": {"ph": "Gib ein Wort ein — auf Deutsch oder Englisch",
           "all": "Alle Themen", "none": "Nichts gefunden.",
           "sort_en": "Sortierung: Englisch", "sort_xx": "Sortierung: Deutsch",
           "count": "Begriffe"},
}


def fold(s):
    """Accent- and case-insensitive key, so 'compresion' finds 'compresión'."""
    return "".join(c for c in unicodedata.normalize("NFD", str(s).lower())
                   if unicodedata.category(c) != "Mn")


def load_sources():
    """[(course_title, [class_slug], [term])] for every YAML in the Languages folder."""
    out = []
    for p in sorted(SRC.glob("*.yaml")):
        try:
            d = yaml.safe_load(p.read_text(encoding="utf-8"))
        except yaml.YAMLError as e:
            print(f"  SKIP {p.name}: will not parse -- {e}")
            continue
        if not d or not d.get("terms") or not d.get("classes"):
            print(f"  SKIP {p.name}: no terms or no classes")
            continue
        rows, dropped = [], 0
        for t in d["terms"]:
            langs = {L: t[L] for L in LANGS
                     if isinstance(t.get(L), dict)
                     and all(t[L].get(k) for k in ("term", "example", "usage"))}
            if not langs or not t.get("en"):
                dropped += 1
                continue
            row = {"en": str(t["en"]), "unit": str(t.get("unit", "")),
                   "ex": str(t.get("example_en", ""))}
            for L, v in langs.items():
                row[L] = {"t": str(v["term"]), "e": str(v["example"]), "u": str(v["usage"])}
            # The search key deliberately includes the EXAMPLE SENTENCES, not just the
            # term names. A student mid-sentence reaches for a word they half-remember
            # from a sentence, not for a headword: without this, typing "push" while
            # groping for "force" returns nothing, which is the one failure the page
            # exists to prevent. Usage notes are excluded -- they are long enough to
            # make everything match everything.
            row["_k"] = " ".join([fold(row["en"]), fold(row["unit"]), fold(row["ex"])]
                                 + [fold(row[L]["t"]) for L in langs]
                                 + [fold(row[L]["e"]) for L in langs])
            rows.append(row)
        if dropped:
            print(f"  {p.name}: dropped {dropped} incomplete term(s)")
        if rows:
            out.append((str(d.get("course", p.stem)),
                        [str(c) for c in d["classes"]], rows))
    return out


def render(class_slug, course, terms):
    langs = [L for L in LANGS if any(L in t for t in terms)]
    units = sorted({t["unit"] for t in terms if t["unit"]})
    pretty = class_slug.replace("-", " ").title()
    payload = json.dumps(
        {"terms": [{k: v for k, v in t.items()} for t in terms],
         "langs": langs, "units": units,
         "ui": {L: UI[L] for L in langs}, "beta": {L: BETA[L] for L in langs},
         "name": {L: LANG_NAME[L] for L in langs}},
        ensure_ascii=False, separators=(",", ":"))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(pretty)} — Vocabulary — The Vault</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../../vault.css">
    <style>
      .langbar {{ display:flex; gap:.5rem; flex-wrap:wrap; margin:1.5rem 0 .5rem; }}
      .langbar button {{ font-family:var(--font-ui); font-size:.82rem; letter-spacing:.04em;
        padding:.4rem .95rem; border:1px solid var(--bronze-cream); background:none;
        color:inherit; cursor:pointer; border-radius:2px; }}
      .langbar button[aria-pressed="true"] {{ background:var(--bronze-rich); color:#fff;
        border-color:var(--bronze-rich); }}
      .beta {{ font-family:var(--font-body); font-size:.9rem; line-height:1.55;
        border-left:3px solid var(--bronze-rich); padding:.6rem 0 .6rem 1rem;
        margin:1rem 0 1.75rem; opacity:.88; }}
      .find {{ position:sticky; top:0; background:var(--parchment,#fbf9f4);
        padding:.9rem 0 .7rem; z-index:5; }}
      .find input {{ width:100%; box-sizing:border-box; font-family:var(--font-ui);
        font-size:1.05rem; padding:.7rem .9rem; border:1px solid var(--bronze-cream);
        border-radius:2px; background:#fff; color:inherit; }}
      .find input:focus {{ outline:2px solid var(--bronze-rich); outline-offset:1px; }}
      .ctl {{ display:flex; gap:.75rem; flex-wrap:wrap; margin-top:.55rem; }}
      .ctl select {{ font-family:var(--font-ui); font-size:.78rem; padding:.3rem .5rem;
        border:1px solid var(--bronze-cream); background:#fff; color:inherit; }}
      .n {{ font-family:var(--font-ui); font-size:.75rem; opacity:.5;
        margin:.2rem 0 1rem; }}
      .row {{ display:grid; grid-template-columns:15rem 1fr; gap:0 1.75rem;
        padding:1rem 0; border-top:1px solid var(--bronze-cream); }}
      .row h3 {{ margin:0; font-family:'Cinzel',Georgia,serif; font-size:1rem;
        font-weight:600; }}
      .row .xx {{ font-family:var(--font-body); font-style:italic; opacity:.85;
        margin:.15rem 0 0; }}
      .row .unit {{ font-family:var(--font-ui); font-size:.68rem; letter-spacing:.09em;
        text-transform:uppercase; color:var(--bronze-rich); margin-top:.4rem; }}
      .row .ex {{ font-family:var(--font-body); margin:0 0 .25rem; }}
      .row .ex.tr {{ opacity:.72; font-style:italic; }}
      .row .use {{ font-family:var(--font-body); font-size:.9rem; margin:.5rem 0 0;
        padding-left:.85rem; border-left:2px solid var(--bronze-cream); }}
      .row .use.warn {{ border-left-color:#b4521f; }}
      @media (max-width:700px) {{ .row {{ grid-template-columns:1fr; gap:.4rem; }} }}
    </style>
</head>
<body>
    <div class="container">
        <nav class="breadcrumb">
            <a href="../../../">The Vault</a><span>·</span>
            <a href="../../">Classes</a><span>·</span>
            <a href="../">{html.escape(pretty)}</a><span>·</span>
            Vocabulary
        </nav>
        <div class="section-header">
            <span class="eyebrow">Vocabulary</span>
            <h1>{html.escape(pretty)}</h1>
            <p class="subtitle">{html.escape(course)}</p>
        </div>
        <div class="rule--full"></div>

        <div class="langbar" id="langbar"></div>
        <div class="beta" id="beta"></div>

        <div class="find">
          <input id="q" type="search" autocomplete="off" autofocus>
          <div class="ctl">
            <select id="unit"></select>
            <select id="sort"></select>
          </div>
        </div>
        <p class="n" id="n"></p>
        <div id="list"></div>

        <footer class="site-footer">The Vault · {html.escape(pretty)} · vocabulary · updated {date.today().strftime('%-d %B %Y')}</footer>
    </div>
<script>
const D = {payload};
const KEY = "vocab-lang";
const fold = s => (s||"").toString().toLowerCase()
  .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");

function pick() {{
  const q = new URLSearchParams(location.search).get("lang");
  if (q && D.langs.includes(q)) {{ try {{ localStorage.setItem(KEY, q); }} catch (e) {{}} return q; }}
  let s = null; try {{ s = localStorage.getItem(KEY); }} catch (e) {{}}
  if (s && D.langs.includes(s)) return s;
  return D.langs[0];
}}
let L = pick();

function setLang(v) {{
  L = v; try {{ localStorage.setItem(KEY, v); }} catch (e) {{}}
  chrome(); render();
}}

function chrome() {{
  document.getElementById("langbar").innerHTML = D.langs.map(x =>
    `<button data-l="${{x}}" aria-pressed="${{x === L}}">${{D.name[x]}}</button>`).join("");
  document.querySelectorAll("#langbar button").forEach(b =>
    b.onclick = () => setLang(b.dataset.l));
  document.getElementById("beta").innerHTML = D.beta[L];
  const u = D.ui[L];
  document.getElementById("q").placeholder = u.ph;
  const sel = document.getElementById("unit"), keep = sel.value;
  sel.innerHTML = `<option value="">${{u.all}}</option>` +
    D.units.map(x => `<option>${{x}}</option>`).join("");
  sel.value = keep;
  const so = document.getElementById("sort"), ks = so.value;
  so.innerHTML = `<option value="en">${{u.sort_en}}</option><option value="xx">${{u.sort_xx}}</option>`;
  so.value = ks || "en";
}}

function render() {{
  const u = D.ui[L];
  const q = fold(document.getElementById("q").value.trim());
  const unit = document.getElementById("unit").value;
  const sort = document.getElementById("sort").value || "en";
  let rows = D.terms.filter(t => t[L]);
  if (unit) rows = rows.filter(t => t.unit === unit);
  if (q) rows = rows.filter(t => t._k.includes(q));
  rows.sort((a, b) => (sort === "xx" ? fold(a[L].t).localeCompare(fold(b[L].t))
                                     : fold(a.en).localeCompare(fold(b.en))));
  document.getElementById("n").textContent = rows.length + " " + u.count;
  document.getElementById("list").innerHTML = rows.length ? rows.map(t => {{
    const w = t[L].u.indexOf("\\u26a0") === 0 ? " warn" : "";
    return `<div class="row">
      <div><h3>${{esc(t.en)}}</h3><p class="xx">${{esc(t[L].t)}}</p>
        ${{t.unit ? `<p class="unit">${{esc(t.unit)}}</p>` : ""}}</div>
      <div>${{t.ex ? `<p class="ex">${{esc(t.ex)}}</p>` : ""}}
        <p class="ex tr">${{esc(t[L].e)}}</p>
        <p class="use${{w}}">${{esc(t[L].u)}}</p></div>
    </div>`;
  }}).join("") : `<p class="n">${{u.none}}</p>`;
}}

function esc(s) {{
  return (s || "").replace(/[&<>"']/g, c =>
    ({{"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}})[c]);
}}

document.getElementById("q").addEventListener("input", render);
document.getElementById("unit").addEventListener("change", render);
document.getElementById("sort").addEventListener("change", render);
// A laptop is the only device these students may have in class (spec §2), so the
// keyboard is the fast path: "/" jumps to the box from anywhere on the page.
document.addEventListener("keydown", e => {{
  if (e.key === "/" && document.activeElement.id !== "q") {{
    e.preventDefault(); document.getElementById("q").focus();
  }}
}});
chrome(); render();
</script>
</body>
</html>
"""


def main():
    sources = load_sources()
    if not sources:
        print("No vocabulary sources found in " + str(SRC))
        return 0
    touched, pages = [], 0
    for course, slugs, terms in sources:
        langs = sorted({L for t in terms for L in LANGS if L in t})
        for s in slugs:
            cdir = OUT / s
            if not cdir.is_dir():
                print(f"  SKIP {s}: no such class page")
                continue
            vdir = cdir / "vocab"
            vdir.mkdir(parents=True, exist_ok=True)
            (vdir / "index.html").write_text(render(s, course, terms), encoding="utf-8")
            touched.append(f"classes/{s}/vocab/index.html")
            pages += 1
        print(f"  {course:34} {len(terms):>3} terms · {'/'.join(langs)} · "
              f"{len(slugs)} class page(s)")
    print(f"{pages} vocabulary page(s) from {len(sources)} source file(s)")
    for p in sorted(set(touched)):
        print(f"PUBLISH: {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
