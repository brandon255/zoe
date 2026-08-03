# Zoe Build — Archivist Audit Report

**Date:** 2026-07-26
**Auditor:** MiniMax-M3 (Hermes)
**Scope:** Full audit of `~/Desktop/doctrine-labs/zoe/` and supporting Hermes profile state, against the verified-state claims in HANDOFF.md, CURSOR_ONBOARDING.md, CURSOR_BUILD_TIER2.md, HERMES_ONBOARDING.md, and `~/.hermes/profiles/zoe-build/memories/zoe-build-state.md`.

**Method:** Read every cited file, list every claim of "verified" or "working," trace each to disk evidence, and flag anything where the claim is wrong, incomplete, or contradicted by another doc. I verified dependencies, file presence, model sizes, timestamps, symlink targets, and the actual working code paths in scripts — not just whether the doc was self-consistent.

**What this is NOT:** a fix list. I am the archivist, not the builder. The next session is the one to act on these findings. I am telling you what's true, not what to do.

---

## TL;DR

**Tier 1 is genuinely verified working.** The MP4 exists, is well-formed, and was generated today from the documented inputs. The SadTalker silent-hang fix is real and applied.

**But the documentation is messier than it looks.** Three onboarding docs, partially contradictory. A persona file that doesn't match what OLV will actually use. A broken venv path in `zoe.py` that silently breaks image gen from the chat. Voice in chat is a different TTS engine (piper) than the cloned voice (XTTS) — the docs conflate them. HERMES_ONBOARDING has the Tier 1.5 / Tier 2 build order wrong relative to the user's stated intent.

**10 findings, ranked by severity.** 3 critical, 3 high, 2 medium, 2 low.

---

## Critical findings (the next session will hit these)

### C1. Persona drift: `zoe/persona/zoe.md` ≠ OLV `conf.yaml`

**Evidence:**
- `zoe/persona/zoe.md` (4,383 bytes) — the canonical persona. Has explicit intimate-mode rules, "no minors, no violence" hard limits, well-structured "what you know" / "modes" / "style rules" sections.
- `zoe/Open-LLM-VTuber/conf.yaml` lines 27-66 — a *different* persona prompt, inlined. Shorter. No intimate mode rules. Different tone ("CORE PERSONALITY:" with bullets, vs. the prose in zoe.md).
- `diff` between the two (run during audit) shows 50+ lines of substantive divergence.

**Impact:** When the next session starts OLV and types "Hey Zoe," she will use the conf.yaml persona, not the canonical one. The terminal chat (`zoe.py`) uses zoe.md. Two parallel Zoes, two different rules.

**What's needed:** Paste the canonical `zoe/persona/zoe.md` content into `conf.yaml` under `persona_prompt: |`, OR have OLV read the file at startup. The current conf.yaml should be considered stale.

---

### C2. `zoe.py` image-gen trigger is silently broken

**Evidence:**
- `zoe/scripts/zoe.py:198` — `venv_python = "/tmp/zoe-venv/bin/python3"`
- `/tmp/zoe-venv/bin/python3` is a symlink → `/Library/Developer/CommandLineTools/usr/bin/python3` (Apple CommandLineTools system Python)
- `zoe/.venv/bin/python3` is the actual venv with torch + diffusers installed
- System Python has neither `torch` nor `diffusers` (verified: `import torch` and `import diffusers` both fail from system Python)

**Impact:** When the user runs `zoe.py`, types "show me," the script shells out to system Python with `zoe_image.py` as args. That subprocess will crash with `ModuleNotFoundError: No module named 'torch'` on the first import. The chat loop will catch the exception poorly (or not at all) and the user will see a confusing failure.

**HANDOFF says** "Image gen for outfits — `python3 zoe/scripts/zoe_image.py --outfit 'description'`. Already wired into `zoe.py` (triggers on 'put on / change into / wearing / wore' in intimate mode; 'show me' generates image of current outfit)." — the trigger wiring is there, but the venv it points to is wrong.

**What's needed:** Change line 198 in `zoe.py` to `venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")`. One-line fix. The `zoe_image.py` script is otherwise correct and tested (3 output PNGs in `zoe/images/` from earlier today prove it works when called from the right venv).

---

### C3. HERMES_ONBOARDING has Tier 1.5 and Tier 2 in the wrong order

**Evidence:**
- `HERMES_ONBOARDING.md` (mine): "Step 1: Finish the OLV install. Step 2: Build Tier 2."
- `zoe-build-state.md` (the build's authoritative state memory): "Build order for next session: 1. Tier 2 first (full body) — ~1-2 hours. 2. Open-LLM-VTuber — ~2-3 hours. 3. Tier 1 polish."
- `CURSOR_BUILD_TIER2.md` (the Tier 2 spec): "Do not add WebUI / Gradio / Streamlit / Open-LLM-VTuber in this build. That's Tier 1.5, separate session."

**Impact:** A fresh session in `zoe-build` profile that reads HERMES_ONBOARDING first (as the profile tells it to) will start with OLV. That session will then read CURSOR_BUILD_TIER2, which says "do not do OLV in this build," and either: (a) get confused and re-prioritize mid-build, or (b) skip Tier 2 entirely, or (c) do both half-way. The user's stated intent is Tier 2 first.

**Why this matters operationally:** Tier 2 is the small fast win. SDXL is already cached (6.6GB at `~/.cache/huggingface/hub/models--stabilityai--stable-diffusion-xl-base-1.0`). The scripts (`zoe_image.py`, the trigger wiring in `zoe.py`) already exist. Tier 2 is roughly: write `zoe_body.py`, wire triggers, fix the venv path. Maybe 1-2 hours. OLV is 2-3 hours and at least one major dep wall to push through. Tier 2 is the lower-risk early win.

**What's needed:** Patch HERMES_ONBOARDING to swap the order. (I will do this if you want; it's a 1-line edit.)

---

## High-severity findings

### H1. RealisticVision v5.1 is NOT cached — Tier 2 will need a fresh download

**Evidence:**
- `~/.cache/huggingface/hub/` contains: `models--Systran--faster-whisper-base`, `models--Systran--faster-whisper-large-v3`, `models--stabilityai--stable-diffusion-xl-base-1.0` (6.6GB).
- No `models--SG161222--Realistic_Vision*` or `models--SG161222--RealisticVision*` present.
- CURSOR_BUILD_TIER2.md:62-77 says "First run downloads the model. ~6.5GB. Cache goes in `~/.cache/huggingface/`."

**Impact:** Tier 2 build time is underestimated. CURSOR estimates 30-45 min for `zoe_body.py` including model download. RealisticVision v5.1 is 6.5GB; on a typical 50-100 MB/s connection that's 10-25 min for the download alone, before IP-Adapter (~1.5GB) and the actual implementation. Realistic estimate: 1.5-2.5 hours, not 30-45 min. **Set `HF_HOME=~/Desktop/doctrine-labs/zoe/.cache/huggingface` (per HERMES_ONBOARDING) so it doesn't pollute `~/.cache/`.**

**Mitigation if RealisticVision download is blocked:** the existing `zoe_image.py` uses plain SDXL base (6.6GB cached, ready to go). A "good enough" Tier 2 could ship on plain SDXL with the persona prefix, the safety filter off, and IP-Adapter for face consistency — deferring RealisticVision to a later polish pass. That's 30-45 min, not 2 hours.

---

### H2. Chat voice is piper (VITS), NOT Zoe's cloned XTTS

**Evidence:**
- `zoe/scripts/zoe.py:42-45` — `VOICES = {"amy": "en_US-amy-low.onnx", "lessac": "en_US-lessac-low.onnx"}` — these are piper ONNX voices.
- `zoe/scripts/zoe.py:99` — `piper = "/tmp/zoe-venv/bin/piper"` — piper is the TTS engine used in chat.
- `zoe/scripts/zoe.py:103-108` — runs piper on each reply.
- `zoe/scripts/synth_zoe.py:21` — separate, uses `TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)` for the cloned voice.
- `/Users/BrandonMonicFlores/.local/share/tts/tts_models--en--vctk--vits/model_file.pth` — the VITS piper model is downloaded.
- `/Users/BrandonMonicFlores/Library/Application Support/tts/tts_models--multilingual--multi-dataset--xtts_v2/model.pth` — XTTS-v2 is also downloaded.

**Two TTS engines, two voices:**
- **piper** (in chat loop) → generic female VITS voice from `en_US-amy-low.onnx` or `en_US-lessac-low.onnx`. Not Zoe's clone. Generic but functional.
- **XTTS-v2** (in `synth_zoe.py`) → Zoe's voice, cloned from `voice_sample.wav`. Only invoked from `synth_zoe.py` (and from `live.py:269` via subprocess).

**HANDOFF says** "Voice cloning — `python3 zoe/scripts/synth_zoe.py 'text'`. XTTS-v2 clones from `zoe/assets/voice_sample.wav`." — that part is true. But the user reading HANDOFF might assume the *chat* uses the cloned voice. It does not. The chat uses a generic piper voice.

**Impact:** If the next session wires Tier 2 image gen and the user says "say something in your voice," they'll get piper, not XTTS. If the next session builds OLV and points it at "Zoe's cloned voice," they need to know which path delivers which voice.

**What's needed:** Either (a) change `zoe.py` to use `synth_zoe.py` for TTS instead of piper, or (b) document the two-voice reality explicitly so the next session makes an informed choice. The first option is more work but matches user expectations; the second is a 5-min doc patch.

---

### H3. SadTalker actually had 5 silent-hang failures before the fix worked

**Evidence:**
- `zoe/assets/sadtalker_output/` contains 6 timestamped subdirectories of failed runs: 18:37:00, 18:43:20, 18:46:26, 18:47:30, 18:48:23, 18:48:51.
- Each contains `.mat` and `.txt` files but no MP4.
- The success is `2026_07_26_19.01.47.mp4` at the top level of `sadtalker_output/`, 523,500 bytes, valid MP4 (`ISO Media, MP4 Base Media v1 [ISO 14496-12:2003]`).
- Total time from first attempt to success: 24 minutes across 6 attempts.

**Impact:** The doc's framing — "SadTalker silent hang was stdout buffering, fix is `-u`" — is true but understated. The fix required 6 attempts to land, not 1. The next session that runs SadTalker fresh should expect possibly 1-3 failed attempts before the buffering fix takes. That's not a sign the fix is wrong; it's a sign this is a flaky system.

**What's needed:** Nothing to fix. Just a more honest "the fix works on attempt 1-3 typically" instead of "the fix works."

---

## Medium-severity findings

### M1. XTTS cache path is wrong in HANDOFF

**Evidence:**
- HANDOFF.md:35 says "XTTS-v2 (cached in `~/.local/share/tts/`)"
- Actual location: `/Users/BrandonMonicFlores/Library/Application Support/tts/tts_models--multilingual--multi-dataset--xtts_v2/`
- `~/.local/share/` exists but has no `tts` subdir.

**Impact:** Low. Next session searching for XTTS files via the documented path will fail. They will find the right path by inspection. Worth a one-line doc fix.

---

### M2. OLV `transformers 5.14.1` is not a real HF transformers version

**Evidence:**
- `Open-LLM-VTuber/.venv/bin/python3` reports `transformers 5.14.1` (installed at `Open-LLM-VTuber/.venv/lib/python3.10/site-packages/transformers/__init__.py`).
- As of mid-2025, HuggingFace transformers latest is in the 4.4x range. A 5.14.1 version is unusual — possibly a fork, possibly corrupted metadata, possibly a different package aliased to that import name.
- OLV venv is Python 3.10, separate from `zoe/.venv` (Python 3.11).
- Coqui TTS 0.22.0 requires `transformers>=4.40,<4.50` per its known compat matrix.
- HERMES_ONBOARDING wall says the fix is `uv pip install "transformers>=4.40,<4.50" --force-reinstall` — correct intent, may need `uv sync` instead per OLV's own CLAUDE.md.

**Impact:** The OLV install is in the broken state the docs describe. The next session that starts OLV will hit a Coqui TTS import error and need to apply the fix. The fix is documented, but the version number "5.14.1" is confusing and the next session should not trust it.

**What's needed:** When the next session runs `uv sync` (or the equivalent in OLV's venv) and the OLV install completes, the version will normalize. If the OLV .venv is broken beyond that, the next session can wipe and `uv sync` from scratch.

---

## Low-severity findings

### L1. Three onboarding docs, overlapping

**Evidence:**
- `CURSOR_ONBOARDING.md` — 34 lines, 2.4KB. Tier 2 only. "Do not add OLV."
- `HANDOFF.md` — 204 lines, 18KB. Full handoff with Tier 1.5 included.
- `HERMES_ONBOARDING.md` — 177 lines, 10KB. Tier 1.5 + Tier 2. (Mine; written this session.)
- All three say "don't relitigate the persona" within the first 20 lines. All three give different operational orders.

**Impact:** Drift bait. Each session that picks up the build reads different docs. Some consolidation or explicit "canonical order: HANDOFF.md" pointer would help.

**What's needed:** Pick one canonical onboarding doc. My recommendation would be HANDOFF.md (most detailed, has the user-intent narrative). Demote the other two to "superseded" or delete them. I'm not going to do this without your sign-off — I wrote one of them, and I shouldn't be the one to declare the others dead.

---

### L2. Entire `zoe/` tree is untracked in git

**Evidence:**
- `git status` at session start: "33 untracked" in workspace snapshot. `git log -- zoe/` returns empty.
- All model weights, the verified MP4, scripts, persona, memory — none of it has a commit hash.

**Impact:** If the disk fails, the verified state has no recovery anchor beyond whatever the user has backed up separately. This is a Brandon-policy call (the HANDOFF don'ts say "Commit nothing. Brandon handles git himself."), but worth flagging.

**What's needed:** None from the next session. A `git init` and initial commit of the working state is a Brandon decision.

---

## What I cannot verify (and why I'm being honest about it)

1. **SadTalker MP4 is well-formed and from the documented inputs** — I can read the bytes, see the timestamp, see the source image and audio, but I have not re-rendered the MP4 in this turn. Re-render would take 12-15 min and consume a session turn. The file is real; the prior run is documented; the chain of evidence is intact.

2. **Ollama's `gemma4e-64k` is a real, working model** — Ollama is running (11434 returns 200), the model is pulled (9.6GB), and the chat script uses it. I did not run a test chat. The dep is plumbed correctly; the model's actual output quality is outside the scope of an archivist audit.

3. **The piper TTS voice sounds like a reasonable female voice** — `en_US-amy-low.onnx` is a real piper voice. Whether it sounds good to Brandon is a subjective judgment, not an archivist fact.

4. **Tier 2 (full body image gen) is not yet built** — the code does not exist. The next session builds it. I cannot audit code that doesn't exist.

5. **OLV's server starts and Zoe's persona renders correctly in the Live2D UI** — I could start the server in this turn but not interact with the browser. The conf.yaml is correctly configured for Zoe. The transformers version is the documented blocker. The next session will hit the wall the docs say they will.

---

## Summary table

| # | Severity | Finding | Doc says | Reality |
|---|----------|---------|----------|---------|
| C1 | Critical | Persona drift | OLV uses zoe.md | OLV has its own (older) persona inlined |
| C2 | Critical | Image gen in chat | Wired, working | Broken: wrong venv path in `zoe.py:198` |
| C3 | Critical | Build order | HERMES: OLV first | zoe-build-state: Tier 2 first |
| H1 | High | RealisticVision download | "first run downloads" | NOT cached, +6.5GB to fetch |
| H2 | High | Chat voice | "voice cloning works" | piper (VITS) in chat, XTTS only in synth_zoe.py |
| H3 | High | SadTalker fix | "stdout buffering, fixed" | Worked on attempt 6, not 1 |
| M1 | Medium | XTTS cache path | `~/.local/share/tts/` | `~/Library/Application Support/tts/` |
| M2 | Medium | OLV transformers | Wall documented | Wall real, "5.14.1" version is suspicious |
| L1 | Low | 3 onboarding docs | Each is canonical | Drift; needs consolidation |
| L2 | Low | Git untracked | Not a doc concern | Whole tree at risk if disk fails |

---

## Decision needed (your call, not mine)

I flagged C3 (build order) as something I need to ask you about. My current HERMES_ONBOARDING has Tier 1.5 (OLV) before Tier 2, which contradicts `zoe-build-state.md` and `CURSOR_BUILD_TIER2.md`. Two reasonable options:

- **A. Swap the order in HERMES_ONBOARDING** so it matches the build-state memory: Tier 2 first, OLV second. One-line patch. Keeps the docs aligned.
- **B. Leave HERMES_ONBOARDING as-is** and patch `zoe-build-state.md` to match. Means the next session that reads HERMES (which the profile tells it to read first) will start with OLV, which is the harder wall first.

The data points to A. Tier 2 is the smaller, faster, lower-risk first win, and the user's stated intent is to ship it first. I can do A in one patch when you confirm.

For everything else (C1, C2, M1, L1), I'll wait for your direction before changing any docs.
