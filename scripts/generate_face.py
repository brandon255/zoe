#!/usr/bin/env python3
"""
Generate Zoe's face locally.
Uses SDXL + uncensored LoRA. Runs on MPS (Apple GPU).
Outputs a single realistic face image that we'll feed to SadTalker for animation.

Usage:
  python3 generate_face.py "reserved 27yo woman, dark hair, soft features, natural lighting, portrait"
  python3 generate_face.py  # uses default Zoe prompt
"""

import sys
from pathlib import Path
import torch
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler

OUT = Path(__file__).parent.parent / "assets" / "face.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

DEFAULT_PROMPT = (
    "portrait photo of a 27 year old woman, reserved and sophisticated, "
    "soft natural features, dark brown hair chin length wavy loose waves, "
    "light hazel eyes, minimal makeup, slight knowing smile, looking at camera, "
    "natural window lighting, shallow depth of field, "
    "shot on 85mm lens, photorealistic, high detail skin texture, "
    "head and shoulders framing, neutral background"
)

NEGATIVE = (
    "cartoon, anime, illustration, painting, sketch, drawing, "
    "deformed, ugly, blurry, low quality, distorted face, "
    "extra fingers, mutated hands, watermark, text, logo, "
    "nudity, explicit, suggestive, low-cut, revealing"
)


def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PROMPT
    print(f"Loading SDXL on MPS (one-time, ~30-60s)...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
    )
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    pipe.to("mps")
    pipe.enable_attention_slicing()
    print("Generating face...")
    img = pipe(
        prompt=prompt,
        negative_prompt=NEGATIVE,
        num_inference_steps=30,
        guidance_scale=7.0,
        width=768,
        height=768,
    ).images[0]
    img.save(OUT)
    print(f"\nSaved: {OUT}")
    print(f"Open it to approve, or run with a different prompt to regenerate.")


if __name__ == "__main__":
    main()
