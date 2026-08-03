#!/usr/bin/env python3
"""
Zoe — full live conversation loop. v0.3
mic → whisper → ollama (Gemma 4) → XTTS voice clone → SadTalker face animation → video window

All local. All on your M1 Max. No cloud, no API keys.

Usage:
  python3 live.py                # conversational mode
  python3 live.py --intimate     # intimate mode

Controls:
  — press Enter to talk (5-second push-to-talk)
  — type 'm' to toggle mode
  — type 'i <description>' to generate an image of her in that outfit
  — type 'q' or Ctrl-C to quit
"""

import os
os.environ["COQUI_TOS_AGREED"] = "1"
os.environ["PYTHONPATH"] = "/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/SadTalker:" + os.environ.get("PYTHONPATH", "")

import argparse
import json
import subprocess
import sys
import time
import urllib.request
from datetime import datetime
from pathlib import Path

ZOE_DIR = Path("/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe")
SCRIPTS = ZOE_DIR / "scripts"
PERSONA_PATH = ZOE_DIR / "persona" / "zoe.md"
MEMORY_PATH = ZOE_DIR / "memory" / "core.md"
ASSETS = ZOE_DIR / "assets"
FACE_IMAGE = ASSETS / "face.png"
VOICE_SAMPLE = ASSETS / "voice_sample.wav"
SESSIONS_DIR = ZOE_DIR / "memory" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_OUT = ASSETS / "zoe_speaks.wav"
VIDEO_OUT = ASSETS / "zoe_video.mp4"

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "gemma4e-64k"

SADTALKER_DIR = ZOE_DIR / "SadTalker"
SADTALKER_VENV_PY = SADTALKER_DIR / "venv" / "bin" / "python3"


def load_file(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def build_system_prompt(mode: str) -> str:
    persona = load_file(PERSONA_PATH)
    memory = load_file(MEMORY_PATH)
    return f"{persona}\n\n---\n\n## Core memory (read at session start)\n{memory}\n\n## CURRENT MODE: {mode.upper()}\nBehave accordingly. Do not switch modes."


def ollama_chat(messages, system, model=OLLAMA_MODEL):
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": False,
        "options": {"temperature": 0.85, "top_p": 0.9, "repeat_penalty": 1.1},
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())["message"]["content"].strip()


def record_mic(duration=5, samplerate=16000):
    """Record 5 seconds from the default mic."""
    import sounddevice as sd
    import numpy as np
    print(f"\n  🎤 recording for {duration}s... (speak now)", flush=True)
    audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype="float32")
    sd.wait()
    return np.squeeze(audio)


def transcribe(audio_np, samplerate=16000):
    """Whisper transcription."""
    import whisper
    audio = whisper.pad_or_trim(audio_np.astype("float32"))
    model = whisper.load_model("base")
    result = model.transcribe(audio, language="en", fp16=False)
    return result["text"].strip()


def synth_voice(text):
    """Run the working synth_zoe.py script. Returns path to WAV file."""
    result = subprocess.run(
        [sys.executable, str(SCRIPTS / "synth_zoe.py"), text, str(AUDIO_OUT)],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        print(f"  TTS error: {result.stderr[-500:]}", flush=True)
        return None
    return AUDIO_OUT if AUDIO_OUT.exists() else None


def animate_face(audio_path, image_path, output_path):
    """Run SadTalker to animate the face from audio. Returns path to MP4 or None."""
    if not SADTALKER_VENV_PY.exists():
        print("  SadTalker venv missing", flush=True)
        return None
    if not image_path.exists():
        print(f"  Face image missing: {image_path}", flush=True)
        return None
    if not audio_path.exists():
        print(f"  Audio missing: {audio_path}", flush=True)
        return None

    # SadTalker's inference.py: --driven_audio --source_image --result_dir --enhancer gfpgan
    # We need to redirect the output filename to a known location
    result_dir = ASSETS / "sadtalker_output"
    result_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        str(SADTALKER_VENV_PY),
        str(SADTALKER_DIR / "inference.py"),
        "--driven_audio", str(audio_path),
        "--source_image", str(image_path),
        "--result_dir", str(result_dir),
        "--enhancer", "gfpgan",
        "--still",
        "--preprocess", "full",
    ]
    print(f"  Animating face with SadTalker... (this takes ~30-60s)", flush=True)
    t0 = time.time()
    try:
        result = subprocess.run(
            cmd, cwd=str(SADTALKER_DIR),
            capture_output=True, text=True, timeout=600,
        )
    except subprocess.TimeoutExpired:
        print("  SadTalker timed out", flush=True)
        return None
    if result.returncode != 0:
        print(f"  SadTalker error (last 500 chars):\n{result.stderr[-500:]}", flush=True)
        return None

    # SadTalker writes {audio_stem}##{image_stem}.mp4 in result_dir
    audio_stem = audio_path.stem
    image_stem = image_path.stem
    expected = result_dir / f"{audio_stem}##{image_stem}.mp4"
    if not expected.exists():
        # Sometimes the naming differs — find any mp4
        mp4s = list(result_dir.glob("*.mp4"))
        if mp4s:
            expected = max(mp4s, key=lambda p: p.stat().st_mtime)
        else:
            print(f"  SadTalker finished but no MP4 found in {result_dir}", flush=True)
            return None
    # Move to canonical location
    expected.rename(output_path)
    print(f"  ✓ animated in {time.time()-t0:.1f}s → {output_path}", flush=True)
    return output_path


def play_video(path):
    """Open video in macOS default player (QuickTime)."""
    subprocess.Popen(["open", str(path)])


def save_session(messages, mode):
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = SESSIONS_DIR / f"{ts}-{mode}.json"
    path.write_text(json.dumps(messages, indent=2, ensure_ascii=False), encoding="utf-8")
    if messages:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
        last_zoe = next((m["content"] for m in reversed(messages) if m["role"] == "assistant"), "")
        if last_user and last_zoe:
            entry = (
                f"\n- [{datetime.now().strftime('%Y-%m-%d %H:%M')}] "
                f"({mode}) he said: \"{last_user[:80]}{'...' if len(last_user) > 80 else ''}\"  |  "
                f"Zoe said: \"{last_zoe[:80]}{'...' if len(last_zoe) > 80 else ''}\""
            )
            with MEMORY_PATH.open("a", encoding="utf-8") as f:
                f.write(entry)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--intimate", action="store_true")
    args = parser.parse_args()
    mode = "intimate" if args.intimate else "conversational"
    system = build_system_prompt(mode)

    print(f"\n  ╔══════════════════════════════════════╗")
    print(f"  ║  Zoe — live ({mode})".ljust(41) + "║")
    print(f"  ║  mic → whisper → ollama → XTTS → SadTalker".ljust(41) + "║")
    print(f"  ╚══════════════════════════════════════╝")
    print(f"\n  Press Enter to talk (5s). 'm' = mode, 'i <desc>' = image, 'q' = quit.\n")

    # Opening message
    opener = ollama_chat(
        [{"role": "user", "content": "*walks in, sits down* hey."}],
        system,
    )
    print(f"  Zoe: {opener}\n")
    audio = synth_voice(opener)
    if audio:
        video = animate_face(audio, FACE_IMAGE, VIDEO_OUT)
        if video:
            play_video(video)
        else:
            print("  (no face animation, but audio is at zoe_speaks.wav — open it to hear her)")
    history = [{"role": "assistant", "content": opener}]

    while True:
        try:
            cmd = input("\n  [enter=talk, m=mode, q=quit] > ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if cmd.lower() in ("q", "quit", "exit"):
            break
        if cmd.lower() == "m":
            mode = "intimate" if mode == "conversational" else "conversational"
            system = build_system_prompt(mode)
            print(f"  → {mode} mode")
            continue
        if cmd.lower().startswith("i "):
            print(f"  [image gen] not wired yet — see generate_face.py / zoe_image.py")
            continue

        # Record + transcribe
        try:
            audio_in = record_mic()
        except Exception as e:
            print(f"  mic error: {e}")
            continue
        print("  transcribing... ", end="", flush=True)
        t0 = time.time()
        try:
            user_text = transcribe(audio_in)
        except Exception as e:
            print(f"failed: {e}")
            continue
        print(f"({time.time()-t0:.1f}s) heard: \"{user_text}\"")
        if not user_text:
            print("  (no speech detected)")
            continue

        # Generate reply
        history.append({"role": "user", "content": user_text})
        print("  Zoe thinking... ", end="", flush=True)
        t0 = time.time()
        try:
            reply = ollama_chat(history, system)
        except Exception as e:
            print(f"ollama error: {e}")
            history.pop()
            continue
        print(f"({time.time()-t0:.1f}s)")
        print(f"  Zoe: {reply}")
        history.append({"role": "assistant", "content": reply})

        # Voice + face
        audio = synth_voice(reply)
        if audio:
            video = animate_face(audio, FACE_IMAGE, VIDEO_OUT)
            if video:
                play_video(video)

    save_session(history, mode)
    print("\n  Session saved. Memory updated. Bye.\n")


if __name__ == "__main__":
    main()
