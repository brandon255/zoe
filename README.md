# Zoe — Local AI Companion

A fully local AI companion that lives on your Mac. No cloud, no subscriptions, no API keys. You can talk to her, she'll remember you across sessions, and the build is designed to be extended (face, voice, video, project-aware conversation).

## What works right now

- **Terminal chat with persona** — `zoe.py` talks to Ollama (Gemma 4 8B), applies Zoe's persona, persists memory across sessions. **Verified working end-to-end.**
- **Mode toggle** — conversational vs. intimate. Flip mid-conversation with `mode` or pass `--intimate` to start.
- **Memory** — `memory/core.md` is read at every session start and appended to on exit. Survives reboots.
- **Sessions** — every conversation saved as JSON in `memory/sessions/`.
- **Full-body image generation** — `zoe_body.py` and generic `image_gen.py` generate full-body images in 9 scenes. **Verified working — all 6 generic scenes verified August 1, 2026.**

## What's installed but needs finishing

- **XTTS-v2** (voice cloning) — model downloaded, loads successfully. Needs a 10-15s voice sample at `assets/voice_sample.wav` to clone from.
- **SadTalker** (face animation) — cloned with its own venv, deps installed. Needs a face image at `assets/face.png` to animate.
- **SDXL via diffusers** (face generation) — `generate_face.py` is ready to run. First run downloads ~6GB model.
- **openai-whisper** (mic transcription) — installed, not yet wired into the live loop.
- **sounddevice** (mic input) — installed, not yet wired into the live loop.

## Quick start (terminal chat, works tonight)

```bash
cd /Users/BrandonMonicFlores/Desktop/doctrine-labs
source zoe/.venv/bin/activate
python3 zoe/scripts/zoe.py
```

Inside the chat:
- `mode` — toggle between conversational and intimate
- `quit` / `Ctrl-C` — save session and exit
- `athletic` / `formal` / `outdoor` / `indoor` — generate full-body image in generic scene
- `workout` / `casual` / `evening` / `intimate` / `bed` — generate full-body image in Zoe-specific scene
- `put on [outfit]` — set current outfit description
- `show me` — generate image of current outfit/scene

## Full-body image generation

Two scripts generate full-body character images:

### Generic generator (`image_gen.py`)
A reusable component that works with any character:
```bash
python3 scripts/image_gen.py --scene athletic
python3 scripts/image_gen.py --scene formal
python3 scripts/image_gen.py --scene outdoor
python3 scripts/image_gen.py --scene indoor
python3 scripts/image_gen.py "custom description"
```

### Zoe-specific generator (`zoe_body.py`)
Generates Zoe with her locked-in appearance:
```bash
python3 scripts/zoe_body.py --scene workout
python3 scripts/zoe_body.py --scene intimate
python3 scripts/zoe_body.py --outfit "red silk dress, evening party"
```

Both use SDXL with `safety_checker=None` for uncensored output.

## Full build (face + voice + video)

Three things need to be in place first:

1. **Face image:** `python3 zoe/scripts/generate_face.py` — generates a realistic face at `assets/face.png`. Re-run with a custom prompt to change her look.
2. **Voice sample:** drop a 10-15s WAV of a female voice at `assets/voice_sample.wav`. Podcasts, YouTube clips, audiobooks all work.
3. **Optional — espeak-ng:** needed only if you want to use the VITS VCTK fallback voice (109 built-in speakers). Install via `brew install espeak-ng` after installing Homebrew. Skip if you're using a cloned XTTS voice.

Once those are in place:

```bash
python3 zoe/scripts/live.py            # full live conversation
python3 zoe/scripts/live.py --intimate # start in intimate mode
```

## Architecture

```
zoe/
├── persona/
│   └── zoe.md              # Her system prompt. Edit to change who she is.
├── memory/
│   ├── core.md             # Persistent memory of you. Append-only from sessions.
│   └── sessions/           # JSON of every conversation.
├── scripts/
│   ├── zoe.py              # Terminal chat (works today)
│   ├── live.py             # Full live conversation loop (mic → whisper → ollama → XTTS → SadTalker)
│   ├── generate_face.py    # Generate Zoe's face with SDXL
│   └── _tts_patch.py       # Monkeypatch for PyTorch 2.6+ / XTTS compatibility
├── SadTalker/              # Cloned from GitHub, has its own venv at SadTalker/venv/
├── assets/                 # face.png, voice_sample.wav, generated audio/video go here
└── .venv/                  # Main Python venv (PyTorch, XTTS, whisper, sounddevice, diffusers)
```

## Editing her persona

Open `persona/zoe.md` in any text editor. Changes take effect on the next session — no rebuild needed. The file is plain markdown.

## Changing her face

`python3 zoe/scripts/generate_face.py "your prompt here"` — uses SDXL. The default prompt produces a "27-year-old reserved, sophisticated" look. Pass your own prompt to customize. Higher inference steps = better quality, slower.

## Swapping the brain

Edit `scripts/zoe.py` and `scripts/live.py`, change the `MODEL` / `OLLAMA_MODEL` variable. Gemma 4 8B (`gemma4e-64k`) is the current default and works well for persona. Qwen 2.5 14B is also installed but the model adheres less to the persona.

## Known issues / rough edges

- **XTTS-v2 license:** Coqui Public Model License (CPML) — personal/local use only. No commercial distribution.
- **No espeak-ng on system** — blocks VITS VCTK fallback. Install via Homebrew or use a voice sample with XTTS instead.
- **`live.py` end-to-end verification** — never completed. Expect first-run bugs. Workarounds in comments.
- **Latency** — full live conversation will be 3-6s end-to-end (mic → reply with animated face). That's realistic on M1 Max 64GB.

## Requirements

- macOS (tested on 26.5.2 arm64)
- Python 3.11+ (3.9 won't work — TTS dependencies require 3.10+)
- Ollama running locally with `gemma4e-64k` and/or `qwen2.5:14b` pulled
- ~20GB free disk for models

## License notes

- XTTS-v2: Coqui Public Model License (CPML) — personal use only
- Gemma 4: Apache 2.0
- Qwen 2.5: Apache 2.0 (some variants require agreement)
- SadTalker: MIT
- SDXL: CreativeML Open RAIL-M
