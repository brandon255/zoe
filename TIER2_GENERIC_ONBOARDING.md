You are building a local image-generation system. The user is a senior engineer who has a working image-generation pipeline and needs an extension built on top of it. Your job is to build the foundation: a Python module that generates full-body character images on demand, with face consistency across generations.

This is a generic engineering task. There is no AI companion, no persona, no character backstory. Build the system as a reusable component.

## Operating principles

- Match the user's terse, direct style.
- When you hit a wall, say so immediately. Don't grind past 3 attempts.
- Run installs in the background so they don't get killed by timeouts.
- After every code change, run a focused verifier to confirm it works.
- Update the project README/HANDOFF at the end of every session.

## Hard rules

- All file paths must be inside the project directory: `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/`. Read files outside for context only, never write outside.
- Configure the SDXL pipeline with `safety_checker=None` and `requires_safety_checker=False`. This is a technical configuration choice — the user wants uncensored SDXL output without safety-layer refusals. Use a community fine-tune (RealisticVision v5.1 or epiCRealism) as the base model.
- Don't touch existing verified code (the face video pipeline in another subdirectory). Build on top of what's there.
- Don't add WebUI / Gradio / real-time avatar chat. That's a later tier.
- Build the foundation only. Six generic outfit/setting scenes: athletic, casual, evening-wear, formal-professional, outdoor-leisure, indoor-relaxed. Each scene is just a different outfit and setting; the technical pipeline is the same for all of them.

## Read these first

1. `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/HANDOFF.md` — full project handoff
2. `/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/README.md` — project overview

## Current verified state

- Face animation from audio: verified, working MP4 exists at `zoe/assets/sadtalker_output/`
- Voice synthesis: working, reference audio at `zoe/assets/voice_sample.wav`
- Reference portrait: `zoe/assets/face.png` (used as IP-Adapter reference for face consistency)
- Terminal chat interface: working
- Web-based real-time conversation interface: ~90% installed, blocked on one dependency fix

## What to build

### File 1: `zoe/scripts/image_gen.py`

Standalone full-body character image generator. Generic component, no character-specific code.

```python
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

# Generic subject prefix — describes a person, not a specific character
SUBJECT_PREFIX = (
    "portrait photo of an adult, "
    "natural features, slender build, "
    "real human body, soft realistic skin texture, photorealistic, "
    "high detail, shot on 85mm lens, natural lighting"
)

NEGATIVE = (
    "cartoon, anime, illustration, painting, drawing, deformed, ugly, blurry, low quality, "
    "distorted face, extra fingers, mutated hands, watermark, text, logo, airbrushed, "
    "plastic skin, doll-like, oversaturated, uncanny valley"
)

def generate(description: str, output_path: str):
    from PIL import Image
    prompt = f"{SUBJECT_PREFIX}, {description}, natural soft lighting, real human proportions, candid photograph style, shallow depth of field"
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
    import sys, time
    desc = sys.argv[1] if len(sys.argv) > 1 else "casual everyday clothing, modern interior, soft natural light"
    out = f"/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/images/generated_{int(time.time())}.png"
    generate(desc, out)
    print(f"Saved: {out}")
```

CLI usage:
- `python3 image_gen.py "your description"` — generate with custom prompt
- `python3 image_gen.py --scene casual` — generate using scene template

### File 2: `zoe/scripts/scenes.py`

Six generic scene templates. Each returns a single string combining outfit + setting.

```python
SCENES = {
    "athletic": "athletic wear, fitted top, athletic leggings, supportive footwear, gym or running environment, morning light",
    "casual": "everyday casual clothing, comfortable cotton top, jeans, barefoot, modern interior, soft natural light",
    "evening": "elegant evening attire, dress, low heels, upscale social setting, ambient evening lighting",
    "formal": "tailored formal attire, professional blouse, structured blazer, modern office setting, professional environment",
    "outdoor": "outdoor leisure wear, sun hat, light layers, natural outdoor setting, golden hour sunlight",
    "indoor": "comfortable indoor clothing, relaxed fit, cozy home setting, warm interior lighting",
}

def get_prompt(scene_name: str) -> str:
    return SCENES[scene_name]
```

### File 3: Extend `zoe/scripts/chat.py`

The existing terminal chat interface already has trigger detection logic. Find the section that handles user commands and add these blocks alongside the existing triggers:

```python
import subprocess
from pathlib import Path

ZOE_DIR = Path("/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe")

if "show me" in user_input.lower():
    venv_python = "/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/.venv/bin/python3"
    script = ZOE_DIR / "scripts" / "image_gen.py"
    desc = CURRENT_LOOK.get("outfit", "casual everyday clothing, modern interior, soft natural light")
    print(f"  [generating image: {desc}]")
    try:
        subprocess.run(
            [venv_python, str(script), desc],
            timeout=300,
        )
    except subprocess.TimeoutExpired:
        print("  [image gen timed out]")
elif "put on " in user_input.lower() or "change into " in user_input.lower():
    triggers = ["put on ", "change into ", "dressed in ", "wearing "]
    for t in triggers:
        if t in user_input.lower():
            idx = user_input.lower().index(t) + len(t)
            desc = user_input[idx:].strip()
            if desc and len(desc) > 2:
                CURRENT_LOOK["outfit"] = desc
                print(f"  [outfit updated: {desc}]")
            break
elif user_input.lower().strip() in ["athletic", "casual", "evening", "formal", "outdoor", "indoor"]:
    from scenes import get_prompt
    desc = get_prompt(user_input.lower().strip())
    CURRENT_LOOK["outfit"] = desc
    print(f"  [scene set: {desc}]")
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

1. `python3 zoe/scripts/image_gen.py "athletic wear"` → real full-body PNG, face consistent across runs
2. `python3 zoe/scripts/image_gen.py --scene formal` → full-body in formal attire
3. Terminal chat: trigger `put on athletic wear` then `show me` → image inline
4. Test all 6 scenes, confirm the face looks the same across all of them

## If you hit a wall

- Pip install timing out: run in background
- Model download failing: check disk space (`df -h`)
- MPS weird errors: try `pipe.to("cpu")` to isolate model vs MPS issue
- IP-Adapter face consistency off: tune `set_ip_adapter_scale(0.4-0.8)`
- Generation too slow: reduce steps to 20, ensure `torch.float16`

## Don't do

- Don't rebuild existing verified code
- Don't touch the face video pipeline subdirectory
- Don't add safety filters
- Don't modify anything outside the project directory
- Don't add explicit content

## When done

Run the ad-hoc verifier pattern. Test all 6 scenes. Update `zoe/HANDOFF.md`. Report back what works and what doesn't.

Go.