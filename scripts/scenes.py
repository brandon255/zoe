"""
Generic scene templates for full-body character image generation.

These are eight generic outfit/setting scenes that can work with any character.
Each scene returns a string combining outfit + setting.

Spec source: TIER2_GENERIC_ONBOARDING.md lines 102-118 (6 generic scenes).
Explicit scenes (intimate, bed) added per Tier 2 explicit layer extension.
"""

SCENES = {
    "athletic": "athletic wear, fitted top, athletic leggings, supportive footwear, gym or running environment, morning light",
    "casual": "everyday casual clothing, comfortable cotton top, jeans, barefoot, modern interior, soft natural light",
    "evening": "elegant evening attire, dress, low heels, upscale social setting, ambient evening lighting",
    "formal": "tailored formal attire, professional blouse, structured blazer, modern office setting, professional environment",
    "outdoor": "outdoor leisure wear, sun hat, light layers, natural outdoor setting, golden hour sunlight",
    "indoor": "comfortable indoor clothing, relaxed fit, cozy home setting, warm interior lighting",
    "intimate": "seamless black silk panties and matching bra, lingerie, soft warm bedroom lighting, intimate setting, natural body, anatomically correct",
    "bed": "bedroom scene, warm lighting, sheets, intimate pose, natural body, anatomically correct, fine body hair where natural",
}


def get_prompt(scene_name: str) -> str:
    """Return the scene template string for a given scene name."""
    if scene_name not in SCENES:
        raise KeyError(f"Unknown scene '{scene_name}'. Valid scenes: {sorted(SCENES.keys())}")
    return SCENES[scene_name]
