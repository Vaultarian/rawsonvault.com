# AI-PAGES.md — the /ai/ component system

> Conventions for every page under `rawsonvault.com/ai/`. The publishing
> contract above this file is `AGENTS.md` at the repo root; where the two
> disagree, `AGENTS.md` wins. The course spec is
> `~/vault/01-Teaching/AI Club/INTENT.md`.
>
> Start a new page by copying `_build/ai-episode-template.html`.

---

## The one rule that breaks everything

**Every page under `/ai/` carries `<body class="ai-page">`.**

Each component below is defined in `vault.css` under that prefix. Drop the class
and the page renders as unstyled text — no error, no warning, just a wall of
default serif.

The prefix is not decoration. `.article`, `.question-box` and `.doc-icon` are
already used by about sixty Physics and Computer Science topic pages and by
`test/worksheet-demo.html`, where they carry **no styling on purpose**. An
unscoped rule in `vault.css` would silently restyle all of them. Anything added
to the AI Literacy section of `vault.css` keeps the prefix.

The corollary: **a page-level override must carry the prefix too.**

```css
/* in the page's inline <style> */
.ai-page .documents { margin-top: 0; }   /* wins  — 0,2,0 */
.documents          { margin-top: 0; }   /* loses — 0,1,0 */
```

---

## Where CSS lives

| | Goes in |
|---|---|
| Used by more than one page, or by any future page | **`vault.css`**, AI Literacy Course section, `.ai-page`-prefixed |
| Used by exactly one page, and specific to its subject | the page's inline `<style>` block |

This is the repo-wide rule from `AGENTS.md` ("page-specific styles go in a small
inline `<style>` block; site-wide components live in `vault.css`"), applied here.

S4E2 is the worked example of the split: its debate machinery — `.hero-split`,
`.callout`, `.mech`, `.arena`, `.punch`, `.dc-rank`, `.h2h`, `.stretch` —
stays inline because it describes one lesson, while everything reusable was
hoisted out on 2026-09-19.

**Before writing a new inline rule, check whether the component already exists.**
Until this refactor, `.article p { margin-bottom: var(--gap-md); }` had been
retyped on fourteen separate pages.

---

## Component vocabulary

### Page frame

| Class | What it is |
|---|---|
| `.page-top` | Flex row holding the breadcrumb and the corner logo |
| `.corner-logo` | The Vault mark, top right, linking home. 56px, 44px on mobile |
| `.hero-banner` | Full-width image above the title. Optional |
| `.section-header` | Eyebrow / `h1` / subtitle. Defined site-wide, not AI-specific |
| `.ep-big` | Oversized episode code inside the `h1` — `<h1><span class="ep-big">S4E2</span> Title</h1>` |

### Content

| Class | What it is |
|---|---|
| `.article` | The lesson prose. **One per page**, and the objectives list goes inside it |
| `.question-box` | The single question the episode turns on. One sentence |
| `.vocab` | A `<dl>` of key words: `dt` term, `dd` plain-English definition |

### Documents

| Class | What it is |
|---|---|
| `.documents` | The bordered block of handouts, readings and links |
| `.documents--flush` | Modifier: no top margin, for a block sitting straight under a hero or rule |
| `.doc-list` | The `<ul>` inside it |
| `.doc-icon` | 22px file-type icon from `images/third-party/` |
| `.doc-meta` | The right-hand format pill — PDF, Google Doc, Live bot |
| `li.doc-soon` | Announced but not yet linked. Greyed, no anchor |
| `li.doc-dual` | One document in several formats: `.doc-label` left, `.doc-actions` right |
| `.fmt-btn` | A format button inside `.doc-actions`. Its `<span>` label hides under 640px |

### Sources

| Class | What it is |
|---|---|
| `.sources` | The citations block |
| `.sources .tag` | The small category pill — Core, Counter, Journal, Data, Frame |
| `.trust-note` | The check-it-yourself line at the head of the block |

### The bot link

| Class | What it is |
|---|---|
| `.gem-link` | Centred wrapper around the bot button |
| `.gem-btn` | The button itself |
| `.gem-note` | The line under it saying who can open it |

### Season hubs

| Class | What it is |
|---|---|
| `.ep-row` | One episode row, an `<a>` — `.ep-code`, `.ep-title`, `.ep-sub` inside |
| `.ep-soon` | An episode listed but not yet built. Not a link |

### Navigation

| Class | What it is |
|---|---|
| `.ep-nav` | Prev/next pair, between the last content section and the footer |
| `.ep-nav-prev` / `.ep-nav-next` | The two sides |
| `.ep-nav-dir` | "← Previous" / "Next →" |
| `.ep-nav-name` | The neighbouring episode's title |

**The prev/next convention.** Prev and next are the neighbours **within the
course**, not within the folder — the last episode of a season points forward to
the first of the next season, and back the other way. At either end of the whole
course, replace the missing side with an empty `<span></span>` so the remaining
link stays aligned to its own edge. Every episode page carries the block; the
season hubs do not.

*No page carried prev/next before 2026-09-19. The component exists and is
styled; wiring the twenty pages together is the levelling batch's job.*

---

## Retired names

Settled 2026-09-19. Two components had grown two names each, and the bot
component is being renamed with the platform migration.

| Retired | Use instead | Status |
|---|---|---|
| `.chipp-block` (episode pages) | `.chipp-wrap` | **Gone.** Renamed on S1E1–S1E4 |
| `.readings` | `.sources` | Alias kept in `vault.css`. Still on S3E2 and S3E3 |
| `.chipp-wrap` | `.gem-link` | Alias. Live on nine pages |
| `.chipp-btn` | `.gem-btn` | Alias. Live on thirteen pages |

> ⚠️ **`.chipp-block` still exists in `vault.css` and is not retired** — it is
> the QR-code panel on `/ai/students/`, a different component that happened to
> share the word. It was the episode-page `.chipp-block` that collided with it,
> and that one is gone. Do not delete the survivor.

**The Chipp → Gems rename.** Chipp was chosen for Perth & Kinross: anonymous, no
sign-in. At St Leonards the sanctioned pupil-facing route is a **Gem inside the
school tenant**, where pupils sign in as themselves and use is audit-logged. So
the class name changes with the platform, and `.gem-link` / `.gem-btn` are the
names for every new and rebuilt page. The old names stay as aliases only so the
fifteen existing pages do not break mid-migration; they retire when the last one
is rebuilt.

⚠️ **A Gem link is tenant-bound.** It is dead for everyone outside
`stleonards-fife.org`, Alex's own personal account included, while the page
itself stays public. So a page whose content is "press this to begin" is a dead
page for most of its readers. **Write the lesson so the page teaches it**, and
say under the button who the button is for.

There is no Gemini icon in `images/third-party/` yet — `chipp.png` is the only
bot mark the repo holds. One is needed before the first rebuilt page ships.

---

## Writing rules that reach the markup

- **Positive instruction.** A student-facing page says what to do, then gives a
  check that confirms success. The check is what replaces the warning. Tells to
  avoid: *watch out, be careful, don't forget, a common mistake, the trap here,
  avoid.* Genuine hazards and licence restrictions are the exception, and naming
  a real difference is a definition rather than a warning.
- **Present tense, live course.** *"In this lesson you will…"*, never *"this
  lesson ran at Perth High School in 2025."* Nothing on any page claims Perth.
  The footer reads `AI Literacy Course · Season N · 2026`.
- **Student-safe only.** No teacher notes, answer keys, mark schemes, timings or
  reflection answers. Each page is a deliberate extraction from the curriculum
  file, never a conversion of the whole lesson.
- **Ground every page in its source.** A model asked to write about a topic will
  write fluently about the wrong one. Name the curriculum file the page was
  built from, and do not resolve a bot/lesson name mismatch by inventing a third
  name.
- **Third-party material ships with provenance** — authors and publisher, every
  time. Embeds are live-verified, `youtube-nocookie` only. Full rule in
  `AGENTS.md`.

---

## Light and dark

`vault.css` is a **single-theme (light) stylesheet**. It declares no
`prefers-color-scheme` block anywhere, and the only page in the repo that does is
`physics/aqa-gcse/p2-electricity/series-parallel-3d/`, a self-contained widget.

The AI components follow that convention: they theme through the brand tokens in
`:root` — `--bronze-core`, `--ink-black`, `--gray-dark` and the rest — and hard
code a colour only where the original inline rule did (`#fdf9f4`, `#f0ece4`,
`#faf6ef`). If the site ever gains a dark theme it gains it by redefining those
tokens in one place, not by forking each component. New components should reach
for a token first.

---

## Verification before publishing

```bash
python3 ~/AlfredOS/agents/tim/name_audit.py ~/rawsonvault
```

A failed audit aborts before any commit or push, no exceptions. It catches the
structured danger patterns; it **cannot** catch a student's name typed into clean
prose, and it cannot read inside a PDF. The whitelist discipline is the primary
protection — see `AGENTS.md`.

---

*v1.0 — 2026-09-19. Written with the component hoist. The fifteen pages under
`/ai/students/` had none of these components in `vault.css`: each was duplicated
inline 13–17 times, so a style change was a fifteen-file edit. 141 inline rule
copies were removed into one `.ai-page`-scoped section of `vault.css`, two
duplicate names were settled, the bot component was given its forward name, and
the `.article` close/re-open bug was fixed on the eight pages carrying it.*
