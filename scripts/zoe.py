#!/usr/bin/env python3
"""
Zoe — local AI companion. v0.2 — voice enabled.
Talks to Ollama (Gemma 4 8B), applies persona + memory, saves sessions, speaks replies.

Usage:
  python3 zoe.py                 # conversational mode (default), voice on
  python3 zoe.py --intimate      # intimate mode
  python3 zoe.py --no-voice      # text only
  python3 zoe.py --voice amy     # use 'amy' voice (default)
  python3 zoe.py --voice lessac  # use 'lessac' voice (calmer)
  python3 zoe.py --memory        # show memory
  python3 zoe.py --reset-memory  # clear memory
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime
from pathlib import Path


def _word_in_text(word: str, text: str) -> bool:
    """Check if `word` appears in `text` as a whole word, not a substring.

    "me" in "eat something" — False (the "me" is inside "some").
    "fuck me" — True (whole word).
    "back" in "push back" — True. "back" in "backyard" — False.
    Multi-word phrases like "on all fours" still need substring matching
    and are NOT routed through this helper.
    """
    if " " in word:
        # Multi-word phrase — use substring match (callers can choose)
        return word in text
    # Single word — require word boundaries
    return bool(re.search(rf"\b{re.escape(word)}\b", text))


def _pose_match_from_cache(text: str):
    """Tier 2.5 Step C — return the cached pose PNG matching the user's
    natural-language input, or None if no match.

    Priority order: the most specific pose keyword wins (multi-word pose
    phrases beat single keywords). Read zoe/assets/poses/index.json for
    the user's hand-picked selection. Falls back to seed_100.png if no
    selection has been made yet (the first render is a reasonable default).

    Keyword-to-scene map mirrors `zoe_scenes.SCENES` keys for the explicit
    poses. Conversational scenes (workout, casual, evening, intimate) are
    not in the pose library — they go through SDXL.
    """
    POSES_DIR = ZOE_DIR / "assets" / "poses"
    index_path = POSES_DIR / "index.json"
    if not index_path.exists():
        return None

    try:
        import json as _json
        index = _json.loads(index_path.read_text())
    except Exception:
        return None

    # multi-word phrases (more specific) checked before single keywords.
    # Order matters: most-specific first.
    candidates = [
        # multi-word pose phrases
        ("on all fours", "on_all_fours"),
        ("on your knees", None),  # → kneeling, no cached scene; skip
        ("on her knees", None),
        ("from behind", "on_all_fours"),
        # 2026-07-29 batch additions
        ("straddle me", "straddle_topdown"),
        ("ride me", "riding"),
        ("sit on my face", "straddle_topdown"),
        ("sit on my", "straddle_topdown"),
        ("straddle", "straddle_topdown"),
        ("from the side", "straddle_sideangle"),
        ("side angle", "straddle_sideangle"),
        ("lie back", "supine_armsup"),
        ("lay back", "supine_armsup"),
        ("arms up", "supine_armsup"),
        ("lie down", "supine_partner_arm"),
        ("on the bed", "supine_partner_arm"),
        ("low angle", "pov_lowangle"),
        ("between your legs", "pov_lowangle"),
        ("fishnet", "standing_fishnet"),
        ("bodystocking", "standing_fishnet"),
        ("stand up", "standing_fishnet"),
        # single pose keywords → matching scene
        ("spread", "spread"),
        ("dildo", "dildo"),
        ("riding", "riding"),
        ("ride", "riding"),
        ("anal", "anal"),
        ("ass", "anal"),          # "in your ass" → anal pose
        ("oral", "oral"),
        ("suck", "oral"),          # "suck my cock" → oral pose
        ("blowjob", "oral"),
        ("throat", "oral"),
        ("foot", "foot"),
        ("feet", "foot"),
        ("toes", "foot"),
        ("penetration", "penetration"),
        ("penetrate", "penetration"),
        ("fuck", "penetration"),   # generic → penetration (default explicit)
        ("cock", "penetration"),   # generic → penetration (default explicit)
        ("pussy", "penetration"),  # generic → penetration (default explicit)
        ("scent", "penetration"),  # placeholder, no scene match; kept for completeness
    ]
    for phrase, scene_name in candidates:
        if phrase in text and scene_name:
            info = index["poses"].get(scene_name, {})
            # prefer the user-selected seed
            selected = info.get("selected")
            if selected:
                candidate = ZOE_DIR / selected
                if candidate.exists():
                    return candidate
            # pick a random seed from available seeds
            seeds_dict = info.get("seeds", {})
            if seeds_dict:
                import random as _random
                random_seed = _random.choice(list(seeds_dict.keys()))
                fallback = ZOE_DIR / seeds_dict[random_seed]
                if fallback.exists():
                    return fallback
    return None

# --- Image gen trigger ---
# Tracks her current look/outfit in this session
CURRENT_LOOK = {"outfit": "casual jeans and a white cotton t-shirt", "mood": "relaxed"}

# --- Config ---
ZOE_DIR = Path(__file__).parent.parent.resolve()
PERSONA_PATH = ZOE_DIR / "persona" / "zoe.md"
MEMORY_PATH = ZOE_DIR / "memory" / "core.md"
SESSIONS_DIR = ZOE_DIR / "memory" / "sessions"
VOICE_DIR = ZOE_DIR / "voice"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma4e-64k"

VOICES = {
    "amy": VOICE_DIR / "en_US-amy-low.onnx",
    "lessac": VOICE_DIR / "en_US-lessac-low.onnx",
}

# --- Load persona + memory ---
def load_file(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()

def build_system_prompt(mode: str) -> str:
    persona = load_file(PERSONA_PATH)
    memory = load_file(MEMORY_PATH)
    mode_note = f"\n\n## CURRENT MODE: {mode.upper()}\nBehave accordingly. Do not switch modes."
    # Brevity directive — gemma4-64k tends to over-write, so we add a
    # hard rule at the end of the system prompt. End position matters
    # because the model attends more to the tail of the system message.
    brevity = (
        "\n\n## RESPONSE LENGTH (HARD RULE)\n"
        "Reply in 1-2 sentences, 20-50 words MAX. Never more than 2 sentences. "
        "No paragraph breaks. No multiple clauses stacked with semicolons. "
        "One thought, said once, said short. If you have more to say, wait "
        "for the user's next message — do not pre-empt it with extra paragraphs."
    )
    return f"{persona}{brevity}\n\n---\n\n## Core memory (read at session start)\n{memory}{mode_note}"

# --- Ollama call ---
def chat(messages: list, system: str) -> str:
    payload = {
        "model": MODEL,
        "messages": [{"role": "system", "content": system}] + messages,
        "stream": False,
        "options": {
            "temperature": 0.85,
            "top_p": 0.9,
            "repeat_penalty": 1.1,
            # Hard cap on response length. ~200 tokens gives the model
            # room to complete a 1-2 sentence reply with natural EOS.
            # The brevity directive in the system prompt does most of the
            # work; this is the safety net that catches overruns.
            # Calibration: 80 = empty replies, 150 = truncated, 200 = good
            # (1-3 sentences, 20-40 words), 500 = model can over-generate
            # to 3-4 sentences, 1000 = same as no cap.
            "num_predict": 200,
        },
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["message"]["content"].strip()

# --- Voice: clean stage directions, then speak ---
def clean_for_speech(text: str) -> str:
    # Strip parentheticals/asterisks used for stage direction so TTS doesn't read them
    text = re.sub(r"\([^)]*\)", "", text)
    text = re.sub(r"\*[^*]*\*", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def speak(text: str, voice_name: str, enabled: bool):
    if not enabled:
        return
    spoken = clean_for_speech(text)
    if not spoken:
        return
    # Lazy import: only pay the XTTS load cost on first voice use.
    try:
        from zoe_tts import speak_to_file
    except Exception as e:
        # If the new TTS module is broken, fall back to silence rather
        # than crash the chat. The text reply still works.
        return
    # Stable path so the `video` command can pick up the latest reply.
    # Overwritten on every reply — there is only ever one "latest".
    wav_path = str(ZOE_DIR / "assets" / "zoe_chat_reply.wav")
    try:
        speak_to_file(spoken, wav_path)
        if os.path.exists(wav_path) and os.path.getsize(wav_path) > 0:
            subprocess.run(["afplay", wav_path], capture_output=True)
    except Exception as e:
        print(f"  [speak] error: {e}", flush=True)

# --- Session save ---
def save_session(messages: list, mode: str):
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
                f"I said: \"{last_zoe[:80]}{'...' if len(last_zoe) > 80 else ''}\""
            )
            with MEMORY_PATH.open("a", encoding="utf-8") as f:
                f.write(entry)

# --- Main loop ---
def run(mode: str, voice_on: bool, voice_name: str):
    print(f"\n  Zoe  ({mode} mode)  —  model: {MODEL}  —  voice: {'on (' + voice_name + ')' if voice_on else 'off'}")
    print(f"  Type 'quit' to exit. Type 'mode' to switch.\n")

    system = build_system_prompt(mode)
    history = []

    opener_prompt = "*walks in, sits down, looks at you* hey."
    opener = chat([{"role": "user", "content": opener_prompt}], system)
    print(f"  Zoe: {opener}\n")
    speak(opener, voice_name, voice_on)
    history.append({"role": "assistant", "content": opener})

    while True:
        try:
            user_input = input("  You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n")
            save_session(history, mode)
            print(f"  Session saved. Memory updated. Bye.\n")
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit", "q"):
            save_session(history, mode)
            print(f"\n  Session saved. Memory updated. Bye.\n")
            break
        if user_input.lower() == "mode":
            new_mode = "intimate" if mode == "conversational" else "conversational"
            print(f"\n  → switching to {new_mode} mode\n")
            run(new_mode, voice_on, voice_name)
            return

        history.append({"role": "user", "content": user_input})
        try:
            reply = chat(history, system)
        except Exception as e:
            print(f"\n  [error: {e}]  Is ollama running?\n")
            history.pop()
            continue
        history.append({"role": "assistant", "content": reply})
        print(f"\n  Zoe: {reply}\n")
        speak(reply, voice_name, voice_on)

        # --- Outfit / show-me / natural-language image triggers ---
        user_lower = user_input.lower()
        show_triggers = ["show me", "let me see", "generate a picture", "generate an image"]
        outfit_triggers = ["put on", "change into", "dressed in", "wearing", "wore"]
        # Tier 2 scene-name triggers (HANDOFF.md line 83). Whole-string match
        # so we don't false-positive on "wearing workout gear" containing "workout".
        # Adding explicit scenes per Tier 2 spec — the full vocabulary for
        # pose/action/oral/etc. The trigger is the *whole* user input being
        # a scene name.
        # Generic scenes from TIER2_GENERIC_ONBOARDING (lines 107-113):
        scene_triggers = [
            # Generic 6 (TIER2_GENERIC_ONBOARDING)
            "athletic", "casual", "evening", "formal", "outdoor", "indoor",
            # Zoe-specific scenes (HANDOFF.md)
            "workout", "intimate", "bed", "naked",
            "spread", "dildo", "riding", "oral", "on_all_fours",
            "foot", "penetration", "anal",
        ]

        # Natural-language image triggers — any of these words/phrases in the
        # user's message fires an image generation. The whole user message is
        # passed as the --outfit description, so the model's own prompt
        # interpretation handles the rest.
        #
        # This is the fix for the "chat understood but no image fired" gap.
        # Action verbs that imply "do this to me / I want to see you ..."
        # Generic conversational verbs (use, give me, i want, i need) are NOT
        # here — they would over-trigger on normal conversation. They live in
        # explicit_request instead.
        action_triggers = [
            "slide", "push", "finger", "suck", "ride", "lay", "lie",
            "spread", "touch", "grab", "kiss", "undress", "strip",
            "fuck", "eat", "lick", "suck on", "play with",
            "remove your clothes", "take off", "take your clothes off",
            "get naked", "get undressed", "lose the clothes",
        ]
        # Body parts / toys.
        # "me" and "you" are matched as whole words (word boundaries) so
        # "eat something" doesn't fire via the "me" inside "some". The
        # matching helper _word_in_text handles the boundary check.
        # "back" is NOT here — "push back", "come back", "back to" all
        # over-trigger. Real "show me your back" commands go through "your".
        body_triggers = [
            "pussy", "vagina", "dick", "penis", "dildo", "cock", "vibrator",
            "ass", "tits", "boobs", "mouth", "clit", "cum", "orgasm",
            "legs", "thighs", "hips", "waist", "shoulder",
            "neck", "lips", "tongue", "fingers", "toes",
            "yourself", "myself", "herself",
            "me", "you", "my", "your", "her",
        ]
        # Pose words
        pose_triggers = [
            "on your back", "on her back", "on all fours", "on your knees",
            "on her knees", "kneeling", "lying", "sitting", "riding",
            "standing", "bent over", "face down", "face up",
            "lie back", "lay back", "on top", "from behind",
        ]

        # Set new outfit if user just declared one
        for trigger in outfit_triggers:
            if trigger in user_lower:
                idx = user_lower.index(trigger) + len(trigger)
                desc = user_input[idx:].strip(" .,!?\"'")
                if desc and len(desc) > 2:
                    CURRENT_LOOK["outfit"] = desc
                    print(f"  [outfit updated: {desc}]")
                break

        # Tier 2: scene-name trigger (whole-string match) — fire zoe_body.py
        if user_lower.strip() in scene_triggers:
            scene_name = user_lower.strip()
            print(f"  [generating full-body — scene: {scene_name}]")
            venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")
            try:
                subprocess.run(
                    [venv_python, str(Path(__file__).parent / "zoe_body.py"),
                     "--scene", scene_name, "--steps", "20", "--width", "768", "--height", "1024"],
                    timeout=300,
                )
            except subprocess.TimeoutExpired:
                print("  [body image gen timed out]")

        # Play all — runs all 6 scenes back-to-back. Takes ~6 min. No input needed.
        if user_lower.strip() in {"play all", "play_all", "playall", "all scenes"}:
            print(f"  [generating ALL 6 scenes back-to-back — ~6 min, please wait]")
            venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")
            try:
                subprocess.run(
                    [venv_python, str(Path(__file__).parent / "zoe_all.py"),
                     "--steps", "20", "--open"],
                    timeout=900,  # 15 min ceiling
                )
            except subprocess.TimeoutExpired:
                print("  [play all timed out after 15 min]")

        # Video — chains SadTalker onto the latest image + most recent TTS audio.
        # Takes 12-15 min on M1 Max. Produces a real MP4 of Zoe's face animating
        # to her last spoken reply. Use this after a chat message produced an image
        # AND audio (i.e. after the voice has spoken at least one reply).
        if user_lower.strip() in {"video", "make video", "animate", "mp4"}:
            print(f"  [generating video — chaining SadTalker (~12-15 min)...]")
            venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")
            # Find the most recent image and the most recent TTS audio
            # The image is in zoe/images/, the audio in /var/folders/.../tmp*.wav
            # (the afplay temp). We need to save the audio somewhere persistent.
            # For now: find latest image, fail if no recent TTS audio is found.
            try:
                # Latest image
                imgs = sorted((ZOE_DIR / "images").glob("zoe_body_*.png"),
                              key=lambda p: p.stat().st_mtime)
                if not imgs:
                    print("  [video] no recent image found — generate one first")
                else:
                    latest_img = imgs[-1]
                    # Use the most recent TTS reply audio (saved at a stable
                    # path by speak() so this command can find it).
                    latest_audio = ZOE_DIR / "assets" / "zoe_chat_reply.wav"
                    if not latest_audio.exists():
                        print(f"  [video] no recent TTS audio at {latest_audio}")
                        print(f"           (type a message first so Zoe speaks a reply, then `video`)")
                    else:
                        print(f"  [video] using image: {latest_img.name}")
                        print(f"  [video] using audio: {latest_audio.name} (most recent TTS reply)")
                        subprocess.run(
                            [venv_python, str(Path(__file__).parent / "zoe_video.py"),
                             str(latest_img), str(latest_audio), "--open"],
                            timeout=1800,  # 30 min ceiling
                        )
            except subprocess.TimeoutExpired:
                print("  [video] timed out after 30 min")

        # Natural-language image trigger: fire if any of:
        #   - action verb AND (body part OR pose)
        #   - pose phrase alone (e.g. "from behind", "on all fours")
        #   - single-word visual command (e.g. "undress", "strip", "kneel")
        #   - explicit show-me / i-want-you / i-need-you request
        has_action = any(t in user_lower for t in action_triggers)
        has_body = any(_word_in_text(t, user_lower) for t in body_triggers)
        has_pose = any(t in user_lower for t in pose_triggers)
        # Single-word visual commands — fire on their own without body/pose.
        # "naked" is NOT here — it's a scene name (handled by scene_triggers above
        # and routes to the dedicated "naked" scene template in zoe_scenes.py).
        visual_single_word = (
            user_lower.strip() in {"undress", "strip", "kneel", "topless",
                                    "bottomless", "down", "arise", "come here"}
            or user_lower.strip().startswith("remove your clothes")
            or user_lower.strip().startswith("take off your")
        )
        explicit_request = (
            "show me " in user_lower
            or "let me see" in user_lower
            or "i want to see" in user_lower
            or "i want you" in user_lower
            or "i need you" in user_lower
        )
        fires = (
            (has_action and (has_body or has_pose))
            or has_pose
            or visual_single_word
            or explicit_request
        )
        # Tier 2.5 Step C — serve cached pose from zoe/assets/poses/ when
        # the user's natural-language input matches a pose keyword AND
        # we have a hand-picked PNG on disk for that pose. Falls back to
        # the existing SDXL path on miss (existing block below).
        #
        # Why this matters: SDXL with the trimmed prompts (Step A) still
        # loses the pose cue ~5-15% of the time because the model itself
        # has compositional weakness on explicit anatomy. Hand-picked
        # cached PNGs are 100% on the pose — they were the specific
        # composition the user picked from the pre-render batch.
        if fires:
            pose_match = _pose_match_from_cache(user_lower)
            if pose_match is not None:
                from pathlib import Path as _P
                print(f"  [pose cache hit: {_P(pose_match).name} — serving from cache]")
                try:
                    subprocess.Popen(["open", str(pose_match)])
                except Exception as e:
                    print(f"  [pose cache] open failed: {e}")
                continue  # skip SDXL generation, continue conversation loop
            venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")
            # Detect explicit context — if the user message contains sexual
            # body parts, toys, or penetration language, prepend the "naked"
            # guidance so the model strips clothing instead of dressing her
            # in something implicit. This is what makes "slide a dildo into
            # your pussy" produce a nude scene, not a clothed one.
            explicit_signal = any(
                t in user_lower for t in
                ["pussy", "vagina", "dildo", "cock", "penis", "dick", "fuck",
                 "lick", "suck on", "suck my", "suck your", "cum", "orgasm",
                 "spread your legs", "ride", "penetration", "anal", "oral",
                 "on all fours", "on her knees", "on your knees", "on top"]
            )
            if explicit_signal:
                # Build a pose-driven prompt that overrides the body prefix's
                # "standing pose" default. The body prefix makes Zoe a
                # standing nude; user text like "spread your legs" alone
                # gets ignored because "standing" wins. We need to write a
                # full pose prompt here, not just "nude + user input."
                #
                # Map user commands to concrete poses the model handles:
                pose = "wide shot, full body visible, low camera angle, "
                pose += "lying on her back, legs spread wide apart, knees bent, "
                pose += "soft warm lighting, no clothing, no fabric, nude, "
                pose += "real human body, anatomically correct, "
                pose += "photorealistic, high detail"

                # Override phrases the user actually used — append them so
                # SDXL weights the specific action in the final composition
                extra = ""
                if "spread" in user_lower:
                    extra = ", legs spread wide, vagina visible"
                if "dildo" in user_lower or "toy" in user_lower or "vibrator" in user_lower:
                    extra += ", holding black silicone dildo, dildo visible"
                if "penis" in user_lower or "cock" in user_lower or "dick" in user_lower or "fuck" in user_lower:
                    extra += ", penetration with erect penis, vagina spread open"
                if "lick" in user_lower or "oral" in user_lower:
                    extra += ", performing oral sex"
                if "anal" in user_lower:
                    extra += ", anal sex, anal penetration"
                if "ride" in user_lower or "on top" in user_lower:
                    extra = ", on top riding position, vagina spread, breasts visible"
                if "on all fours" in user_lower:
                    extra = ", on hands and knees, viewed from behind, buttocks visible, vagina visible"
                if "on your knees" in user_lower or "on her knees" in user_lower:
                    extra = ", kneeling, on her knees, mouth open, looking up at camera"

                outfit_text = pose + extra
            else:
                outfit_text = user_input
            try:
                subprocess.run(
                    [venv_python, str(Path(__file__).parent / "zoe_body.py"),
                     "--outfit", outfit_text, "--steps", "20",
                     "--width", "768", "--height", "1024", "--open"],
                    timeout=300,
                )
            except subprocess.TimeoutExpired:
                print("  [body image gen timed out]")

        # Existing "show me" trigger — generates image of current outfit
        if any(t in user_lower for t in show_triggers):
            print(f"  [generating image — current look: {CURRENT_LOOK['outfit']}]")
            # Use the canonical venv at zoe/.venv — the prior /tmp/zoe-venv hardcode
            # resolved to CommandLineTools system Python which has no torch/diffusers.
            venv_python = str(ZOE_DIR / ".venv" / "bin" / "python3")
            try:
                subprocess.run(
                    [venv_python, str(Path(__file__).parent / "zoe_image.py"),
                     "--outfit", CURRENT_LOOK["outfit"], "--steps", "20", "--width", "768", "--height", "1024"],
                    timeout=300,
                )
            except subprocess.TimeoutExpired:
                print("  [image gen timed out]")

def cmd_memory():
    print(load_file(MEMORY_PATH))

def cmd_reset_memory():
    print("This clears memory. Type 'yes' to confirm.")
    if input("> ").strip().lower() == "yes":
        MEMORY_PATH.write_text(
            "# Zoe's Core Memory\n\n## About him\n- (reset — re-introduce)\n\n## Open threads\n- [ ] re-introduce\n",
            encoding="utf-8",
        )
        print("Memory reset.")
    else:
        print("Cancelled.")

# --- Entry point ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--intimate", action="store_true")
    parser.add_argument("--no-voice", action="store_true")
    parser.add_argument("--voice", default="amy", choices=list(VOICES.keys()))
    parser.add_argument("--memory", action="store_true")
    parser.add_argument("--reset-memory", action="store_true")
    args = parser.parse_args()

    if args.memory:
        cmd_memory()
    elif args.reset_memory:
        cmd_reset_memory()
    else:
        mode = "intimate" if args.intimate else "conversational"
        run(mode, voice_on=not args.no_voice, voice_name=args.voice)
