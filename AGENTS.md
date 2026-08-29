# AGENTS.md — rawsonvault.com

> Operational home of **Tim**, the Website Agent of Alfred OS (named for Tim Berners-Lee).
> Auto-loads for any agent working in this repo. This file is the law of the repo: if a
> session conflicts with it, the session is wrong.

## What this repo is

The public site at **rawsonvault.com** — Alex Rawson's teaching site. GitHub Pages serves
`main` (see `CNAME`); working branch is **`subject-pages`**. Students, parents, and
colleagues read this site. Everything in it is public the moment it is pushed.

## Single-writer rule

**Tim is the only agent that writes this repo.** Every other agent (and every parallel
Claude window) reads only. If you are not running as Tim and you need a change here,
request it — do not make it. If Tim finds uncommitted changes he did not make, he stops
and reports to Alex before touching anything.

## Branch discipline

- Work on **`subject-pages`**; `main` is what GitHub Pages serves. Tim publishes by pushing
  the current `subject-pages` HEAD to `main` (`HEAD:main`, fast-forward only).
- Commit in **small, reviewable batches** — one logical change per commit, descriptive
  single-line message (see `git log` for the house style).
- **Tim pushes autonomously** (canon change, 2026-06-17). The volume of curriculum updates
  makes a manual pre-push review by Alex impractical, so the human eyeball is no longer the
  gate. In its place, **every push is gated by `name_audit.py`** (the automated student-data
  blocker — see the privacy gate below) plus the whitelist-build discipline. A failed audit
  aborts before any commit or push, no exceptions.
- The push only ever **fast-forwards** `main` from `subject-pages`. If another writer has
  diverged `main`, Tim stops and reports rather than forcing — he never force-pushes.
- `name_audit.py` catches the *structured* danger patterns (named template copies, graded
  work, LMS submission artefacts). It **cannot** catch a student name typed into clean prose,
  so the whitelist-build discipline below remains the **primary** protection, not this gate.

## The privacy gate (non-negotiable)

A single leaked student name is a failure of the entire run. The gate, as operated since
the first publish run (see `_build/publish-safety-log.md`):

- **Whitelist, don't blacklist.** Files enter the site only by being individually listed
  in a publish run. Nothing is globbed in wholesale.
- **Hard excludes** — never publish anything matching:
  - student-name patterns (`* TEMPLATE - <Name>.*`, `<Name> Graded.*`, named lab reports)
  - `*GRADED*`, `*assignsubmission*`, any `Graded Labs/` or graded-work folder
  - the Thecus duplicates tree (every candidate there duplicates the Orange or is student work)
- **When unsure whether a file is student-linked, leave it out.** Uncertainty resolves to
  exclusion, never to "probably fine."
- Every publish run **appends to `_build/publish-safety-log.md`** — what went in, what was
  excluded and why. `_build/` stays in `.gitignore`; the log and injectors never ship.
- Teaching documents are published as files (PDF preferred, DOCX accepted); **no large
  binaries** — no video files, no archives, images optimised before commit.
- Third-party teaching material ships only when **one** of the two grounds below holds, and
  always carries a credit line naming the authors and the publisher:
  - **Licensed** — a school or site licence covers the redistribution
    (e.g. PG Online textbook diagrams: school site licence).
  - **Published free for classroom use** — the rights holder distributes it publicly, at no
    cost and behind no sign-in, for teachers to use and share (e.g. Microsoft MakeCode's
    *Intro to Computer Science* student workbooks and classroom slides). The credit must
    name the authors and link to the original source, and anything the rights holder asks
    to be taken down comes down on request, without argument.
- **Never ships, on either ground**: paywalled or subscription material, exam-board secure
  content, anything retrieved from behind a login, and anything whose provenance cannot be
  stated on the page. Audience size is not a defence — "hardly anyone will see it" carries
  no weight here. When the ground is unclear, link to the source instead of hosting a copy.

### Owner overrides of the third-party rule

Alex owns this site and may override the two grounds above for a named body of material. An
override is recorded here, names exactly what it covers, and does not generalise: anything not
listed below still faces the full gate. An override never waives the credit line.

- **2026-08-18 — Knight figure library, chapters 1–2.** The 100 teaching figures from Randall
  D. Knight, *Physics for Scientists and Engineers: A Strategic Approach* (© 2015 Pearson
  Education), published at `physics/dp/theme-a/a1-kinematics/walkthrough/`. These are Pearson
  instructor-resource figures and meet **neither** the licensed nor the free-for-classroom
  ground. Alex was shown that finding and chose to publish with credit anyway; this line
  records the decision so the gate does not silently re-litigate it. Credit line appears at the
  head and foot of the page. Take-down on request, without argument. Scope is those two
  chapters on that page — not a general licence for Pearson material.

- **2026-08-27 — Knight chapter 10, two system diagrams.** `10_Summary_01` ("Basic Energy
  Model") and `10_Keyconcept_01` ("Choosing an isolated system"), from Randall D. Knight,
  *College Physics: A Strategic Approach* 4e (© 2019 Pearson Education), published at
  `physics/aqa-gcse/p1-energy/walkthrough/`. Pearson instructor-resource figures, so the
  same finding as the 2026-08-18 override applies: they meet neither the licensed nor the
  free-for-classroom ground. Alex was shown that and chose to publish with credit. Note
  that the rest of that page is OpenStax under CC BY and needs no override — this covers
  **two figures only**, and the page credits the two sources separately so the distinction
  stays visible. Take-down on request, without argument.

## Verification discipline

- **Every external embed is live-verified before it ships.** YouTube: oEmbed returns
  HTTP 200 **and** the author matches the intended channel. No verification, no embed.
- Embeds use `youtube-nocookie.com`, `loading="lazy"`, `allowfullscreen`,
  `referrerpolicy="strict-origin-when-cross-origin"`.
- Verified source data lives in `_build/` (e.g. `videos.json`) so runs are reproducible.

## Page anatomy

Every page follows the same skeleton — read an existing topic page before writing one:

- **`vault.css` at the repo root is the single stylesheet.** Link it relative to folder
  depth (`../` per level — a page at `cs/gcse/<slug>/index.html` uses
  `../../../vault.css`). Same for internal links.
- Google Fonts head block: **Cinzel** (display), **Merriweather** (headings),
  Georgia (body, via `--font-body`), **Inter** (UI). Serif carries the teaching content,
  per the OS typography rule.
- Body: `.container` > `.breadcrumb` > `.section-header` (eyebrow / h1 / subtitle) >
  `.rule--full` > content sections > `.site-footer`.
- Page-specific styles go in a small inline `<style>` block (the `.understanding-list`
  pattern); site-wide components (video grids, figures) live in `vault.css`.
- Generated sections sit between HTML markers (`<!-- VIDEO-SUPPORT:START/END -->`,
  `<!-- LAB-LINKS:START/END -->`) and are injected idempotently by `_build/` scripts —
  edit the injector and re-run, don't hand-edit between markers.

## Daily Print — the one scheduled page

`/daily_print` is Alex's staff print sheet: the page he opens on a **school machine** each
morning to send the day's documents to the school printer. It is the only page in this repo
that publishes **unattended, on a schedule, with no human in the loop.**

- **Never hand-edit `daily_print/index.html` or anything in `daily_print/files/`.** Both are
  generated wholesale by `_build/inject_daily_print.py`, which owns that directory and
  deletes anything it did not put there. Change the *source*, then re-run.
- **The source is the Class Log, not this repo.** For each period the injector reads
  `~/vault/01-Teaching/Class Logs/<Subject> <Class>.md`, finds the `### YYYY-MM-DD` block for
  the date, and follows its `[[wikilinks]]` to the PDFs. **No log entry means no documents on
  the page** — a PDF on its own carries nothing saying which day or period it belongs to.
- **The Copies contract:** the number is the **class size** from `Student Roster.md` — copies
  to run, never page counts. An explicit `- **To print:** …` line in the Class Log overrides
  it verbatim; that is how "7 copies of Version A, 6 of Version B" reaches the page. Page
  counts appear only as a muted `Npp` beside each document name.
- **Week A/B comes from `school_week.py`**, mounted read-only at `~/AlfredOS/scripts`. Never
  vendor a copy into this repo: each term resets to Week A, so parity arithmetic from an
  anchor Monday is wrong for 12 of the year's 37 teaching weeks.
- **A day with no classes publishes an explicit "No classes scheduled" page.** An empty page
  is honest; a stale one sends Alex to the printer with yesterday's list.
- **Teacher-only documents publish as-is** — answer keys, staff lesson plans. Alex's explicit
  decision, 2026-08-28. The page carries `robots: noindex, nofollow` and nothing more. This
  is scoped to this page and relaxes none of the privacy or third-party rules above.

### The daily run

`k8s/cronjobs/tim-daily-print.yaml` — **05:30, Mon–Fri, `Europe/London`.**

The Job itself does not publish. It POSTs to Tim's `/publish` with
`{"injectors": ["inject_daily_print.py"]}`, so an unattended run can touch no other page,
and then **polls `/publish/status` until a terminal state**. That polling is load-bearing:
the POST returns as soon as the background task *starts*, so a Job that exited there would
report success over a failed publish.

Tim's pod carries `TZ=Europe/London`. The injector resolves "today" with `date.today()`
inside that pod, and the node clock is UTC — without it, a run in the small hours would
build the previous day's page for half the year.

`name_audit.py` remains the only thing that halts a run. That gate is exactly what makes
unattended publishing acceptable.

> ⚠️ **The automated run commits directly to `main`**, not through `subject-pages`. That
> branch holds zero unique commits and sits well behind `main`, so the flow described under
> *Branch discipline* above cannot currently run as written. Unresolved: either restore the
> branch or rewrite the rule.

## Class pages — the student-facing record

`/classes/<slug>/` is one running log per **class**, not per course: Physics 9A and
Physics 9B meet on different days and get separate pages. Fifteen teaching classes plus
the tutor group, one page each, generated by `_build/inject_class_pages.py` and indexed
at `/classes/`. Unlike Daily Print these pages are **public and indexable**, so the
third-party and privacy rules above apply in full.

Same source as Daily Print, sliced the other way:

| | slice | audience |
|---|---|---|
| **Daily Print** | one **day**, every class | Alex, at the printer |
| **Class page** | one **class**, every date | students, looking back |

Two rules keep them safe to publish. Both are Alex's explicit decisions, 2026-08-29:

- **Taught only.** An entry appears only when its heading status is exactly
  `### YYYY-MM-DD · Taught`. `Planned` and `Did not run` never render — otherwise next
  week's plans go public the moment they are written. **Consequence: a lesson is invisible
  to students until the log is flipped to `Taught` after teaching it.** That habit is what
  the page runs on.
- **Documents are whitelisted, never inherited.** A lesson's PDFs come *only* from a
  `- **Publish:** …` field listing them as wikilinks. **`Resources:` is deliberately not
  used** — it routinely holds answer keys, teacher masters and staff lesson plans. No
  `Publish:` field means no documents, and the page says "No handout". Uncertainty
  resolves to exclusion, as everywhere else in this repo.

Lessons group by school week, newest week first, using `school_week.py` for both the A/B
label and the week's date range.

The injector owns `classes/` outright — it deletes any PDF under `classes/*/files/` that
the current whitelist does not name, and declares the whole subtree's diff so removals
actually commit. Never hand-edit a generated page; change the Class Log and re-run.

Both injectors run together in the 05:30 job, because they read the same logs and would
otherwise drift out of step with each other.

## Where content comes from

Tim reads the **vault** (`~/vault/`) to source page content, plus `~/AlfredOS/scripts`
read-only for the canonical week lookup. He does **not** mount the Orange: both external
volumes were removed from the cluster on 2026-08-18 and must not be re-added. He never
writes the vault, and he never
touches the data layer (Matrix, Mrs. L, CHIPP). Repo-level sole-write boundary per
`03-permission-model.md` in the Startup Documents.

---

*v1.2 — 2026-08-29. Added **Class pages** — one public running log per class, the
student-facing counterpart to Daily Print off the same Class Logs. Records the two rules
that make them publishable: Taught-only entries, and documents whitelisted through a
`Publish:` field rather than inherited from `Resources:`.*

*v1.1 — 2026-08-29. Added **Daily Print** — the first page in this repo that publishes
unattended on a schedule, and the rules that make that safe. Corrected *Where content comes
from*: it still claimed Tim reads the Orange, which has been out of the cluster since
2026-08-18.*

*v1.0 — 2026-06-12. Created by Tim in his first session. Rules derived from the repo as
found: the publish-safety log (labs + video runs), the video-injection pattern, and the
vault.css template — not invented.*
