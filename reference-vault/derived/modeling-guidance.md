# Zoe Tier 2 Modeling Guidance

Generalized, non-identifying observations from the private reference batch.
Source attribution supplied to Brandon Flores. The clips were described as
AI-generated adult subjects uploaded as movement and anatomy references.
This file is the only path the build uses to absorb source influence.

## Body proportions (locked from Zoe prefix, do not modify)

- Slender athletic adult female
- Adult muscle tone consistent with regular movement
- Visible collarbone, defined waist-to-hip differential
- Adult skin with natural fine body hair

## Composition categories observed in the batch

### A. Straddling with dildo visible (5+ clips)

Camera angles vary:
- Top-down POV (over her shoulder, looking down at dildo held between her legs)
- Side angle, eye level (dildo visible between legs, white sheets below)
- Front three-quarter (knees up, dildo visible)
- Front center (legs spread, dildo held at center)

Key visual cues for SDXL:
- Dildo held vertically or at angle between her thighs
- Knees up and out (hip abduction ~100-120°)
- Hands gripping the dildo (one or two-handed)
- Soft warm lamplight, bedroom setting
- White or neutral bedding visible below

### B. Supine on bed with partner arm visible

- Head on pillow, hair splayed
- Body diagonal across frame
- Partner's arm reaching toward her from above (cropped at frame edge)
- Light colored bedding, soft natural light
- Tops of thighs visible at bottom edge of frame

### C. Standing figure (with or without clothing)

- Three-quarter body length visible
- Standing pose, one hip cocked
- Background domestic interior (couch, plants, lighting fixture)
- Weight shifted to one leg

### D. POV legs-spread low-angle

- Camera at pubic level, looking up the body
- Legs spread toward the camera in the foreground
- Torso and head visible in upper third of frame
- Headboard or wall in background

### E. Supine arms-up full-frontal

- On back, arms above head
- Legs spread, knees bent
- Centered camera looking straight down
- White bedding

### F. Seated upright / hair up

- Cross-legged or knees up
- Hair tied up with bow/ribbon
- Natural daylight, plain wall background
- Hand resting on inner thigh or knee

## What NOT to copy from sources

- Any face, tattoo, jewelry, scar, distinguishing feature
- Any specific body proportion that would identify a subject
- Any distinctive coloring or pattern
- Any brand, logo, or text visible in reference material
- Any subject's signature pose that would identify them

## Tier 2 prompt influence

These composition categories are translated into **procedural pose framing
parameters** in `zoe_scenes.SCENES`. Each cache entry has a scene template
that mirrors one of the categories above.

## Zoe's locked appearance

This is the canonical appearance the Tier 2 prefix locks in:

```text
27 year old woman, dark brown hair chin length wavy, hazel eyes,
slender athletic build, anatomically correct, real human body,
natural body with fine body hair, photorealistic, candid
```

These do not change based on reference material.
