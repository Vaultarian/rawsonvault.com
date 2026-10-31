# Vault Möbius Logo — Provenance & Canonical Source

*Established 2026-06-09. Updated 2026-06-15 (Martha finish + canon swap), and 2026-06-18
(reference list completed, symlink fan-out, original-pack de-dup). This file is
the source of truth for which logo file is authoritative and why.*

## The one rule

**`vault-icon.png` (this folder) is the canonical runtime logo.** Everything that
renders the mark points here (directly, or via the `~/assets/vault-logo.png` symlink).
Do not reference the Thecus NAS or any other copy — those are not anchored storage.

For convenience, `vault-logo.png` is symlinked from five places, every one pointing at
this canonical file: `~/assets/`, `~/Pictures/`, `~/Desktop/`, `~/vault/_Assets/Images/`,
and `~/` (home root). Because they are symlinks rather than copies, they track every
future regeneration of `vault-icon.png` automatically, so there is no risk of a stale
duplicate drifting out of sync (fan-out added 2026-06-18).

| File | Role |
|---|---|
| `vault-icon.png` (1000×924) | **Canonical raster.** What LaTeX, the website, and letters use. Sparkle-free bronze Möbius, edge stroke + drop shadow. |
| `vault-icon.svg` (924×854) | **Vector master** — true smooth-gradient vector, infinitely scalable. Martha's Illustrator finish. |
| `~/assets/vault-logo.png` | Symlink → `vault-icon.png`. The path LaTeX templates include. One of five `vault-logo.png` symlinks (see "The one rule"). |
| `_masters/vault-icon-martha-illustrator-2026-06-15.svg` | **Current true vector source** — Martha's Illustrator file (thickened creases, edge stroke, shadow). |
| `_masters/vault-icon-inhouse-vector-2026-06-13.svg` | Alfred's in-house vectorisation (smooth gradient, pre-Martha finish). |
| `_masters/The Vault_no_shine.psd` / `.png` | Martha's sparkle-removed lockup (1000×292). |
| `_masters/vault-ring-noshine.psd` / `.png` | Martha's sparkle-removed ring (the vectorisation input). |
| `_masters/vault-icon-master.psd` | The 2011 bronze+sparkle raster — source of the *previous* mark. Superseded. |
| `_masters/vault-icon-master.tif` | Flattened high-bit master of the 2011 mark. |
| `_masters/vault-icon-pre-martha-2026-06-15.png` | The previous canonical raster (bronze + sparkle), archived at the swap. |
| `_masters/vault-icon-potrace-2026-06-09.svg` | The retired banded-potrace SVG (first vector attempt). Superseded by the smooth vector. |
| `_masters/vault-icon-ORIGINAL-2010.eps` | **Obsolete ancestor — do not use.** See below. |

## The lineage (current as of 2026-06-15)

```
EPS (2010, Adobe Illustrator, CMYK/Pantone)    rose-brown, NO sparkle    ──► obsolete draft
        │  recoloured to bronze + sparkle added, in Photoshop
        ▼
PSD (bronze + sparkle, raster 1000×724)         ── source of the PREVIOUS mark (2011–2026)
        │  Martha removes the sparkle (Photoshop, 2026-06-12)
        ▼
no-shine PSD/PNG (sparkle-free bronze ring)     ── the vectorisation input
        │  Alfred vectorises in-house (vault-svg-gradient pipeline, smooth gradient, 2026-06-13)
        ▼
in-house vector SVG                             ── true smooth-gradient vector, no banding
        │  Martha finishes in Illustrator: thickened creases + edge stroke + drop shadow (2026-06-15)
        ▼
vault-icon.svg (924×854)                        ── canonical vector master
        │  rsvg-convert -w 1000 (transparent)
        ▼
vault-icon.png (1000×924)                       ── canonical raster; everything uses this
```

**Why the EPS is not the source.** It is the *earliest* artwork: dusty rose-brown,
no sparkle. Kept only as historical record.

**Why the 2011 PSD is no longer canonical.** It carries the star-sparkle, which the
brand has moved away from. Martha removed the sparkle (2026-06-12); the mark was then
rebuilt as a true vector and hand-finished. The PSD is retained as the source of the
previous (sparkle) era.

**The current mark is a real vector** (not the old banded potrace approximation). The
gradient is continuous, and the Illustrator finish adds a thin edge stroke and a baked-in
drop shadow. Note the shadow is *part of the mark*: on light backgrounds it reads as a
soft lift; at favicon sizes (≤32px) it adds weight and the Möbius twist muddies — expected,
and a known trade-off accepted 2026-06-15.

**To rebuild / re-export.** The vector truth is now the Illustrator file in
`_masters/vault-icon-martha-illustrator-2026-06-15.svg`. Re-export the SVG from there,
or re-render the raster with `rsvg-convert -w 1000 vault-icon.svg -o vault-icon.png`.
The in-house pipeline (`~/AlfredOS/content-creator/vault-svg-gradient/`) generates the
pre-finish vector if the gradient ever needs regenerating from the ring.

**The original design pack.** The `TheVaultD29aR04aP01ZL.*` original pack (29 files, the
complete superset) now lives in a single historical archive at
`~/vault/04-Resources/brand/rawsonvault/logos/`. It had been triplicated; the two
byte-identical copies under `~/Pictures/` were deleted 2026-06-18, along with strays — the
`~/Downloads/mobius.png`/`.psd` pair (md5-identical to `_masters/vault-ring-noshine.*`) and
a regenerable build output (`the-vault-logo.png`). One archive, no duplicates.

## The spinning ring (2026-10-31)

An animated version of the mark: a **true 3D Möbius strip** turning round its vertical axis.
Asked for by Alex for the **Create** button in Jos's LDLC (Level Devil Level Creator), chosen by
him because it *"most clearly shows the Möbius strip as precessing"*, and saved here as an
official logo.

| File | Role |
|---|---|
| `vault-ring-spin.webp` (256×256, 48 frames, one turn in 2.16 s, loops, transparent) | **Drop-in animated logo.** Use as a plain `<img>`; it spins forever. |
| `vault-ring-spin-strip.webp` (12288×256: 48 frames of 256×256 in one row, transparent) | **Picture strip** for a CSS spin that starts on hover from the first frame (`background-size` 48× the box, `animation: … steps(48)`). Jos's LDLC Create button uses a copy (`jos/ldlc/ring-spin.webp`). |

**How it is made: from the maths, not from a picture.** three.js `ParametricGeometry` of the
standard Möbius strip, x = (R + v·cos(u/2))·cos u, y = (R + v·cos(u/2))·sin u, z = v·sin(u/2),
with R = 1 and v from −0.32 to 0.32. It is rendered in bronze (`#c8884a`, metalness 0.7) with
three lights so the band never goes black, and tilted (−0.7, 0.3, 0.5 rad) to sit like the
logo while facing the viewer enough for the hole to show. The strip is one rigid object: only
the turn changes, so the shape never morphs. Alex asked for the hole to show more and a 10%
faster turn; that is this version (`HALF = .32`, 45 ms a frame). Files to remake it:
`render.html` and `capture.mjs` in
`~/vault/04-Resources/brand/rawsonvault/logos/spinning-ring-2026-10-31/`. Serve the folder over
http, run headless Chrome with remote debugging on 9333, then run
`node capture.mjs http://127.0.0.1:<port>/render.html frames 48`.

⚠️ **It is a new 3D model, not the vector master.** The band's proportions and shading are the
render's, not Martha's artwork. Use it as the moving mark only, never in place of `vault-icon.svg`.

**Alternatives, kept in the same archive folder, not on the site:**
- `alternative-coin-flip/`: the real logo picture squashed and flipped like a coin. Good, but
  Alex preferred the 3D turn.
- `fal-attempt-rejected/`: a fal.ai video (`fal-ai/pixverse/v6/transition`, about $0.18). The
  model reshaped the ring as it turned, so Alex rejected it. Lesson: a rigid spin of an
  existing shape is geometry, not generation.

## Where the mark is referenced

This list must stay complete: every place that renders the mark belongs here, or the
next canon swap leaves stragglers on the old artwork. That is exactly what happened — two
references below were missing from this list and were still pointing at the pre-canon
icon until 2026-06-18, when they were repointed to canon. Treat the list as load-bearing.

All now resolve to the canonical file:

- `~/vault/_Templates/Formal Letter Template.md` → `~/assets/vault-logo.png`
- `~/vault/01-Teaching/LaTeX/shared/cs-gcse-extension.tex` → `/home/alex/assets/vault-logo.png`
- `~/rawsonvault/ai/staff/index.html` → `../../images/brand/vault-icon.png`
- Mrs. L favicon / PWA icons → `~/AlfredOS/mrs_landingham/web/static/` (regenerated from this mark 2026-06-15)
- `~/AlfredOS/agents/scribe/weekly_grid.py` → `~/assets/vault-logo.png` (Scribe's weekly-calendar `LOGO_PATH`). Repointed 2026-06-18 from the old `~/vault/04-Resources/brand/rawsonvault/logos/icon only/TheVaultD29aR04aP01ZL_icon.png`; that stale path is why the weekly calendar PDFs were still stamping the pre-canon mark.
- AI Club S4E2 lesson ("Set the icon" deploy step) → `~/rawsonvault/images/brand/vault-icon.png`. Repointed 2026-06-18 from the old `~/Pictures/vault_logos/icon only/vault_icon_transparent.png`.
- Alfred's web front door → `~/AlfredOS/agents/alfred-web/web/` (`favicon.ico` and `apple-touch-icon.png` copied byte-identical from the site root; `vault-icon-192.png` for the in-page mark). Added 2026-09-13 when that service got its icon.
- **The spinning ring** (not the still mark): Jos's LDLC Create button → `jos/ldlc/ring-spin.webp`, a copy of `vault-ring-spin-strip.webp`. Added 2026-10-31.

## Brand bronze palette

Primary accent `#B88040` · deep `#883800` · light `#D0A880` · parchment `#E8D8C8`.
Full ramp in `~/rawsonvault/vault.css` (`:root`).
