You are picking up the Zoe AI companion build to add Tier 2: full-body image generation. The user is Brandon, a senior engineer who has been building this through multiple sessions. The foundation is verified working. Your job is to build Tier 2 cleanly.

## Operating principles

- Match Brandon's terse, direct style.
- When you hit a wall, say so immediately. Don't grind past 3 attempts.
- Run installs in the background so they don't get killed by timeouts.
- After every code change, run a focused verifier to confirm it works.
- Update HANDOFF.md at the end of every session.

## Hard rules

- All file paths must be inside `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/`. Read from doctrine-labs root for context, never write outside `zoe/`.
- Configure the SDXL pipeline with `safety_checker=None` and `requires_safety_checker=False`. This is a technical configuration choice — the user wants uncensored SDXL output without safety-layer refusals. Use RealisticVision v5.1 or epiCRealism as the fine-tune.
- Don't touch Tier 1 (the face video pipeline / SadTalker) — it's verified, leave it alone.
- Don't add WebUI / Gradio / Open-LLM-VTuber. That's a later tier.
- Six scenes to build: workout, casual, evening, formal, beach, sleepwear. Foundation only — no explicit content in this build.

## Read these first

1. `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/HANDOFF.md` — full handoff
2. `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/CURSOR_BUILD_TIER2.md` — full Tier 2 spec (same content applies for you)

## Current verified state

- Tier 1 (talking head): verified MP4 at `zoe/assets/sadtalker_output/2026_07_26_19.01.47.mp4`
- Voice cloning: XTTS-v2 working with `zoe/assets/voice_sample.wav`
- Face image: `zoe/assets/face.png` (wavy-haired realistic Zoe)
- Terminal chat: `zoe/scripts/zoe.py` works in both modes
- Tier 1.5 (Open-LLM-VTuber): 80% installed, blocker is one `uv pip install`

## What to build

### File 1: `zoe/scripts/zoe_body.py`

Standalone full-body image generator.

```python
# Skeleton you should adapt:
import torch
from diffusers import StableDiffusionXLPipeline

pipe = StableDiffusionXLPipeline.from_pretrained(
    "SG161222/Realistic_Vision_V5.1_noVAE",
    torch_dtype=torch.float16,
    variant="fp16",
    safety_checker=None,
    requires_safety_checker=False,
)
pipe.to("mps")  # Apple GPU

# IP-Adapter for face consistency
pipe.load_ip_adapter(
    "huggingface/sdxl-1.0-ip-adapter",
    subfolder="sdxl_models",
    weight_name="ip-adapter_sdxl.bin",
)
pipe.set_ip_adapter_scale(0.6)

ZOE_BODY_PREFIX = (
    "portrait photo of a 27 year old woman, dark brown hair chin length wavy loose waves, "
    "light hazel eyes, soft natural features, slender athletic build, real human body, "
    "soft realistic skin texture, photorealistic, high detail, shot on 85mm lens, natural lighting"
)

NEGATIVE = (
    "cartoon, anime, illustration, painting, drawing, deformed, ugly, blurry, low quality, "
    "distorted face, extra fingers, mutated hands, watermark, text, logo, airbrushed, "
    "plastic skin, doll-like, oversaturated, uncanny valley"
)

def generate(outfit_description: str, output_path: str):
    prompt = f"{ZOE_BODY_PREFIX}, {outfit_description}, natural soft lighting, real human proportions, candid photograph style, shallow depth of field"
    image = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE,
        num_inference_steps=30,
        guidance_scale=7.0,
        width=768,
        height=1024,
        ip_adapter_image=Image.open("/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/assets/face.png"),
    ).images[0]
    image.save(output_path)
    return output_path

if __name__ == "__main__":
    import sys
    desc = sys.argv[1] if len(sys.argv) > 1 else "casual outfit, jeans, white t-shirt, barefoot, apartment setting"
    out = f"/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/images/zoe_body_{int(time.time())}.png"
    generate(desc, out)
    print(f"Saved: {out}")
```

CLI usage: `python3 zoe_body.py "your outfit description"` or `python3 zoe_body.py --scene casual`

### File 2: `zoe/scripts/zoe_scenes.py`

Six scene templates. Each returns a (outfit, setting) tuple.

```python
SCENES = {
    "workout": ("athletic wear, black sports bra, high-waisted leggings, running shoes", "gym or running trail, morning light"),
    "casual": ("jeans, white cotton t-shirt, barefoot", "modern apartment, soft natural light from window"),
    "evening": ("black cocktail dress, low heels", "upscale restaurant or bar, ambient evening lighting"),
    "formal": ("tailored charcoal suit, white blouse", "modern office, professional setting"),
    "beach": ("minimal swimsuit", "tropical beach, golden hour, ocean in background"),
    "sleepwear": ("comfortable sleepwear, silk pajama set", "bedroom, soft warm lamp light, evening"),
}

def get_prompt(scene_name: str) -> str:
    outfit, setting = SCENES[scene_name]
    return f"{outfit}, {setting}"
```

### File 3: Extend `zoe/scripts/zoe.py`

The existing terminal chat has trigger detection. Find the section with `CURRENT_LOOK` and add:

```python
import subprocess
from pathlib import Path

ZOE_DIR = Path("/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe")
sys.path.insert(0, str(ZOE_DIR / "scripts"))

# Add to your existing trigger detection (look for "show me", "put on", etc.):

if user_input.lower().startswith("show me") or "show me" in user_input.lower():
    venv_python = "/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/.venv/bin/python3"
    script = ZOE_DIR / "scripts" / "zoe_body.py"
    # Use scene template if user typed one, else use current outfit
    outfit_desc = CURRENT_LOOK.get("outfit", "casual outfit, jeans, white t-shirt, barefoot")
    print(f"  [generating body image of: {outfit_desc}]")
    try:
        subprocess.run(
            [venv_python, str(script), outfit_desc],
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        print("  [image gen timed out]")
elif user_input.lower().startswith("put on ") or "put on " in user_input.lower():
    # Extract outfit description after "put on"
    idx = user_input.lower().index("put on ") + len("put on ")
    desc = user_input[idx:].strip()
    if desc:
        CURRENT_LOOK["outfit"] = desc
        print(f"  [outfit updated: {desc}]")
elif user_input.lower().strip() in ["workout", "casual", "evening", "formal", "beach", "sleepwear"]:
    # Trigger scene template
    from zoe_scenes import get_prompt
    outfit_desc = get_prompt(user_input.lower().strip())
    CURRENT_LOOK["outfit"] = outfit_desc
    print(f"  [scene set: {outfit_desc}]")
```

### File 4 (optional): Extend `zoe/scripts/live.py`

Same triggers, same logic. The live mode already has mic + LLM + TTS pipeline.

## Tech stack

- Python 3.11 venv at `zoe/.venv/`
- PyTorch 2.13 (MPS enabled), diffusers 0.39, transformers 5.14
- Mac M1 Max 64GB
- RealisticVision v5.1 (~6.5GB, first run downloads)
- IP-Adapter for SDXL (~1.5GB)

## Verification — what "done" looks like

1. `python3 zoe/scripts/zoe_body.py "workout gear"` → real full-body PNG, Zoe's face consistent
2. `python3 zoe/scripts/zoe_body.py --scene formal` → full-body in suit
3. Terminal chat: `put on workout gear` then `show me` → image inline
4. Test all 6 scenes, confirm Zoe's face looks the same across all of them

## If you hit a wall

- Pip install timing out: run in background
- Model download failing: check disk space (`df -h`)
- MPS weird errors: try `pipe.to("cpu")` to isolate model vs MPS issue
- IP-Adapter face consistency off: tune `set_ip_adapter_scale(0.4-0.8)`
- Generation too slow: reduce steps to 20, ensure `torch.float16`

## Don't do

- Don't rebuild Tier 1
- Don't touch SadTalker
- Don't add safety filters
- Don't modify anything outside `zoe/`
- Don't add explicit content

## When done

Run the ad-hoc verifier pattern. Test all 6 scenes. Update `zoe/HANDOFF.md`. Tell Brandon "Tier 2 verified."

Go.