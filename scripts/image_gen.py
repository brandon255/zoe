#!/usr/bin/env python3
"""
Generic full-body character image generator.

This is a reusable component - not tied to any specific character. Use a
subject-specific face image and optional subject prefix to lock in identity
across generations.

Usage:
  python3 image_gen.py "athletic wear, gym setting"
  python3 image_gen.py --scene casual
  python3 image_gen.py --scene formal --seed 42

Requires face.png in ../assets/ for IP-Adapter face consistency.
"""

import argparse
import sys
import time
from pathlib import Path


# --- Config ---
ZOE_DIR = Path(__file__).parent.parent.resolve()
ASSETS_DIR = ZOE_DIR / "assets"
OUT_DIR = ZOE_DIR / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Generic subject prefix — describes a person, not a specific character
SUBJECT_PREFIX = (
    "portrait photo of an adult, "
    "natural features, slender build, "
    "real human body, soft realistic skin texture, photorealistic, "
    "high detail, shot on 85mm lens, natural lighting, "
    "anatomically correct, natural body with fine body hair where natural, "
    "real human proportions, candid photograph style"
)

NEGATIVE = (
    "cartoon, anime, illustration, painting, drawing, deformed, ugly, blurry, low quality, "
    "distorted face, extra fingers, mutated hands, watermark, text, logo, airbrushed, "
    "plastic skin, doll-like, oversaturated, uncanny valley, "
    "man, men, male, masculine, guy, guys, boy, boys, person with beard"
)


def _load_pipe():
    """Load SDXL pipeline with safety_checker=None.

    IP-Adapter face consistency is disabled due to diffusers version incompatibility.
    Falls back to text-only generation.
    """
    import torch
    from diffusers import StableDiffusionXLPipeline

    face_path = ASSETS_DIR / "face.png"
    ip_adapter_available = False

    print("[image_gen] loading SDXL (one-time, ~30-60 sec on first run)...",
          file=sys.stderr, flush=True)
    t0 = time.time()

    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        use_safetensors=True,
        variant="fp16",
        safety_checker=None,
        requires_safety_checker=False,
    )

    # IP-Adapter disabled due to diffusers/IP-Adapter compatibility issues
    # with the current environment. Text-only generation still works.
    if face_path.exists():
        print(f"[image_gen] face.png found at {face_path}, but IP-Adapter disabled (compatibility issue)",
              file=sys.stderr, flush=True)
    else:
        print(f"[image_gen] no face.png found",
              file=sys.stderr, flush=True)

    pipe.to("mps")
    print(f"[image_gen] loaded in {time.time()-t0:.1f}s. Generating...",
          file=sys.stderr, flush=True)
    return pipe, ip_adapter_available, face_path


def generate(description: str, output_path: str, seed: int = None, steps: int = 30) -> str:
    """Generate a full-body image. Returns the output path."""
    import torch
    from PIL import Image

    prompt = f"{SUBJECT_PREFIX}, {description}, natural soft lighting, real human proportions, candid photograph style, shallow depth of field"

    pipe, ip_adapter_available, face_path = _load_pipe()

    gen = torch.Generator(device="mps")
    if seed is not None:
        gen.manual_seed(seed)
    else:
        gen.manual_seed(int(time.time()))

    kwargs = {
        "prompt": prompt,
        "negative_prompt": NEGATIVE,
        "num_inference_steps": steps,
        "guidance_scale": 7.0,
        "width": 768,
        "height": 1024,
        "generator": gen,
    }

    # Only use IP-Adapter if it was successfully loaded
    if ip_adapter_available and face_path:
        # IP-Adapter for SDXL expects a list of preprocessed images
        img = Image.open(face_path)
        kwargs["ip_adapter_image"] = [img]

    t0 = time.time()
    image = pipe(**kwargs).images[0]
    print(f"[image_gen] generated in {time.time()-t0:.1f}s", file=sys.stderr, flush=True)

    image.save(output_path)
    print(f"[image_gen] saved: {output_path}")
    return output_path


if __name__ == "__main__":
    import scenes

    parser = argparse.ArgumentParser()
    parser.add_argument("description", nargs="?", help="custom description (overrides --scene)")
    parser.add_argument("--scene", help="pre-defined scene template (generic: athletic/casual/evening/formal/outdoor/indoor)")
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--steps", type=int, default=30)
    parser.add_argument("--list-scenes", action="store_true", help="print available scenes and exit")
    args = parser.parse_args()

    if args.list_scenes:
        print("Available scenes:", ", ".join(scenes.SCENES.keys()))
        sys.exit(0)

    # Determine prompt: explicit description wins, then --scene, then default
    if args.description:
        desc = args.description
    elif args.scene:
        desc = scenes.get_prompt(args.scene)
    else:
        desc = "casual everyday clothing, modern interior, soft natural light"

    out = OUT_DIR / f"generated_{int(time.time())}.png"
    generate(desc, str(out), seed=args.seed, steps=args.steps)
    print(f"Saved: {out}")
