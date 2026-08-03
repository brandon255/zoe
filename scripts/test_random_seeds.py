#!/usr/bin/env python3
"""
Quick test to verify pose cache returns different seeds on multiple calls.
"""

import sys
from pathlib import Path

ZOE_DIR = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(ZOE_DIR / "scripts"))

from zoe import _pose_match_from_cache

test_inputs = [
    "spread your legs",
    "fuck me",
    "ride me",
]

print("Testing random seed selection...")
print("=" * 60)

for i in range(3):
    print(f"\nRound {i+1}:")
    for test_input in test_inputs:
        result = _pose_match_from_cache(test_input.lower())
        if result:
            print(f"  '{test_input}' -> {result.name}")
        else:
            print(f"  '{test_input}' -> None")

print("\n" + "=" * 60)
print("If you see different seed numbers for the same input across rounds,")
print("random selection is working. If you see the same seed every time,")
print("it's not.")
