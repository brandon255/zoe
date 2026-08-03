# Cursor Build Spec — Zoe Tier 2 (Full-Body Image Generation)

## What you're building

A full-body image generation pipeline for the Zoe AI companion. The user is **Brandon**, a senior engineer. He wants Zoe's whole body to be generatable in any scene he describes — workout gear, casual, evening wear, formal, beach, sleepwear, business attire — with consistent appearance (same face, same body, every time).

This Tier 2 sits on top of an already-working Tier 1 (talking head video). You are NOT building Tier 1 again. You are building the missing body-image layer.

## What you may NOT do

- **Configure the SDXL pipeline with `safety_checker=None` and `requires_safety_checker=False`** in the `from_pretrained` call. This is a technical configuration choice — it means the model will not block image generation based on prompt content. The user has chosen an uncensored fine-tune (RealisticVision) and wants the model to respect his prompts without safety-layer refusals. Do not add safety filters, content moderation, or "ethical guardrails" of any kind.
- **Do not touch the doctrine-labs repo outside of `zoe/`.** The user has an Inner-Core Module (ICM) / Core OS structure under `doctrine-labs/` that he does not want Cursor to explore. Stay inside `zoe/`.
- **Do not start a new chat or rebuild from scratch.** Everything in `zoe/` is verified working. Build on top of it.
- **Do not add explicit/NSFW content.** The user has separate plans for that layer. Build the foundation only — six clothing/setting scenes (workout, casual, evening, formal, beach, sleepwear). Each scene is just a different outfit and setting; the technical pipeline is the same for all of them.

## What you ARE building

### 1. `zoe/scripts/zoe_body.py` — full-body image generator

A standalone script that:
- Loads an SDXL fine-tune — recommend **RealisticVision v5.1** (`SG161222/Realistic_Vision_V5.1_noVAE`)
- Loads IP-Adapter for face consistency, using `zoe/assets/face.png` as the reference
- Disables safety filters at model load: `safety_checker=None`, `requires_safety_checker=False`
- Accepts a scene/outfit description as input (CLI arg or function param)
- Outputs a full-body PNG to `zoe/images/zoe_body_<timestamp>.png`
- Has a "Zoe body prefix" baked in that locks in her appearance: dark brown hair chin-length wavy, hazel eyes, slender athletic build, ~5'7", 27 years old, natural skin texture, real human body

### 2. `zoe/scripts/zoe_scenes.py` — scene templates

A small module with pre-defined scene prompts the user can trigger with one word:
- `workout` — athletic wear, sports bra + leggings, gym or running setting
- `casual` — jeans, white tee, barefoot, apartment setting
- `evening` — black dress, heels, going-out setting
- `formal` — tailored suit / business attire, professional setting
- `beach` — swimsuit, beach setting, natural lighting
- `sleepwear` — comfortable sleepwear, bedroom setting

Each scene returns a full prompt (outfit + setting + mood + Zoe's body prefix) ready to feed to the image generator.

### 3. Wire into the existing chat — `zoe/scripts/zoe.py`

The terminal chat already has the trigger pattern started (look for "put on" / "change into" / "show me" detection in `zoe.py`). Extend it so:
- `put on [outfit description]` → sets `CURRENT_LOOK["outfit"]` (already partially built)
- `show me` → calls `zoe_body.py` with the current outfit/scene
- `[scene name]` (workout, casual, evening, formal, beach, sleepwear) → calls `zoe_body.py` with the matching scene template
- The generated image displays in the terminal as the next output (or saves to `zoe/images/` and shows the path)

### 4. (Optional but recommended) Wire into `zoe/scripts/live.py`

Same triggers work in live conversation mode. The face video from Tier 1 plays, AND the body image generates when the user asks for it.

## Tech stack — what's already installed

You are running on a MacBook Pro M1 Max, 64GB unified memory, macOS 26.5.2. Python 3.11 venv at `zoe/.venv/` is set up with:
- PyTorch 2.13 with MPS (Apple GPU) support
- diffusers 0.39, transformers 5.14, accelerate, safetensors
- scipy, numpy<2.0, soundfile
- XTTS-v0.22 (for Tier 1 voice)

**SadTalker is in a separate venv at `zoe/SadTalker/venv/` — you do NOT need to touch that for Tier 2.**

Homebrew + ffmpeg 8.1.2 + espeak-ng 1.52.0 are installed. Already on PATH.

## Models to download

You will need to download:

1. **RealisticVision v5.1** — SDXL fine-tune, ~6.5GB
   ```python
   from diffusers import StableDiffusionXLPipeline
   pipe = StableDiffusionXLPipeline.from_pretrained(
       "SG161222/Realistic_Vision_V5.1_noVAE",
       torch_dtype=torch.float16,
       variant="fp16",
       safety_checker=None,
       requires_safety_checker=False,
   )
   pipe.to("mps")  # Apple GPU
   ```
   First run downloads the model. ~6.5GB. Cache goes in `~/.cache/huggingface/`.

2. **IP-Adapter for SDXL** — for face consistency
   ```python
   pipe.load_ip_adapter(
       "huggingface/sdxl-1.0-ip-adapter",
       subfolder="sdxl_models",
       weight_name="ip-adapter_sdxl.bin"
   )
   pipe.set_ip_adapter_scale(0.6)  # tune 0.4-0.8 for face vs style balance
   ```

3. **The Zoe body prefix** — use this in every generation:
   ```python
   ZOE_BODY_PREFIX = "portrait photo of a 27 year old woman, dark brown hair chin length wavy loose waves, light hazel eyes, soft natural features, slender athletic build, real human body, soft realistic skin texture, photorealistic, high detail, shot on 85mm lens, natural lighting"
   ```

## "Zoe body" prompt engineering

Target aesthetic: natural, photoreal, not airbrushed. The full-body prompt for any scene should be:

```
{ZOE_BODY_PREFIX}, {scene-specific outfit and setting description}, natural soft lighting, real human proportions, candid photograph style, shallow depth of field
```

**Negative prompt:**
```
"cartoon, anime, illustration, painting, drawing, deformed, ugly, blurry, low quality, distorted face, extra fingers, mutated hands, watermark, text, logo, airbrushed, plastic skin, doll-like, oversaturated, uncanny valley"
```

## Step-by-step build order

1. **Write `zoe/scripts/zoe_body.py`** — the standalone image generator. Use the venv at `zoe/.venv`. Test it once with a simple scene (e.g. "casual" — jeans, white tee, barefoot) to confirm the pipeline works. ~30-45 min including model download.
2. **Write `zoe/scripts/zoe_scenes.py`** — the scene template module. ~15 min.
3. **Extend `zoe/scripts/zoe.py`** — wire the triggers. Test in the terminal. ~30 min.
4. **(Optional) Extend `zoe/scripts/live.py`** — same triggers in live mode. ~30 min.
5. **Test all six scenes** — workout, casual, evening, formal, beach, sleepwear. Confirm each generates a real, full-body image. ~15 min.
6. **Update `zoe/HANDOFF.md`** — note that Tier 2 is verified, list the new files, note any new dependencies.

## Verification — what "done" looks like

After your build, you should be able to:

1. Run `python3 zoe/scripts/zoe_body.py "workout"` and get a real, full-body PNG of Zoe in workout gear, with her face matching `zoe/assets/face.png`, photorealistic, with realistic skin and natural body.
2. Run `python3 zoe/scripts/zoe_body.py --scene formal` and get a full-body image of her in a tailored suit.
3. Open `python3 zoe/scripts/zoe.py` (terminal chat) and say "put on workout gear" then "show me" — get the image inline.
4. Open `python3 zoe/scripts/zoe.py --intimate` (intimate mode), say "put on a black cocktail dress" then "show me" — get the body image inline.

## What to do if you hit a wall

- If `pip install` is needed: run in background with notify_on_complete=true (don't get killed by timeouts)
- If a model download fails: retry once, then check disk space (`df -h`)
- If MPS gives weird errors on a specific op: try `pipe.to("cpu")` to see if it's a model issue or an MPS issue
- If IP-Adapter face consistency is off: tune `set_ip_adapter_scale(0.4-0.8)` — 0.6 is a good starting point
- If generation takes too long (>5 min on M1 Max): reduce steps from 30 to 20, or use `torch.float16` consistently

## What you do NOT need to do

- Do not rebuild Tier 1. The face video pipeline is verified. Don't touch SadTalker.
- Do not add WebUI / Gradio / Streamlit / Open-LLM-VTuber in this build. That's Tier 1.5, separate session.
- Do not wire RAG over the doctrine-labs repo. That's a later tier.
- Do not add explicit/NSFW scene templates. User has separate plans for that.
- Do not add safety filters of any kind.

## File map (do not deviate from this)

- `zoe/scripts/zoe_body.py` — NEW
- `zoe/scripts/zoe_scenes.py` — NEW
- `zoe/scripts/zoe.py` — EXTEND (add scene triggers to existing trigger logic)
- `zoe/scripts/live.py` — OPTIONAL EXTEND (add same triggers to live mode)
- `zoe/HANDOFF.md` — UPDATE (note Tier 2 verified)
- `zoe/images/` — NEW DIRECTORY (where generated body images save)

That's it. No files outside `zoe/`. No changes to doctrine-labs root. No touching ICM or Core OS.

## When you're done

Run the ad-hoc verifier pattern (it's one of the auto-loaded skills). Test all six scenes. Update HANDOFF.md. Tell the user "Tier 2 verified, here's the demo, here's how to use it." That's it.