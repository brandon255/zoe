"""
Zoe — full-body image generation. Tier 2 per zoe/HANDOFF.md.

Builds on the same SDXL pipeline as zoe_image.py (which is verified working —
3 PNG outputs in zoe/images/ from earlier today). Same safety filter off,
same model id, same torch_dtype / variant / scheduler choices. Difference:
this script is scene-driven (one-word triggers: workout, casual, evening,
intimate, bed) OR free-form outfit description, and uses the Zoe body
prefix from zoe_scenes.py to lock in her appearance.

Spec source: zoe/HANDOFF.md Tier 2 (lines 63-97).
Anatomical correctness is a stated feature per HANDOFF.md line 73-77.
Safety filter is disabled at model load per the explicit spec.

Usage:
  python3 zoe_body.py --scene casual
  python3 zoe_body.py --scene intimate
  python3 zoe_body.py --scene bed
  python3 zoe_body.py --outfit "a red silk robe, standing in doorway"
  python3 zoe_body.py --scene evening --seed 42 --steps 30
"""

import argparse
import sys
import time
from pathlib import Path

# --- Config ---
ZOE_DIR = Path(__file__).parent.parent.resolve()
OUT_DIR = ZOE_DIR / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Imported lazily so a quick --list-scenes smoke test doesn't pull torch.
def _import_scenes():
    sys.path.insert(0, str(Path(__file__).parent))
    from zoe_scenes import (
        ZOE_BODY_PREFIX,
        NEGATIVE_PROMPT,
        SCENES,
        get_scene_prompt,
        list_scenes,
    )
    return ZOE_BODY_PREFIX, NEGATIVE_PROMPT, SCENES, get_scene_prompt, list_scenes


def build_prompt(outfit: "str | None" = None, scene: "str | None" = None) -> str:
    """Compose the full positive prompt.

    Precedence: explicit --outfit wins over --scene. If neither, default to 'casual'.
    """
    _, _, _, get_scene_prompt, _ = _import_scenes()
    if outfit:
        # Free-form outfit description. Body prefix is always applied first
        # so her body/face stays consistent.
        prefix, _, _, _, _ = _import_scenes()
        return f"{prefix}, {outfit}"
    scene_name = scene if scene is not None else "casual"
    return get_scene_prompt(scene_name)


def _load_pipe_with_face():
    """Load SDXL + IP-Adapter face consistency if face.png is available.

    IP-Adapter-SDXL-Face is a small reference encoder (~1.5GB) that
    conditions generation on a reference face image. Every output is
    recognizably the same person — face, hair, eyes, build — across
    scenes, outfits, and poses.

    Falls back to plain SDXL if face.png is missing or IP-Adapter is
    not installed.
    """
    import torch
    from diffusers import StableDiffusionXLPipeline

    face_path = ZOE_DIR / "assets" / "face.png"
    has_face = face_path.exists()
    use_ip_adapter = False

    print(f"[zoe_body] loading SDXL (one-time, ~30-60 sec on first run)...",
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

    # Try to attach IP-Adapter face conditioning.
    if has_face:
        try:
            from diffusers import IPAdapterMixin  # noqa: F401
            pipe.load_ip_adapter(
                "h94/IP-Adapter",
                subfolder="sdxl_models",
                weight_name="ip-adapter-plus-face_sdxl_vit-h.safetensors",
            )
            pipe.set_ip_adapter_scale(0.65)  # 0.5-0.75 keeps her identity without overpowering the scene
            use_ip_adapter = True
            print(f"[zoe_body] IP-Adapter face consistency enabled (face.png: {face_path})",
                  file=sys.stderr, flush=True)
        except Exception as e:
            print(f"[zoe_body] IP-Adapter unavailable ({type(e).__name__}: {e}); falling back to text-only",
                  file=sys.stderr, flush=True)
    else:
        print(f"[zoe_body] face.png missing at {face_path}; face consistency disabled",
              file=sys.stderr, flush=True)

    pipe.to("mps")
    print(f"[zoe_body] loaded in {time.time()-t0:.1f}s. Generating...",
          file=sys.stderr, flush=True)
    return pipe, use_ip_adapter, face_path if has_face else None


def generate(outfit: "str | None" = None, scene: "str | None" = None, seed: "int | None" = None,
             steps: int = 28, width: int = 768, height: int = 1024,
             open_after: bool = False) -> Path:
    """Generate a full-body image. Returns the output PNG path."""
    import torch

    full_prompt = build_prompt(outfit=outfit, scene=scene)
    _, NEGATIVE_PROMPT, _, _, _ = _import_scenes()

    pipe, use_ip_adapter, face_path = _load_pipe_with_face()

    gen = torch.Generator(device="mps")
    if seed is not None:
        gen.manual_seed(seed)
    else:
        gen.manual_seed(int(time.time()))

    pipe_kwargs = dict(
        prompt=full_prompt,
        negative_prompt=NEGATIVE_PROMPT,
        num_inference_steps=steps,
        guidance_scale=7.0,
        width=width,
        height=height,
        generator=gen,
    )
    if use_ip_adapter and face_path is not None:
        from PIL import Image as _PILImage
        pipe_kwargs["ip_adapter_image"] = pipe.image_processor.preprocess(
            _PILImage.open(face_path)
        )

    t0 = time.time()
    image = pipe(**pipe_kwargs).images[0]
    print(f"[zoe_body] generated in {time.time()-t0:.1f}s", file=sys.stderr, flush=True)

    tag = scene or "outfit"
    out_path = OUT_DIR / f"zoe_body_{tag}_{int(time.time())}.png"
    image.save(str(out_path))
    print(f"[zoe_body] saved: {out_path}")
    if open_after:
        import subprocess
        subprocess.Popen(["open", str(out_path)])
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scene", choices=None, help="named scene (workout/casual/evening/intimate/bed)")
    parser.add_argument("--outfit", help="free-form outfit/setting description (overrides --scene)")
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--steps", type=int, default=28)
    parser.add_argument("--width", type=int, default=768)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--list-scenes", action="store_true", help="print available scene names and exit")
    parser.add_argument("--open", action="store_true", help="open the result PNG in Preview when done")
    args = parser.parse_args()

    if args.list_scenes:
        _, _, _, _, list_scenes = _import_scenes()
        print("Available scenes:", ", ".join(list_scenes()))
        sys.exit(0)

    if not args.scene and not args.outfit:
        # Default to casual — the everyday baseline.
        args.scene = "casual"

    generate(
        outfit=args.outfit,
        scene=args.scene,
        seed=args.seed,
        steps=args.steps,
        width=args.width,
        height=args.height,
        open_after=args.open,
    )
