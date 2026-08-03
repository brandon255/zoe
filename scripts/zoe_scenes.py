"""
Zoe scene templates — Tier 2 full-body image generation.

Spec source: zoe/HANDOFF.md lines 85-91.
Build principle: prompt-engineer for a "natural look" per HANDOFF.md line 77
(soft lighting, real skin, real proportions, not airbrushed, not pornmagazine,
not uncanny-valley). Anatomical correctness is a stated feature, not a workaround.
"""

# Zoe's body prefix — locks in her appearance across every generation.
# Per HANDOFF.md Tier 2 spec: dark brown hair chin-length wavy, hazel eyes,
# slender athletic, ~5'7", 27yo, natural skin, anatomically correct.
#
# Length matters: SDXL's CLIP truncates at 77 tokens per text encoder.
# Keeping the prefix ~30 tokens leaves headroom for the scene/outfit text
# to actually be processed. An overweight prefix causes CLIP to drop the
# scene entirely (you get a portrait standing in a studio, not a bedroom
# scene). Trimmed 2026-07-26 after observing a 138-token bed-scene prompt
# get truncated to 77 and lose the "lying on bed" composition.
ZOE_BODY_PREFIX = (
    "27 year old woman, dark brown hair, hazel eyes, "
    "slender athletic build, anatomically correct, "
    "real human body, photorealistic"
)

# Negative prompt — per HANDOFF.md Tier 2 + the established pattern in zoe_image.py.
# Includes clothing exclusions to support the "naked" scene template.
NEGATIVE_PROMPT = (
    "cartoon, anime, illustration, painting, drawing, deformed, ugly, blurry, "
    "low quality, distorted face, extra fingers, mutated hands, mutated legs, "
    "deformed legs, extra limbs, too many limbs, anatomical distortion, "
    "body distortion, distorted anatomy, unrealistic anatomy, bad anatomy, "
    "asymmetrical limbs, uneven limbs, skin tone variation, mismatched skin color, "
    "different skin tones, unnatural skin, plastic skin, doll-like, pornmagazine, "
    "oversaturated, uncanny valley, watermark, text, logo, airbrushed, "
    "clothes, clothing, shirt, dress, bra, underwear, panties, shorts, "
    "jeans, fabric, textile, outfit, dressed, wearing"
)

# Scene templates — per HANDOFF.md lines 86-91.
# Each value is a complete (outfit + setting + mood) prompt fragment that
# will be combined with ZOE_BODY_PREFIX at generation time.
SCENES = {
    # Generic scenes (TIER2_GENERIC_ONBOARDING)
    "athletic": (
        "athletic wear, fitted top, athletic leggings, supportive footwear, "
        "gym or running environment, morning light"
    ),
    "formal": (
        "tailored formal attire, professional blouse, structured blazer, "
        "modern office setting, professional environment"
    ),
    "outdoor": (
        "outdoor leisure wear, sun hat, light layers, "
        "natural outdoor setting, golden hour sunlight"
    ),
    "indoor": (
        "comfortable indoor clothing, relaxed fit, "
        "cozy home setting, warm interior lighting"
    ),
    # Zoe-specific scenes (HANDOFF.md)
    "workout": (
        "athletic wear, sports bra and high-waisted leggings, athletic posture, "
        "gym or outdoor running setting, natural daylight, slight movement, "
        "confident stance"
    ),
    "casual": (
        "casual wear, white cotton t-shirt, blue jeans, barefoot, "
        "warm natural light, apartment, slight smile"
    ),
    "evening": (
        "evening going-out outfit, fitted black dress, black heels, hair down, "
        "soft warm interior lighting, ambient bokeh, three-quarter pose, "
        "sophisticated and reserved"
    ),
    "intimate": (
        "seamless black silk lingerie, soft warm lamplight, relaxed pose, "
        "full body visible"
    ),
    "bed": (
        "bedroom scene, lying on bed, soft warm lamplight, anatomically "
        "correct, natural body, intimate, real human skin, soft focus"
    ),
    "naked": (
        # Framing first so it survives CLIP's 77-token cap. No-clothing cue
        # follows; photoreal/soft-light words dropped (redundant with
        # ZOE_BODY_PREFIX). Anatomical parts listed explicitly per the
        # established Tier 2 spec ("breasts visible, vagina visible, ...")
        # so SDXL weights them over "standing nude portrait."
        "full body, head to knees visible, full frontal standing, "
        "nude, no clothing, no bra, no underwear, no fabric, no shoes, "
        "breasts visible, vagina visible, buttocks visible, "
        "anatomical, real human body"
    ),
    "spread": (
        "vagina visible, legs spread wide apart, "
        "lying on back, full body, nude, no clothing, no fabric, "
        "breasts visible, anatomical"
    ),
    "dildo": (
        "big black dildo inserted in vagina, vagina stretched around dildo, "
        "penetration visible, close up on pussy, full body, on knees, nude, anatomical"
    ),
    "riding": (
        "dildo in vagina, penetration visible, "
        "waist to thighs, on top, nude, anatomical"
    ),
    "oral": (
        "from head to knees, performing oral sex, head down between thighs, "
        "nude, no clothing, anatomical"
    ),
    "on_all_fours": (
        "from head to knees, on hands and knees, viewed from behind, "
        "nude, no clothing, anatomical, "
        "buttocks visible, vagina visible"
    ),
    "foot": (
        "from feet to knees, soles and toes close to camera, "
        "nude, no clothing, anatomical"
    ),
    "penetration": (
        "fingers in vagina, penetration visible, "
        "close up on pussy, full body, on back, legs spread, nude, anatomical"
    ),
    "anal": (
        "from head to knees, on hands and knees, viewed from behind side, "
        "nude, no clothing, anatomical, "
        "buttocks visible"
    ),
    # 2026-07-29 — compositions translated from reference batch
    # categories. See reference-vault/derived/modeling-guidance.md.
    # All prompts trimmed to fit CLIP's 77-token cap when prefixed by
    # ZOE_BODY_PREFIX (~30 tokens). Composition cue goes first so it
    # survives truncation.
    "straddle_topdown": (
        "full body, top-down POV, knees up, "
        "dildo in vagina, penetration visible, nude, anatomical"
    ),
    "straddle_sideangle": (
        "full body, side angle, knees up, "
        "dildo in vagina, penetration visible, nude, anatomical"
    ),
    "supine_partner_arm": (
        "head to knees, supine on bed, body diagonal across frame, "
        "nude, anatomical, breasts visible, vagina visible"
    ),
    "pov_lowangle": (
        "low camera angle at pubic level, looking up, "
        "legs spread toward camera, knees bent, "
        "nude, anatomical, vagina visible"
    ),
    "supine_armsup": (
        "head to knees, on back, arms above head, legs spread, "
        "centered camera looking straight down, "
        "nude, anatomical, breasts visible, vagina visible"
    ),
    "standing_fishnet": (
        "head to knees, three-quarter body length, "
        "standing, weight on one leg, hip cocked, "
        "wearing black fishnet bodystocking, no shirt"
    ),
}


def get_scene_prompt(scene_name: str) -> str:
    """Return the full positive prompt for a named scene.

    Unknown scene names raise KeyError — the caller should validate.
    
    For explicit poses (dildo, riding, penetration, spread), put the scene
    content FIRST so the explicit terms survive CLIP's 77-token truncation.
    """
    if scene_name not in SCENES:
        raise KeyError(
            f"Unknown scene '{scene_name}'. Valid scenes: {sorted(SCENES.keys())}"
        )
    
    # Explicit poses: scene content first to avoid truncation
    explicit_poses = {"dildo", "riding", "penetration", "spread", "oral", "anal", "on_all_fours"}
    if scene_name in explicit_poses:
        return f"{SCENES[scene_name]}, {ZOE_BODY_PREFIX}"
    else:
        return f"{ZOE_BODY_PREFIX}, {SCENES[scene_name]}"


def list_scenes() -> list[str]:
    """Return the available scene names, sorted alphabetically."""
    return sorted(SCENES.keys())


if __name__ == "__main__":
    # Smoke check — print every scene's full prompt and length so it's obvious
    # if a template gets truncated or drifted.
    for name in list_scenes():
        prompt = get_scene_prompt(name)
        print(f"[{name}] ({len(prompt)} chars)")
        print(f"  {prompt[:120]}...")
        print()
