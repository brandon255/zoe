# Zoe anatomy atlas (prebaked views)

**Purpose:** Instant clinical views for Friday demo — not live generative video.

## Required slots (filenames)

| File | Clinical view |
|------|----------------|
| `full-front.webp` | Standing / seated front overview |
| `full-back.webp` | Posterior overview |
| `full-side.webp` | Lateral overview |
| `lithotomy.webp` | Lithotomy / pelvic exam position |
| `abdomen-close.webp` | Abdominal region |
| `pelvis-external.webp` | External pelvic exam view |
| `cervix-speculum.webp` | Speculum / cervical inspection (clinical still) |
| `husband-beside.webp` | Optional: supportive partner present (clinical, non-sensual) |

Until baked: UI falls back to procedural R3F patient + labels.

## Source stills (bake from)

Prefer athletic AI-human Zoe stills under repo `zoe/images/`:

- Canonical: `zoe/images/zoe_body_outfit_1785758051.png`
- Others: `zoe_body_*.png`, `zoe_fullbody_*.png`

Do **not** pull intimate companion poses from `persona/` or adult pose folders into this atlas.

## Bake (manual / MiniMax stills)

1. Export or generate clinical-appropriate stills into the filenames above.
2. Keep under ~800KB each (WebP preferred).
3. `npm test` in `clinical/` must still pass (source-policy: no unauthorized school branding).
