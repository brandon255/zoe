# Pickup — after Brandon's meeting (2026-08-05)

## Where we left off

- **Pizarro media bay works** — dildo still + ref clip in UI (pushed).
- **LivePortrait face sample** — started twice, **interrupted** (Mac CPU too slow for full run in-session).
  - Driving trims exist: `/tmp/zoe-drive-2s.mp4`, `/tmp/zoe-drive-4s.mp4`, `/tmp/zoe-drive-4s.pkl`
  - Zoe face source: `zoe/assets/face.png`
  - Output target: `zoe/clinical/public/pizarro/` then wire into `PizarroMediaBay`

## Resume command (when back)

```bash
cd ~/Desktop/doctrine-labs/zoe/LivePortrait
.venv/bin/python3 inference.py \
  -s ../assets/face.png \
  -d /tmp/zoe-drive-2s.mp4 \
  -o ../clinical/public/pizarro \
  --flag-crop-driving-video \
  --no-flag-use-half-precision \
  --flag-force-cpu
```

Then add the output mp4 to `PizarroMediaBay` and refresh http://127.0.0.1:5173 → **Pizarro**.

## Do not claim

LivePortrait Zoe-face clip is **not** done yet. Media bay stills/clip **are** done.
