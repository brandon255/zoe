"""Synthesize Zoe's voice with XTTS-v2. Clean path, no shims."""
import os
os.environ["COQUI_TOS_AGREED"] = "1"

import sys
sys.path.insert(0, os.path.dirname(__file__))
import _tts_patch  # monkey-patches torch.load to weights_only=False (XTTS checkpoint needs it)

import numpy as np
import scipy.io.wavfile as wavfile
import torch
from TTS.api import TTS


def synth_zoe(text: str, output_path: str, speaker_wav: str):
    """Synthesize speech in Zoe's cloned voice."""
    print(f"  [TTS] '{text[:60]}{'...' if len(text)>60 else ''}'", flush=True)
    import time
    t0 = time.time()

    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
    print(f"  [TTS] model loaded in {time.time()-t0:.1f}s, synthesizing...", flush=True)
    t1 = time.time()
    wav = tts.tts(
        text=text,
        speaker_wav=speaker_wav,
        language="en",
        temperature=0.75,
    )
    print(f"  [TTS] synthesized in {time.time()-t1:.1f}s", flush=True)

    sample_rate = 24000
    wav_int16 = np.clip(np.array(wav) * 32767, -32768, 32767).astype(np.int16)
    wavfile.write(output_path, sample_rate, wav_int16)
    print(f"  [TTS] wrote {output_path} ({os.path.getsize(output_path)} bytes)", flush=True)
    return output_path


if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else "Hey, this is Zoe. The voice cloning is working."
    out = sys.argv[2] if len(sys.argv) > 2 else "/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/assets/zoe_test_speech.wav"
    speaker = "/Users/BrandonMonicFlores/Desktop/doctrine-labs/zoe/assets/voice_sample.wav"
    synth_zoe(text, out, speaker)
