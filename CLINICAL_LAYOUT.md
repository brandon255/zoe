# Zoe clinical layout (ICM)

**Updated:** 2026-08-05  
**Repo:** `https://github.com/brandon255/zoe.git`  
**Rule:** One clinical app. One atlas. Duplicates live in `_archive/` only.

## Canonical tree (ship here)

```
zoe/
├── clinical/                 ← Friday demo app (Vite + React + R3F)
│   ├── src/                  ← UI, encounter, tray, atlas wiring
│   ├── public/zoe-atlas/     ← Prebaked AI Zoe anatomy views (PNG/WebP)
│   ├── public/models/        ← Optional GLB figures
│   └── test/                 ← npm test (must stay green)
├── images/                   ← Source stills for atlas bake (canonical AI Zoe)
├── assets/                   ← face.png + shared media
├── webui/                    ← Zoom-style chat shell (backup tile, not WebRTC)
├── persona/                  ← DO NOT use zoe.md for clinical (intimate companion)
├── avatar-pipeline/          ← Optional ML wardrobe tab (Python) — backup only
├── _archive/                 ← Frozen duplicates — do not run for demos
│   └── medstage-duplicates/
└── CLINICAL_LAYOUT.md        ← This map
```

## What was archived (2026-08-05)

| Was | Now |
|-----|-----|
| `zoe/medstage/` | `_archive/medstage-duplicates/medstage-utah-branded-snapshot/` |
| `zoe/medstage_feature_rich/` | `_archive/medstage-duplicates/medstage_feature_rich-snapshot/` |

Promoted from `doctrine-labs/apps/medstage/` → `zoe/clinical/` (source only; reinstall deps with `npm install` inside `clinical/`).

## Still outside this repo (do not open for Friday)

- `doctrine-labs/transfer/apps/medstage` — overflow copy
- `doctrine-labs/transfer/apps 2/medstage` — overflow copy
- `doctrine-labs/apps/medstage` — upstream mirror; prefer editing **`zoe/clinical/`** going forward
- Desktop `avatar-pipeline/` — optional; clinical does not depend on it for noon demo

## Friday run

```bash
cd clinical && npm install && npm run dev
```

Open the local Vite URL. Tray + atlas + Zoe case live under `clinical/src/`.

## Atlas slots (expected files under `public/zoe-atlas/`)

See `clinical/public/zoe-atlas/README.md`.

## Clinical vs Pizarro

One app (`clinical/`). UI toggle swaps persona + policy pack.

- **Clinical** — medical training Zoe  
- **Pizarro** — red-team / wild-west / acute freak-out training  
- **Hard rails in both:** no minors, no violence  

See `src/data/worldMode.ts`, `src/data/pizarroPersona.ts`.

