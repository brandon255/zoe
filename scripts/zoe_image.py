#!/usr/bin/env python3
"""
Zoe — image generator.
Generates images of Zoe in described outfits/looks, locally, no safety filters.

Usage:
  python3 zoe_image.py "Zoe in black seamless silk panties and a sports bra, workout"
  python3 zoe_image.py --outfit "casual jeans and white tee"
  python3 zoe_image.py --outfit "black lace lingerie, kneeling on bed"
  python3 zoe_image.py --outfit "athletic wear, running shorts, sports bra" --seed 42
"""

import argparse
import sys
import time
from pathlib import Path

# --- Config ---
ZOE_DIR = Path(__file__).parent.parent.resolve()
OUT_DIR = ZOE_DIR / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Zoe's base appearance prompt prefix (her look — same every time so she stays consistent)
ZOE_BASE = (
    "A 27-year-old woman with shoulder-length dark brown hair, brown eyes, "
    "soft features, natural makeup, slender athletic build, real skin texture, "
    "photorealistic, high quality photograph, natural lighting, looking at camera"
)

NEGATIVE_PROMPT = (
    "cartoon, anime, 3d render, illustration, deformed, ugly, blurry, "
    "low quality, plastic skin, doll-like, watermark, text, logo"
)

def generate(outfit_desc: str, seed: int = None, steps: int = 28, width: int = 768, height: int = 1024):
    """Generate image of Zoe in the described outfit/look."""
    import torch
    from diffusers import StableDiffusionXLPipeline

    full_prompt = f"{ZOE_BASE}, {outfit_desc}"

    print(f"Loading SDXL... (one-time, ~30-60 sec on first run)", file=sys.stderr)
    t0 = time.time()

    # safety_checker=None removes the built-in NSFW filter. Standard documented opt-out.
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        use_safetensors=True,
        variant="fp16",
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.to("mps")
    print(f"Loaded in {time.time()-t0:.1f}s. Generating...", file=sys.stderr)

    gen = torch.Generator(device="mps")
    if seed is not None:
        gen.manual_seed(seed)
    else:
        gen.manual_seed(int(time.time()))

    t0 = time.time()
    image = pipe(
        prompt=full_prompt,
        negative_prompt=NEGATIVE_PROMPT,
        num_inference_steps=steps,
        guidance_scale=7.0,
        width=width,
        height=height,
        generator=gen,
    ).images[0]
    print(f"Generated in {time.time()-t0:.1f}s", file=sys.stderr)

    out_path = OUT_DIR / f"zoe_{int(time.time())}.png"
    image.save(str(out_path))
    print(f"Saved: {out_path}")
    return out_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", nargs="?", default=None, help="full prompt OR use --outfit")
    parser.add_argument("--outfit", default=None, help="describe her outfit/look")
    parser.add_argument("--seed", type=int, default=None, help="seed for reproducibility")
    parser.add_argument("--steps", type=int, default=28, help="inference steps (more = better quality, slower)")
    parser.add_argument("--width", type=int, default=768)
    parser.add_argument("--height", type=int, default=1024)
    args = parser.parse_args()

    desc = args.outfit or args.prompt
    if not desc:
        print("Provide a description: python3 zoe_image.py --outfit 'black silk lingerie'")
        sys.exit(1)

    generate(desc, seed=args.seed, steps=args.steps, width=args.width, height=args.height)
