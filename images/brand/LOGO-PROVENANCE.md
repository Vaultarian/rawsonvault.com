# Vault Möbius Logo — Provenance & Canonical Source

*Established 2026-06-09. This file is the source of truth for which logo file is authoritative and why.*

## The one rule

**`vault-icon.png` (this folder) is the canonical runtime logo.** Everything that
renders the mark points here (directly, or via the `~/assets/vault-logo.png` symlink).
Do not reference the Thecus NAS or any other copy — those are not anchored storage.

| File | Role |
|---|---|
| `vault-icon.png` (1000×724) | **Canonical raster.** What LaTeX, the website, and letters use. |
| `vault-icon.svg` | **Vector master** — infinitely scalable, for large-format / print. See caveat below. |
| `~/assets/vault-logo.png` | Symlink → `vault-icon.png`. The path LaTeX templates include. |
| `_masters/vault-icon-master.psd` | **True design source** of the bronze mark (bronze + sparkle, 1000×724). |
| `_masters/vault-icon-master.tif` | Flattened high-bit master. |
| `_masters/vault-icon-1000.png` | Archival copy of the 2011 export (identical MD5 to `vault-icon.png`). |
| `_masters/vault-icon-ORIGINAL-2010.eps` | **Obsolete ancestor — do not use.** See below. |

## The lineage (verified 2026-06-09)

```
EPS (2010, Adobe Illustrator, CMYK/Pantone)   rose-brown, NO sparkle   ──► obsolete draft
        │  recoloured to bronze + sparkle added, in Photoshop
        ▼
PSD (bronze + sparkle, raster 1000×724)        ── TRUE SOURCE of the current mark
        │  flatten / export
        ▼
vault-icon.png (1000×724)                      ── canonical; everything uses this
        │  layered potrace re-interpretation (2026-06-09)
        ▼
vault-icon.svg                                 ── scalable vector master (banded gradient)
```

**Why the EPS is not the source.** It is the *earlier* artwork: it renders dusty
rose-brown `srgb(68%,55%,55%)` — not brand bronze `(190,130,68)` — and lacks the
star-sparkle. The bronze mark was rebuilt later in Photoshop. The EPS is kept only
as historical record. Promoting it would regress the brand colour and lose the sparkle.

**SVG caveat.** `vault-icon.svg` is a faithful *re-interpretation*, not a pixel copy.
potrace is monochrome, so the continuous gradient is approximated as ~7 bronze colour
bands. Use it where scale matters (big print). For exact-match raster use, prefer the PNG.
Rebuild with `~/AlfredOS/content-creator/build_vault_svg.py`.

## Where the mark is referenced (as of 2026-06-09)

All already resolve to the canonical file — no repointing needed:

- `~/vault/_Templates/Formal Letter Template.md` → `~/assets/vault-logo.png`
- `~/vault/01-Teaching/LaTeX/shared/cs-gcse-extension.tex` → `/home/alex/assets/vault-logo.png`
- `~/rawsonvault/ai/staff/index.html` → `../../images/brand/vault-icon.png`

## Brand bronze palette

Primary accent `#B88040` · deep `#883800` · light `#D0A880` · parchment `#E8D8C8`.
Full ramp in `~/rawsonvault/vault.css` (`:root`).
