#!/usr/bin/env python3
"""
Tier 2 verification script — validates that all 8 scenes (6 generic + 2 explicit)
generated successfully and produce valid PNG files.

Usage: python3 verify_tier2.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

ZOE_DIR = Path(__file__).parent.parent.resolve()
IMAGES_DIR = ZOE_DIR / "images"


def check_file_exists(filepath: Path, description: str) -> bool:
    """Check if a file exists and is not empty."""
    if not filepath.exists():
        print(f"❌ {description}: File not found at {filepath}")
        return False
    if filepath.stat().st_size == 0:
        print(f"❌ {description}: File is empty at {filepath}")
        return False
    print(f"✅ {description}: {filepath.name} ({filepath.stat().st_size / 1024:.1f}KB)")
    return True


def check_image_resolution(filepath: Path) -> bool:
    """Check if an image has the expected resolution (768x1024)."""
    try:
        from PIL import Image
        with Image.open(filepath) as img:
            width, height = img.size
            if (width, height) == (768, 1024):
                print(f"   Resolution: {width}x{height} ✅")
                return True
            else:
                print(f"   Resolution: {width}x{height} ❌ (expected 768x1024)")
                return False
    except Exception as e:
        print(f"   Error reading image: {e} ❌")
        return False


def check_scenes_module() -> bool:
    """Check that scenes.py exists and has all 8 scene templates (6 generic + 2 explicit)."""
    try:
        import scenes
        expected = {"athletic", "casual", "evening", "formal", "outdoor", "indoor", "intimate", "bed"}
        actual = set(scenes.SCENES.keys())
        if actual == expected:
            print(f"✅ scenes.py: All 8 scenes defined correctly (6 generic + 2 explicit)")
            return True
        else:
            missing = expected - actual
            extra = actual - expected
            if missing:
                print(f"❌ scenes.py: Missing scenes: {missing}")
            if extra:
                print(f"❌ scenes.py: Extra scenes: {extra}")
            return False
    except Exception as e:
        print(f"❌ scenes.py: Error loading module: {e}")
        return False


def check_zoe_py_triggers() -> bool:
    """Check that zoe.py exists and contains scene triggers."""
    zoe_py = ZOE_DIR / "scripts" / "zoe.py"
    if not zoe_py.exists():
        print(f"❌ zoe.py: File not found")
        return False

    content = zoe_py.read_text()
    required_triggers = ["athletic", "casual", "evening", "formal", "outdoor", "indoor", "intimate", "bed"]
    missing = []
    for trigger in required_triggers:
        if trigger not in content:
            missing.append(trigger)

    if missing:
        print(f"❌ zoe.py: Missing scene triggers: {missing}")
        return False
    else:
        print(f"✅ zoe.py: All 8 scene triggers present (6 generic + 2 explicit)")
        return True


def main():
    print("=" * 60)
    print("Tier 2 Verification — Generic Scene Image Generation")
    print("=" * 60)
    print()
    
    # Check that required files exist
    print("1. Checking required files...")
    all_ok = True
    
    image_gen = ZOE_DIR / "scripts" / "image_gen.py"
    all_ok &= check_file_exists(image_gen, "image_gen.py")
    
    scenes_py = ZOE_DIR / "scripts" / "scenes.py"
    all_ok &= check_file_exists(scenes_py, "scenes.py")
    
    print()
    
    # Check scene templates
    print("2. Checking scene templates...")
    all_ok &= check_scenes_module()
    print()
    
    # Check chat integration
    print("3. Checking chat integration (zoe.py)...")
    all_ok &= check_zoe_py_triggers()
    print()
    
    # Check generated images
    print("4. Checking generated images...")
    generated_images = sorted(IMAGES_DIR.glob("generated_*.png"))

    if not generated_images:
        print("❌ No generated images found in images/")
        print("   Run: python3 scripts/image_gen.py --scene athletic")
        all_ok = False
    else:
        print(f"Found {len(generated_images)} generated images")

        # Check the 8 most recent (the ones we just generated: 6 generic + 2 explicit)
        recent_images = generated_images[-8:]
        for img in recent_images:
            if not check_file_exists(img, f"Image {img.name}"):
                all_ok = False
            elif not check_image_resolution(img):
                all_ok = False
            print()
    
    print("=" * 60)
    if all_ok:
        print("✅ Tier 2 VERIFIED: All checks passed")
        print("=" * 60)
        return 0
    else:
        print("❌ Tier 2 FAILED: Some checks did not pass")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
