"""
Zoe pose library pre-renderer. Tier 2.5.

SDXL hits ~85% on the explicit compositions ("spread", "dildo",
"riding", etc.). The natural-language path in zoe.py falls back
to a free-form prompt that loses the pose cue to CLIP's 77-token
truncation. This script bakes the explicit pose library to disk
once. Each pose is rendered at N seeds; the user picks the best.

This script uses the ALREADY-TRIMMED prompts in zoe_scenes.py
(Step A from 2026-07-26: framing cue first, scene text ≤40
tokens so the full prompt with body prefix stays under CLIP's
77-token cap).

Output:
  zoe/assets/poses/<scene>/seed_<n>.png   -- N seeds per pose
  zoe/assets/poses/index.json            -- inventory + metadata

Resumable: re-runs skip poses/seeds already on disk (unless --force).
Saves one model load at start by reusing a cached pipeline if
--resume-from-index is passed.

Pose scenes baked (8 explicit compositions from zoe_scenes.py):
  spread, dildo, riding, oral, on_all_fours,
  foot, penetration, anal

Wall time on M1 Max: ~60s per generation (model load is one-time
~30s upfront). Total for 8 poses x 4 seeds = ~35 min.
"""

import argparse
import json
import sys
import time
from pathlib import Path

ZOE_DIR = Path(__file__).parent.parent.resolve()
ASSETS = ZOE_DIR / "assets"
POSES_DIR = ASSETS / "poses"

EXPLICIT_POSES = [
    "spread",
    "dildo",
    "riding",
    "oral",
    "on_all_fours",
    "foot",
    "penetration",
    "anal",
    # 2026-07-29 batch additions — categories drawn from the private
    # reference batch and the Tier 2.5 derived guidance file.
    "straddle_topdown",     # straddling with dildo, top-down POV
    "straddle_sideangle",   # straddling with dildo, eye-level side angle
    "supine_partner_arm",   # supine on bed, partner arm cropped at frame edge
    "pov_lowangle",         # camera at pubic level, looking up
    "supine_armsup",        # on back, arms above head, full frontal
    "standing_fishnet",     # standing figure in fishnet bodystocking
]


def _import_scenes():
    sys.path.insert(0, str(Path(__file__).parent))
    from zoe_scenes import SCENES, get_scene_prompt, NEGATIVE_PROMPT
    return SCENES, get_scene_prompt, NEGATIVE_PROMPT


def generate_pose(pipe, scene: str, seed: int, reference_image_path: str | None = None) -> Path:
    """Render one pose at one seed with a pre-loaded pipeline.
    
    If reference_image_path is provided, uses img2img mode to guide generation.
    """
    from zoe_scenes import NEGATIVE_PROMPT
    from PIL import Image
    import torch

    _, get_scene_prompt, _ = _import_scenes()
    full_prompt = get_scene_prompt(scene)

    gen = torch.Generator(device="mps")
    gen.manual_seed(seed)

    t0 = time.time()
    
    # Load reference image for img2img
    reference_image = None
    if reference_image_path:
        reference_image = Image.open(reference_image_path).convert("RGB")
        # Resize to match target dimensions
        reference_image = reference_image.resize((768, 1024), Image.Resampling.LANCZOS)
    
    if reference_image:
        # Img2Img mode with reference image
        image = pipe(
            prompt=full_prompt,
            image=reference_image,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=28,
            guidance_scale=7.0,
            strength=0.75,  # How much to transform the reference (0-1)
            generator=gen,
        ).images[0]
    else:
        # Standard text-to-image mode
        image = pipe(
            prompt=full_prompt,
            negative_prompt=NEGATIVE_PROMPT,
            num_inference_steps=28,
            guidance_scale=7.0,
            width=768,
            height=1024,
            generator=gen,
        ).images[0]
    elapsed = time.time() - t0

    out_dir = POSES_DIR / scene
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"seed_{seed}.png"
    image.save(str(out_path))
    print(
        f"[zoe_poses] {scene} seed={seed} {elapsed:.1f}s -> {out_path}",
        file=sys.stderr,
        flush=True,
    )
    return out_path


def _load_pipe():
    """Load SDXL once. Returns the pipeline."""
    import torch
    from diffusers import StableDiffusionXLPipeline

    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        use_safetensors=True,
        variant="fp16",
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.to("mps")
    return pipe


def _load_index() -> dict:
    idx = POSES_DIR / "index.json"
    if idx.exists():
        return json.loads(idx.read_text())
    return {
        "poses": {p: {"seeds": {}, "selected": None} for p in EXPLICIT_POSES},
        "created_at": int(time.time()),
    }


def _save_index(index: dict) -> None:
    POSES_DIR.mkdir(parents=True, exist_ok=True)
    (POSES_DIR / "index.json").write_text(json.dumps(index, indent=2))


def render_library(
    seeds: list[int],
    force: bool = False,
    poses: list[str] | None = None,
    reference_image_path: str | None = None,
) -> dict:
    """Render every (pose, seed) not already on disk. Resumable.

    Loads SDXL once at start. Writes/updates index.json incrementally
    so a partial run leaves the inventory accurate.
    """
    poses = poses or EXPLICIT_POSES
    index = _load_index()
    started = time.time()

    # Pre-flight: count work
    pending = []
    for scene in poses:
        for seed in seeds:
            out = POSES_DIR / scene / f"seed_{seed}.png"
            if not out.exists() or force:
                pending.append((scene, seed))
    if not pending:
        print("[zoe_poses] all (pose, seed) already on disk; nothing to do",
              file=sys.stderr, flush=True)
        return index

    print(
        f"[zoe_poses] rendering {len(pending)} (pose, seed) pairs "
        f"({len(poses)} poses x {len(seeds)} seeds, minus what's cached)",
        file=sys.stderr, flush=True,
    )

    pipe = _load_pipe()
    print("[zoe_poses] SDXL loaded; starting generation", file=sys.stderr, flush=True)

    # Make sure every requested pose is in the index
    for scene in poses:
        index["poses"].setdefault(scene, {"seeds": {}, "selected": None})

    for i, (scene, seed) in enumerate(pending, 1):
        try:
            out = generate_pose(pipe, scene, seed, reference_image_path)
            index["poses"][scene]["seeds"][str(seed)] = str(
                out.relative_to(ZOE_DIR)
            )
            # Save after each generation so partial runs are durable.
            _save_index(index)
        except Exception as e:
            print(
                f"[zoe_poses] FAILED {scene} seed={seed}: "
                f"{type(e).__name__}: {e}",
                file=sys.stderr,
                flush=True,
            )
            index["poses"][scene]["seeds"][str(seed)] = None
            _save_index(index)

    index["created_at"] = int(time.time())
    index["seed_list"] = seeds
    index["steps"] = 28
    index["width"] = 768
    index["height"] = 1024
    index["model"] = "stabilityai/stable-diffusion-xl-base-1.0"
    _save_index(index)

    print(
        f"[zoe_poses] done in {(time.time() - started) / 60:.1f} min. "
        f"Index: {POSES_DIR / 'index.json'}",
        file=sys.stderr, flush=True,
    )
    return index


def cmd_list():
    SCENES, _, _ = _import_scenes()
    print(f"Explicit pose library: {len(EXPLICIT_POSES)} scenes")
    for scene in EXPLICIT_POSES:
        print(f"  {scene}")


def cmd_status():
    """Show what's on disk and what the index says."""
    idx = _load_index()
    print(f"index exists at {POSES_DIR / 'index.json'}")
    print(f"{'scene':<14} {'seeds_on_disk':<22} {'selected':<10}")
    print("-" * 50)
    for scene in EXPLICIT_POSES:
        info = idx["poses"].get(scene, {"seeds": {}, "selected": None})
        on_disk = []
        if (POSES_DIR / scene).exists():
            on_disk = sorted(
                int(p.stem.split("_")[1])
                for p in (POSES_DIR / scene).glob("seed_*.png")
            )
        idx_seeds = sorted(
            int(s) for s, v in info["seeds"].items() if v
        )
        print(
            f"{scene:<14} {str(on_disk):<22} {str(info.get('selected')):<10} "
            f"(index: {idx_seeds})"
        )


def cmd_select(scene: str, seed: int):
    """Mark a (scene, seed) as the picked one."""
    idx = _load_index()
    if scene not in idx["poses"]:
        print(f"error: unknown scene '{scene}'", file=sys.stderr)
        sys.exit(1)
    path = POSES_DIR / scene / f"seed_{seed}.png"
    if not path.exists():
        print(f"error: {path} does not exist", file=sys.stderr)
        sys.exit(1)
    idx["poses"][scene]["selected"] = str(path.relative_to(ZOE_DIR))
    _save_index(idx)
    print(f"selected: {idx['poses'][scene]['selected']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--seeds",
        type=str,
        default="100,101,102,103",
        help="comma-separated seeds (default: 4 seeds)",
    )
    parser.add_argument("--steps", type=int, default=28)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--force", action="store_true",
                        help="re-render even if PNG is on disk")
    parser.add_argument("--poses", type=str, default=None,
                        help="comma-separated subset of scenes (default: all 8)")
    parser.add_argument("--select", type=str, default=None,
                        metavar="SCENE:SEED",
                        help="mark a (scene, seed) as the picked one in index.json")
    parser.add_argument("--reference", type=str, default=None,
                        help="path to reference image for img2img generation")
    args = parser.parse_args()

    if args.list:
        cmd_list()
        sys.exit(0)

    if args.status:
        cmd_status()
        sys.exit(0)

    if args.select:
        scene, seed = args.select.split(":")
        cmd_select(scene, int(seed))
        sys.exit(0)

    seeds = [int(s) for s in args.seeds.split(",")]
    poses = [s.strip() for s in args.poses.split(",")] if args.poses else None
    render_library(seeds, force=args.force, poses=poses, reference_image_path=args.reference)