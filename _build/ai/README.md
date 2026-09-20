# _build/ai — the AI Literacy page generator

Regenerates all 19 pages under `ai/students/` from one manifest. `_build/` is
the build system; it is never published.

```bash
cd ~/rawsonvault/_build/ai
python3 build_pages.py     # the 17 generated episode + stub pages
python3 patch_s4.py        # patches S4E1 and S4E2 in place
python3 build_hubs.py      # the four season hubs + the stub hub
python3 ~/AlfredOS/agents/tim/name_audit.py ~/rawsonvault
```

**`manifest.py` is the file you edit.** One row per page: title, subtitle, Gem
id, the question the episode turns on, the key words, and any page-specific
prose. Everything else — the prev/next chain, the breadcrumb, the corner logo,
the footer, the component order — is derived, so adding a component to all
nineteen pages is one edit to the skeleton rather than nineteen edits to HTML.

Two things the scripts will not do for you:

- **`patch_s4.py` edits S4E1 and S4E2 in place** rather than regenerating them,
  because those two carry bespoke markup (a hero, a verified embed, a data
  chart, the debate machinery) that no manifest describes. It is written to be
  idempotent — every step checks whether it has already run — but read its
  output rather than assuming.
- **Pages with an existing `.article` keep their prose.** The generator lifts
  the article and sources blocks out of the current HTML and rebuilds the frame
  around them. Supply an `article=` key in the manifest only when you mean to
  replace the writing.

Conventions: `ai/AI-PAGES.md`. Course spec: `~/vault/01-Teaching/AI Club/INTENT.md`.
