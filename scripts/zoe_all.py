"""
Generate all Zoe scene templates back-to-back.

Run once, get all 6 scenes in `zoe/images/zoe_all_<timestamp>/`:
  workout, casual, evening, intimate, bed, naked

Each scene takes ~60s on M1 Max (first run ~90s for SDXL load).
Total wall time: ~6 minutes for all 6.

Usage:
  python3 scripts/zoe_all.py
  python3 scripts/zoe_all.py --steps 20 --seed 42    # reproducible
  python3 scripts/zoe_all.py --scenes casual,naked   # subset
  python3 scripts/zoe_all.py --open                  # open each in Preview
"""
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from zoe_body import generate
from zoe_scenes import list_scenes

ZOE_DIR = Path(__file__).parent.parent.resolve()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=20)
    parser.add_argument("--seed", type=int, default=None,
                        help="fixed seed for reproducibility (default: random per scene)")
    parser.add_argument("--scenes", default=None,
                        help="comma-separated scene list (default: all)")
    parser.add_argument("--open", action="store_true",
                        help="open each PNG in Preview as it's generated")
    parser.add_argument("--out-dir", default=None,
                        help="output directory (default: zoe/images/zoe_all_<ts>/)")
    args = parser.parse_args()

    scenes = args.scenes.split(",") if args.scenes else list_scenes()
    invalid = [s for s in scenes if s not in list_scenes()]
    if invalid:
        print(f"Unknown scenes: {invalid}. Valid: {list_scenes()}")
        sys.exit(1)

    # Output dir
    if args.out_dir:
        out_dir = Path(args.out_dir)
    else:
        out_dir = ZOE_DIR / "images" / f"zoe_all_{int(time.time())}"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"[zoe_all] output dir: {out_dir}")
    print(f"[zoe_all] generating {len(scenes)} scenes: {scenes}")
    print(f"[zoe_all] steps={args.steps}, seed={'fixed-' + str(args.seed) if args.seed else 'random'}\n")

    # First scene loads SDXL (~30-60s extra on first run)
    print(f"[zoe_all] === Round 1: '{scenes[0]}' (this is the slow one — model load) ===")
    t_start = time.time()

    results = []
    for i, scene in enumerate(scenes):
        print(f"\n[zoe_all] === {i+1}/{len(scenes)}: '{scene}' ===")
        seed = args.seed if args.seed is not None else None
        t0 = time.time()
        try:
            out_path = generate(scene=scene, seed=seed, steps=args.steps)
            # Move to our out_dir with a clean name
            final_path = out_dir / out_path.name
            out_path.rename(final_path)
            elapsed = time.time() - t0
            print(f"[zoe_all]   {scene}: {elapsed:.1f}s → {final_path.name}")
            if args.open:
                import subprocess
                subprocess.Popen(["open", str(final_path)])
            results.append((scene, "ok", final_path, elapsed))
        except Exception as e:
            elapsed = time.time() - t0
            print(f"[zoe_all]   {scene}: FAILED after {elapsed:.1f}s — {e}")
            results.append((scene, "fail", None, elapsed))

    total = time.time() - t_start
    print(f"\n[zoe_all] === Done in {total:.1f}s ({total/60:.1f} min) ===")
    print(f"[zoe_all] Output: {out_dir}")
    print(f"\nResults:")
    for scene, status, path, elapsed in results:
        marker = "OK" if status == "ok" else "FAIL"
        line = f"  [{marker}] {scene:10s} {elapsed:5.1f}s"
        if path:
            line += f"  {path.name}"
        print(line)


if __name__ == "__main__":
    main()
