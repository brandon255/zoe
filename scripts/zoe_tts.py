"""
ZoeTTS — XTTS-v2 voice cloning engine with single-load model caching.

Replaces the per-call piper subprocess that zoe.py used to invoke. The
new engine:
  - Loads the XTTS-v2 model once on first use, reuses it for every call
  - Clones from zoe/assets/voice_sample.wav (15s of female voice)
  - Falls back to silence if voice_sample.wav is missing
  - Falls back to silent skip on any TTS error (so the chat keeps working
    even if XTTS is broken — we don't want a TTS bug to kill the chat loop)

First call cost: ~30-60s (XTTS model load). Subsequent calls: ~3-5s each.

Per-call invocation (matches the existing synth_zoe.py CLI):
  python3 zoe_tts.py "text to speak" /tmp/output.wav
"""

import os
os.environ.setdefault("COQUI_TOS_AGREED", "1")
# Patch torch.load for PyTorch 2.6+ compatibility with XTTS checkpoints
os.environ.setdefault("PYTHONPATH", "")

import sys
import time
from pathlib import Path

# Reuse the existing _tts_patch helper if available
ZOE_DIR = Path(__file__).parent.parent.resolve()
SCRIPTS_DIR = ZOE_DIR / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
import _tts_patch  # monkey-patches torch.load(weights_only=False)

DEFAULT_VOICE_SAMPLE = str(ZOE_DIR / "assets" / "voice_sample.wav")
DEFAULT_OUTPUT = str(ZOE_DIR / "assets" / "zoe_chat_reply.wav")


class ZoeTTS:
    """Lazy-loaded XTTS-v2 engine. Model is loaded on first .speak() call."""

    def __init__(self, voice_sample: str = DEFAULT_VOICE_SAMPLE, language: str = "en"):
        self.voice_sample = voice_sample
        self.language = language
        self._tts = None  # lazy

    def _ensure_model(self):
        """Load XTTS-v2 model on first call. Cached for subsequent calls."""
        if self._tts is not None:
            return
        if not Path(self.voice_sample).exists():
            raise FileNotFoundError(
                f"Voice sample not found: {self.voice_sample}. "
                f"Zoe needs zoe/assets/voice_sample.wav to clone her voice."
            )
        from TTS.api import TTS
        print(f"  [tts] loading XTTS-v2 (one-time, ~30-60s)...", flush=True)
        t0 = time.time()
        self._tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        print(f"  [tts] loaded in {time.time()-t0:.1f}s", flush=True)

    def speak(self, text: str, output_path: str = DEFAULT_OUTPUT) -> str:
        """Synthesize text to a WAV file. Returns the output path.

        Raises on hard failure. The caller (zoe.py speak()) is expected
        to wrap this in try/except so TTS errors don't kill the chat.
        """
        if not text or not text.strip():
            return output_path
        self._ensure_model()
        import numpy as np
        import scipy.io.wavfile as wavfile

        print(f"  [tts] '{text[:60]}{'...' if len(text) > 60 else ''}'", flush=True)
        t0 = time.time()
        wav = self._tts.tts(
            text=text,
            speaker_wav=self.voice_sample,
            language=self.language,
            temperature=0.75,
        )
        print(f"  [tts] synthesized in {time.time()-t0:.1f}s", flush=True)

        sample_rate = 24000
        wav_int16 = np.clip(np.array(wav) * 32767, -32768, 32767).astype(np.int16)
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        wavfile.write(output_path, sample_rate, wav_int16)
        print(f"  [tts] wrote {output_path} ({Path(output_path).stat().st_size} bytes)", flush=True)
        return output_path


# Module-level singleton — one XTTS model load per process, shared across calls.
_engine: ZoeTTS | None = None


def get_engine() -> ZoeTTS:
    global _engine
    if _engine is None:
        _engine = ZoeTTS()
    return _engine


def speak_to_file(text: str, output_path: str) -> str:
    """Convenience function. Returns output path. Never raises — silent on error."""
    try:
        return get_engine().speak(text, output_path)
    except Exception as e:
        print(f"  [tts] error (silenced): {e}", flush=True)
        return output_path


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "Hey, this is Zoe. The voice cloning is working."
    out = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUTPUT
    speak_to_file(text, out)
