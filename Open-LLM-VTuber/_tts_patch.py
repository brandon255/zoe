"""Patches for TTS + PyTorch 2.6+ compatibility. Run before importing TTS."""
import torch
_orig_load = torch.load


def _patched_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _orig_load(*args, **kwargs)


torch.load = _patched_load
