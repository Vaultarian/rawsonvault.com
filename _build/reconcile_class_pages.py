#!/usr/bin/env python3
r"""Reconciliation crawler -- find lessons whose documents never reached the site.

A document reaches a public class page ONLY through a `- **Publish:** …` line in
its Class Log entry. `Resources:` is private by design. So when the Publish line
is forgotten, the lesson is taught, the handout sits finished on disk, and the
students get nothing -- with no error, no gap on the page and nothing in a log.
That is the failure this script exists to make loud. (Found by Alex on
2026-09-05: Physics 8B, 31 Aug, EM spectrum -- taught, four resources, no
Publish line at all.)

It REPORTS. It never writes the repo and never publishes anything. The output is
a triage list for Alex, in three buckets:

  PUBLISH   -- looks wholly student-facing; safe to add to a Publish: line
  EYES      -- something in it needs a human look before it goes public
  WITHHELD  -- correctly private (staff plans, teacher masters, exam questions)

Two things stay true regardless of what this says, and are why nothing is
auto-published:

  1. Publishing a PDF publishes EVERY page of it, and `name_audit.py` cannot see
     inside a PDF. On 2026-08-29 a two-page file whose second page was a teacher
     master naming colleagues was nearly published. Check the last page.
  2. OCR/AQA past-paper questions are centre-licensed. The tell is the CITATION
     LINE (`J277/01 · June 2022`), not the words "Exam question" -- Alex writes
     his own items under that label. Where a `-web` build exists it omits the
     exam boxes and is the publishable output; this script points at it.

Usage:
    ~/AlfredOS/.venv/bin/python3 _build/reconcile_class_pages.py [--verbose]
    ... --class "Physics 8B"     one log only
    ... --json                   machine-readable, for later wiring into a job
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

HOME = Path.home()
sys.path.insert(0, str(Path(__file__).resolve().parent))

from inject_class_pages import parse_log, LOGS, slug            # noqa: E402
from inject_daily_print import field, pdf_links, VAULT          # noqa: E402

# ── classification signals ──────────────────────────────────────────────────

# Filename fragments that mean "not for students", full stop. A staff lesson
# plan or a teacher master is written to be read by Alex alone.
STAFF_NAME = re.compile(r"(?:^|[-_])(plan|master|teacher|staff|notes)(?:[-_]|\.pdf$)", re.I)

# The same idea in the wikilink LABEL, which is the strongest signal available
# because Alex types it himself: `[[…/y8-l03.pdf|Staff lesson plan]]`. Cheaper
# and more reliable than any inference from the file's contents.
STAFF_LABEL = re.compile(r"\b(staff|teacher|master|lesson plan|plan)\b", re.I)

# Teacher-facing text INSIDE the document. This is the check that matters most,
# because it is the only one that sees past page 1. `p2-electricity-audit.pdf`
# is the case in point: page 1 is a clean student self-audit, page 2 is headed
# "Teacher master — 11R coverage vs 11Q" and names two colleagues. A filename
# check and a first-page check both pass it.
STAFF_TEXT = re.compile(
    r"teacher\s+(?:master|copy|notes?|version)|staff\s+lesson\s+plan|"
    r"for\s+the\s+teacher|teacher[-\s]only|lesson\s+plan\b|"
    # A reconstruction of a colleague's course from their OneNote notebook.
    # Both rm-progression-cs-*.pdf are this: internal handover records that
    # read as neutral tables, so only the OneNote reference gives them away.
    r"OneNote", re.I)

# Answer keys. Publishable as of Alex's decision, 2026-09-05: the class moves
# fast enough that a student who takes the time to check their working against a
# key is doing exactly the thing the key is for.
ANSWER_NAME = re.compile(r"(?:^|[-_])(answers?|answer-key|solutions?|mark-?scheme)(?:[-_]|\.pdf$)", re.I)

# The licensing tell. A real past-paper item carries its provenance:
#   'J277/01 · June 2022'   '8463/1F  Nov 2021'   'Paper 2 · June 2019'
# The words "Exam question" alone are NOT the tell -- Alex labels his own items
# that way, and the -web build strips by citation, not by label.
EXAM_CITE = re.compile(
    r"(?:J\d{3}/\d{2}|8\d{3}/\d[FH]?|Paper\s*[12])\s*[·•|,-]?\s*"
    r"(?:Jan|Feb|Mar|May|June|Jun|Nov|Oct)\w*\s*20\d\d", re.I)

# Named humans. Two shapes, both weak on their own and both worth surfacing:
#   honorific + surname  -- 'Mr Day to prepare the trays', a teacher master
#   possessive           -- "Sharon's 11R column", the shape that nearly shipped
# Neither catches a bare first name in running prose. Nothing automated will,
# which is exactly why the EYES bucket exists and why nothing auto-publishes.
HONORIFIC = re.compile(r"\b(?:Mr|Mrs|Ms|Miss|Dr|Sir|Madame)\.?\s+([A-Z][a-z]{2,})")
POSSESSIVE = re.compile(r"\b([A-Z][a-z]{2,})['’]s\b")

# Alex himself, and the eponyms physics is made of. A page about Hooke's law
# must not be held back for naming Hooke.
KNOWN_NAMES = {
    "Rawson", "Alex",
    # Sentence-openers that the possessive pattern otherwise reads as people:
    # "What's the unit?", "Today's lesson", "Everyone's answer".
    "What", "That", "This", "There", "Here", "Today", "Tomorrow", "Yesterday",
    "Who", "One", "Each", "Everyone", "Someone", "Nobody", "Anyone", "Let",
    "Student", "Teacher", "Class", "Year", "Week", "Monday", "Tuesday",
    "Wednesday", "Thursday", "Friday", "The", "It", "You", "World", "Nature",
    "Physics", "Design", "Science", "Computer",
    "Hooke", "Newton", "Ohm", "Kirchhoff", "Boyle", "Charles", "Snell",
    "Faraday", "Lenz", "Coulomb", "Joule", "Watt", "Kelvin", "Celsius",
    "Fahrenheit", "Ampere", "Volta", "Doppler", "Bernoulli", "Archimedes",
    "Einstein", "Planck", "Bohr", "Rutherford", "Huygens", "Fleming",
    "Pascal", "Hertz", "Tesla", "Maxwell", "Galileo", "Curie", "Moore",
    "Earth", "Moon", "Google", "Britain", "Scotland", "England", "Leonards",
}

# Bare given names, the shape that defeats both patterns above. Two real cases
# found on 2026-09-05: "Sharon's 11R column is blank" on the last page of
# p2-electricity-audit.pdf, and "the order Robert MacGregor actually taught in"
# in rm-progression-cs-2024-26.pdf -- a reconstruction of a colleague's teaching
# that has no business on a public site. Neither carries an honorific.
#
# Deliberately a common-given-names list rather than a full-name regex: Title
# Case is everywhere in a handout ("Game Lab", "Data Representation") and a
# structural pattern flags all of it. This fires only on EYES, so a false
# positive costs a glance, not a withheld handout. It is INCOMPLETE by nature
# -- add names as they are found; it is a net, not a proof.
GIVEN_NAMES = {
    "Aaron", "Adam", "Adrian", "Aisha", "Alan", "Alice", "Amy", "Andrew",
    "Angela", "Anna", "Anne", "Barbara", "Ben", "Beth", "Brian", "Callum",
    "Carol", "Catherine", "Charlotte", "Chloe", "Chris", "Claire", "Colin",
    "Craig", "Daniel", "David", "Dawn", "Debbie", "Diane", "Donald", "Douglas",
    "Duncan", "Eleanor", "Elizabeth", "Emily", "Emma", "Eric", "Ewan", "Fiona",
    "Frank", "Gary", "Gemma", "George", "Gordon", "Graham", "Hannah", "Harry",
    "Heather", "Helen", "Iain", "Ian", "Isla", "Jack", "James", "Jane", "Janet",
    "Jason", "Jennifer", "Jenny", "Jessica", "Joel", "John", "Jonathan",
    "Joseph", "Julia", "Julie", "Karen", "Katherine", "Kathryn", "Keith",
    "Kevin", "Kirsty", "Laura", "Lauren", "Leah", "Lewis", "Linda", "Lisa",
    "Louise", "Lucy", "Malcolm", "Margaret", "Martin", "Mary",
    # "Mark" is deliberately absent: it collides with "Mark scheme" and "Mark
    # on your drawing", which appear in nearly every physics handout. A name
    # that fires on every document tells Alex nothing.
    "Matthew", "Megan", "Michael", "Michelle", "Morag", "Murray", "Neil",
    "Nicola", "Nicholas", "Olivia", "Patricia", "Patrick", "Paul", "Peter",
    "Philip", "Rachel", "Rebecca", "Richard", "Robert", "Rory", "Ross", "Ruth",
    "Ryan", "Sally", "Samuel", "Sandra", "Sarah", "Scott", "Sean", "Sharon",
    "Simon", "Sophie", "Stephen", "Steven", "Stuart", "Susan", "Thomas",
    "Timothy", "Tom", "Tracy", "Victoria", "Vincent", "William", "Zoe",
}
# The household, plus Alex. Their names in a teaching document are not a leak.
HOUSEHOLD = {"Alex", "Tess", "Roran", "Annie", "Jos"}

# A hold Alex wrote himself. An empty `Publish:` is usually a forgotten line --
# that is the whole premise of this script -- but sometimes it is a DECISION,
# recorded in the entry as a ⛔ marker or an HTML comment. Three of the first
# twenty-nine candidates turned out to be these, and all three would have been
# wrong to publish:
#
#   CS 10, 3 Sep  -- "⛔ Publish: must stay empty. The Do Now reproduces OCR
#                    past-paper questions" -- and no citation line to detect,
#                    because Alex rewrote the item. He predicted this exactly:
#                    "nothing automated will catch this".
#   Physics 10 P, 2 Sep -- Energy 2 held because the scheme of work moved Energy
#                    to ~February, so publishing it would present it as current.
#   CS 11, 2 Sep  -- the colleague-facing half of a pair, already marked ⛔.
#
# So: a documented hold outranks every signal below. The crawler proposes
# nothing from an entry that carries one, and says why.
# Scope matters here. ⛔ is Alex's general warning marker and appears freely in
# `Notes:` for things that have nothing to do with publishing ("⛔ Never switch
# the section to Self-Paced Game Lab"). Matching it entry-wide held back nine
# documents instead of three. So a hold is recognised in exactly two places:
#
#   ENTRY-LEVEL -- inside the `Publish:` field itself, or the specific sentence
#                  "Publish: must stay empty" wherever it is written.
#   FILE-LEVEL  -- a ⛔ on the same line as that file's own wikilink, which is
#                  how Alex marks one resource of several ("⛔ teacher
#                  reference, names a colleague"). Its sibling on the next line
#                  is marked ✅ and must still publish.
HOLD_IN_PUBLISH = re.compile(r"⛔|<!--.*?-->", re.S)
HOLD_SENTENCE = re.compile(r"Publish:?\*{0,2}\s*must stay empty", re.I)


def file_marker(block, filename):
    """Alex's own verdict on this one file: '⛔', '✅', or None.

    An entry-level hold is usually about ONE of several resources, and Alex
    marks which: in CS 11 on 2 Sep the two progression PDFs sit on consecutive
    lines, one ✅ 'student-facing, both pages' and one ⛔ 'names a colleague'.
    A file-level marker therefore outranks the entry-level hold in both
    directions -- it is the more specific statement of the same intent.
    """
    for ln in block.splitlines():
        if filename in ln:
            if "⛔" in ln:
                return "⛔"
            if "✅" in ln:
                return "✅"
    return None

# Structured danger patterns, mirrored from name_audit.py's intent.
GRADED = re.compile(r"\b(TEMPLATE\s*-\s*[A-Z]|GRADED|assignsubmission|Submitted by)\b")


def pdf_text(path, pages=None):
    """Extracted text, or '' if the PDF cannot be read. Never raises."""
    try:
        from pypdf import PdfReader
        r = PdfReader(str(path))
        sel = r.pages if pages is None else [r.pages[i] for i in pages if i < len(r.pages)]
        return "\n".join((p.extract_text() or "") for p in sel)
    except Exception:
        return ""


def web_sibling(path):
    r"""The `-web` build of this PDF, if one exists on disk.

    House convention (2026-08-30): one source, three outputs -- print, answers,
    and a `\def\webversion{}` build that omits every exam box and IS
    publishable, with pagination identical.
    """
    cand = path.with_name(path.stem + "-web.pdf")
    return cand if cand.exists() else None


RANK = {"PUBLISH": 0, "EYES": 1, "WITHHELD": 2}


def classify(path, label=None):
    """(bucket, [reasons]) for one unpublished PDF.

    Every signal is collected and the STRICTEST bucket wins, rather than the
    first match returning early. That ordering matters: a file can look like a
    clean handout by filename and still carry a teacher master on its last page,
    and an early return on the friendly signal is exactly how such a file gets
    published. The reasons are all reported so Alex can see what fired.
    """
    name, signals = path.name, []

    def sig(bucket, why):
        signals.append((bucket, why))

    # An answer key's "TEACHER ONLY" label was written before Alex's 2026-09-05
    # decision to publish keys, so on a key the label is evidence of an old
    # policy rather than of danger. Downgrade it to EYES -- his call to flip,
    # not this script's. Every other signal on the same file still stands.
    is_key = bool(ANSWER_NAME.search(name))
    stale = "EYES" if is_key else "WITHHELD"

    if STAFF_NAME.search(name):
        sig(stale, "staff plan / teacher master (filename)")
    if label and (STAFF_LABEL.search(label) or "teacher only" in label.lower()):
        sig(stale, f'Class Log calls it "{label}"'
                   + (" — label predates the 2026-09-05 answer-key decision"
                      if is_key else ""))

    text = pdf_text(path)
    if not text.strip():
        sig("EYES", "no extractable text — nothing can check inside it")
    else:
        if GRADED.search(text):
            sig("WITHHELD", "matches a graded-work / submission pattern")

        m = STAFF_TEXT.search(text)
        if m:
            # Say WHERE, because "page 2 of 2" is the 2026-08-29 shape exactly.
            sig("WITHHELD", f'teacher-facing text inside it: "{m.group(0)}"'
                            f"{page_of(path, m.start(), text)}")

        cite = EXAM_CITE.search(text)
        if cite:
            web = web_sibling(path)
            if web:
                sig("EYES", f"licensed exam questions ({cite.group(0).strip()}) — "
                            f"publish {web.name} instead")
            else:
                sig("WITHHELD", f"licensed exam questions ({cite.group(0).strip()}) — "
                                "needs a -web build first")

        people = {m for m in HONORIFIC.findall(text) if m not in KNOWN_NAMES}
        people |= {m for m in POSSESSIVE.findall(text) if m not in KNOWN_NAMES}
        # A given name followed by an eponym surname is the physics, not a
        # person in the building: "In the 1840s James Joule had an idea."
        # Each word is tested on its own and the following word is looked at
        # without consuming it -- a single two-word pattern would swallow the
        # name it was meant to test ("Seneca Paul Long" hid Paul behind Seneca).
        for m in re.finditer(r"\b([A-Z][a-z]{2,})\b", text):
            g = m.group(1)
            if g not in GIVEN_NAMES or g in HOUSEHOLD:
                continue
            nxt = re.match(r"\s+([A-Z][a-z]{2,})\b", text[m.end():])
            if not (nxt and nxt.group(1) in KNOWN_NAMES):
                people.add(g)
        if people:
            sig("EYES", f"names a person who is not Alex: {', '.join(sorted(people))}")

    if not signals:
        return ("PUBLISH",
                ["answer key — publishable per Alex, 2026-09-05"]
                if ANSWER_NAME.search(name) else ["reads as a student handout"])

    worst = max(signals, key=lambda s: RANK[s[0]])[0]
    return worst, [w for b, w in signals if b == worst]


def page_of(path, offset, text):
    """' (page N of M)' for a character offset into the joined text, or ''."""
    try:
        from pypdf import PdfReader
        pages = [(p.extract_text() or "") for p in PdfReader(str(path)).pages]
    except Exception:
        return ""
    run = 0
    for i, p in enumerate(pages, 1):
        run += len(p) + 1
        if offset < run:
            return f" (page {i} of {len(pages)})"
    return ""


# ── the crawl ───────────────────────────────────────────────────────────────

def entry_blocks(path):
    """{date: raw block text} for every dated entry in a log.

    parse_log() gives structure but drops the raw text, and the raw text is what
    holds the wikilinks outside the Publish: field.
    """
    blocks, cur, buf = {}, None, []
    for ln in path.read_text().splitlines():
        if ln.startswith("### "):
            if cur:
                blocks[cur] = "\n".join(buf)
            m = re.match(r"(\d{4}-\d{2}-\d{2})", ln[4:].strip())
            cur, buf = (date.fromisoformat(m.group(1)) if m else None), []
        elif cur:
            buf.append(ln)
    if cur:
        blocks[cur] = "\n".join(buf)
    return blocks


def dead_publish_links(block):
    """Publish: wikilinks whose target does not exist on disk.

    pdf_links() silently drops a missing file, so a typo in a Publish line
    removes the document from the site with no complaint anywhere. This is the
    only place that failure is visible.
    """
    dead = []
    for target, _label in re.findall(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]",
                                     field(block, "Publish")):
        t = target.strip()
        if t.lower().endswith(".pdf") and not (VAULT / t).exists():
            dead.append(t)
    return dead


def crawl(only=None, today=None):
    today = today or date.today()
    report = []

    for path in sorted(LOGS.glob("*.md")):
        name = path.stem
        if only and only.lower() not in name.lower():
            continue
        _sub, entries = parse_log(path)
        blocks = entry_blocks(path)

        for en in entries:
            # A ⏩ entry publishes ahead of its date, so it must be audited now
            # rather than on the day. Skipping it would let a document reach
            # the site having never been classified -- the exact hole this
            # crawler exists to close.
            if en["status"].strip().lower() == "did not run":
                continue
            if en["date"] > today and not en.get("now"):
                continue
            block = blocks.get(en["date"], "")

            published = {p for p, _ in pdf_links(field(block, "Publish"))}
            available = [(p, lbl) for p, lbl in pdf_links(block)]

            missing = [(p, lbl) for p, lbl in available if p not in published]
            dead = dead_publish_links(block)
            if not missing and not dead:
                continue

            # Which of the four cases is this?
            if not re.search(r"^-\s*\*\*Publish:?\*\*", block, re.M):
                case = "no Publish: line at all"
            elif not published and not dead:
                case = "Publish: line present but empty"
            elif missing:
                case = "Publish: omits some available documents"
            else:
                case = "Publish: points at a file that does not exist"

            # A hold Alex recorded in the entry outranks every content signal.
            pub_field = field(block, "Publish")
            hold = HOLD_IN_PUBLISH.search(pub_field) or HOLD_SENTENCE.search(block)
            items = [dict(file=p.name, path=str(p.relative_to(VAULT)),
                          label=lbl, bucket=b, reasons=r)
                     for p, lbl in missing for b, r in [classify(p, lbl)]]
            for it in items:
                if it["bucket"] != "PUBLISH":
                    continue
                mark = file_marker(block, it["file"])
                h = hold if hold else None
                if mark == "⛔":
                    it["bucket"] = "EYES"
                    it["reasons"] = ["this file's own line in the entry carries a ⛔"]
                elif mark == "✅":
                    it["reasons"] = ["you marked this file ✅ in the entry"]
                elif h:
                    it["bucket"] = "EYES"
                    it["reasons"] = ["entry carries a hold you wrote: "
                                     + " ".join(h.group(0).split())[:110]]

            report.append(dict(
                klass=name, slug=slug(name), date=en["date"].isoformat(),
                status=en["status"], topic=en["topic"][:90], case=case,
                held=bool(hold),
                published=sorted(p.name for p in published),
                dead=dead, missing=items,
            ))
    return report


# ── output ──────────────────────────────────────────────────────────────────

MARK = {"PUBLISH": "+", "EYES": "?", "WITHHELD": "-"}


def render(report, verbose=False):
    out, tally = [], {"PUBLISH": 0, "EYES": 0, "WITHHELD": 0}
    for r in report:
        out.append(f"\n{r['klass']}  ·  {r['date']}  ·  {r['status'] or '—'}")
        out.append(f"  {r['case']}")
        if verbose and r["topic"]:
            out.append(f"  topic: {r['topic']}")
        if r["published"]:
            out.append(f"  already live: {', '.join(r['published'])}")
        for d in r["dead"]:
            out.append(f"  !  BROKEN LINK in Publish: {d}")
        for m in r["missing"]:
            tally[m["bucket"]] += 1
            out.append(f"  {MARK[m['bucket']]} [{m['bucket']:8}] {m['file']}")
            for why in m["reasons"]:
                out.append(f"                 {why}")

    n_docs = sum(tally.values())
    out.append("")
    out.append("─" * 68)
    out.append(f"{len(report)} entry(ies) across "
               f"{len({r['klass'] for r in report})} class(es); {n_docs} document(s)")
    out.append(f"  + safe to publish   {tally['PUBLISH']:>3}")
    out.append(f"  ? needs your eyes   {tally['EYES']:>3}")
    out.append(f"  - correctly held    {tally['WITHHELD']:>3}")
    broken = sum(len(r["dead"]) for r in report)
    if broken:
        out.append(f"  ! broken links      {broken:>3}")
    out.append("")
    out.append("Nothing was written. Classification is advisory: a PDF publishes")
    out.append("every one of its pages, and name_audit.py cannot read inside one.")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--class", dest="klass", help="restrict to one Class Log")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--verbose", "-v", action="store_true")
    a = ap.parse_args()

    report = crawl(only=a.klass)
    print(json.dumps(report, indent=2) if a.json else render(report, a.verbose))


if __name__ == "__main__":
    main()
