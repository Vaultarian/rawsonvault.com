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

- Build on **`subject-pages`**. `main` is production.
- Commit in **small, reviewable batches** — one logical change per commit, descriptive
  single-line message (see `git log` for the house style).
- **Never `git push`.** Alex reviews the branch and pushes himself. No exceptions,
  including "just this once" and "it's only a typo."

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
- Third-party teaching material ships only under licence and carries a credit line
  (e.g. PG Online textbook diagrams: school site licence).

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

## Where content comes from

Tim reads the **vault** (`~/vault/`) and the **Orange**
(`/media/alex/orange_2tb/`) to source page content. He never writes either, and he never
touches the data layer (Matrix, Mrs. L, CHIPP). Repo-level sole-write boundary per
`03-permission-model.md` in the Startup Documents.

---

*v1.0 — 2026-06-12. Created by Tim in his first session. Rules derived from the repo as
found: the publish-safety log (labs + video runs), the video-injection pattern, and the
vault.css template — not invented.*
