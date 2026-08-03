"""
Zoe video — chain SadTalker onto a Zoe image + audio to produce a real MP4
of her face animating to the audio.

This is the Tier 1 + Tier 2 chained: still image + voice reply = animated
face video. The verified working path: SadTalker inference.py with GFPGAN
enhancer, --still --preprocess full, in the SadTalker venv. Verified MP4
at zoe/assets/sadtalker_output/2026_07_26_19.01.47.mp4.

Wall time: 12-15 min per 5s clip on M1 Max. The "silent hang" wall
(stdscr buffering) is fixed by running with `python3 -u` and tee'd to
a log file.

Usage:
  python3 scripts/zoe_video.py zoe/assets/face.png zoe/assets/zoe_test_speech.wav
  python3 scripts/zoe_video.py <image.png> <audio.wav> --open
"""
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

ZOE_DIR = Path(__file__).parent.parent.resolve()
SADTALKER_DIR = ZOE_DIR / "SadTalker"
SADTALKER_VENV_PY = SADTALKER_DIR / "venv" / "bin" / "python3"
SADTALKER_OUTPUT_DIR = ZOE_DIR / "assets" / "sadtalker_output"


def animate(image_path: Path, audio_path: Path, open_after: bool = False) -> Path | None:
    """Run SadTalker on image + audio. Returns output MP4 path or None."""
    if not SADTALKER_VENV_PY.exists():
        print(f"  [video] SadTalker venv missing at {SADTALKER_VENV_PY}", flush=True)
        return None
    if not image_path.exists():
        print(f"  [video] image missing: {image_path}", flush=True)
        return None
    if not audio_path.exists():
        print(f"  [video] audio missing: {audio_path}", flush=True)
        return None

    SADTALKER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # The "silent hang" fix from the wall list: -u for unbuffered output
    # + 2>&1 | tee to a log file. Without -u, SadTalker's stdout buffers
    # and the call looks hung for 6+ minutes before any progress appears.
    log_path = Path("/tmp/sadtalker_zoe.log")
    cmd = [
        str(SADTALKER_VENV_PY), "-u",
        str(SADTALKER_DIR / "inference.py"),
        "--driven_audio", str(audio_path),
        "--source_image", str(image_path),
        "--result_dir", str(SADTALKER_OUTPUT_DIR),
        "--enhancer", "gfpgan",
        "--still",
        "--preprocess", "full",
    ]
    print(f"  [video] animating face with SadTalker (~12-15 min on M1 Max)...", flush=True)
    t0 = time.time()
    try:
        # Use subprocess with line-buffered stdout to surface progress
        with open(log_path, "w") as logf:
            result = subprocess.run(
                cmd, cwd=str(SADTALKER_DIR),
                stdout=logf, stderr=subprocess.STDOUT,
                text=True, timeout=1800,  # 30 min ceiling
            )
    except subprocess.TimeoutExpired:
        print(f"  [video] SadTalker timed out (30 min). Tail of log:", flush=True)
        if log_path.exists():
            print(log_path.read_text()[-1000:], flush=True)
        return None

    if result.returncode != 0:
        print(f"  [video] SadTalker returned non-zero exit {result.returncode}", flush=True)
        if log_path.exists():
            print(f"  [video] tail of log:\n{log_path.read_text()[-500:]}", flush=True)
        return None

    # SadTalker writes {audio_stem}##{image_stem}.mp4 in result_dir
    audio_stem = audio_path.stem
    image_stem = image_path.stem
    expected = SADTALKER_OUTPUT_DIR / f"{audio_stem}##{image_stem}.mp4"
    if not expected.exists():
        # Naming can vary; pick the most recent mp4
        mp4s = list(SADTALKER_OUTPUT_DIR.glob("*.mp4"))
        if mp4s:
            expected = max(mp4s, key=lambda p: p.stat().st_mtime)
        else:
            print(f"  [video] SadTalker finished but no MP4 in {SADTALKER_OUTPUT_DIR}", flush=True)
            return None

    # Move to a stable, descriptive name in assets/
    out_path = ZOE_DIR / "assets" / f"zoe_video_{int(time.time())}.mp4"
    expected.rename(out_path)
    elapsed = time.time() - t0
    print(f"  [video] done in {elapsed:.0f}s → {out_path}", flush=True)
    if open_after:
        subprocess.Popen(["open", str(out_path)])
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("image", help="path to source image (Zoe face or full body)")
    parser.add_argument("audio", help="path to driven audio (WAV, 24kHz)")
    parser.add_argument("--open", action="store_true", help="open MP4 in QuickTime when done")
    args = parser.parse_args()

    result = animate(Path(args.image), Path(args.audio), open_after=args.open)
    if result is None:
        sys.exit(1)
    print(result)
