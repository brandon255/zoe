# Pickup — after Brandon's meeting (2026-08-05)

## Where we left off

- **Pizarro media bay works** — dildo still + ref clip in UI (pushed earlier as `5b6b159`).
- **LivePortrait face sample** — got far (models loaded, 60 frames prepared) then **interrupted**. No finished Zoe-face mp4 yet.
  - Work files saved in-repo: `clinical/public/pizarro/work/zoe-drive-2s.mp4` + `.pkl` + log
  - Zoe face source: `zoe/assets/face.png`
  - Output target: `clinical/public/pizarro/zoe-face-sample.mp4` → wire into `PizarroMediaBay`

## Resume command (when back)

```bash
cd ~/Desktop/doctrine-labs/zoe/LivePortrait
.venv/bin/python3 inference.py \
  -s ../assets/face.png \
  -d ../clinical/public/pizarro/work/zoe-drive-2s.mp4 \
  -o ../clinical/public/pizarro \
  --flag-crop-driving-video \
  --no-flag-use-half-precision \
  --flag-force-cpu
```

Then rename/copy output to `zoe-face-sample.mp4`, add to `PizarroMediaBay`, refresh http://127.0.0.1:5173 → **Pizarro**.

## Remote / background?

Cursor chat agents do **not** keep building after you close the laptop/session. Cloud agents can run elsewhere if you start one explicitly — but this LivePortrait job needs your Mac GPU/CPU + local weights, so finish it here when you're back.

## Do not claim

LivePortrait Zoe-face clip is **not** done. Media bay stills/clip **are** done.
