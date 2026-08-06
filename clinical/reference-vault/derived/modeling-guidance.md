# Adult Clinical Surface-Modeling Guidance

This document contains generalized, non-identifying observations from the private user-provided reference batch. It does not establish medical accuracy or media provenance. Validate all geometry against licensed clinical references before treating it as instruction-grade anatomy.

## Useful observations

### Pose and deformation

- Hip flexion and abduction substantially change the apparent spacing and visibility of external structures.
- Inner-thigh compression, pelvic tilt, lumbar flexion, and gravity alter lower-abdominal and perineal contours.
- A model should not use one fixed intimate-geometry pose for standing, supine, seated, and examination positions.
- Reclined references show soft-tissue contact and occlusion that rigid primitive geometry currently misses.

### Variation and asymmetry

- Natural left/right asymmetry should be supported rather than forcing mirrored geometry.
- Surface prominence, visibility, pigmentation, hair distribution, and surrounding soft-tissue volume vary materially across adults.
- No single reference body should define a canonical “normal.” Variation parameters should use clinically sourced ranges.

### Whole-body continuity

- Pelvic anatomy must transition continuously into the lower abdomen, mons region, perineum, gluteal region, and inner thighs.
- Current isolated spheres/capsules should eventually be replaced by a continuous surface or morph-target system.
- Standing clothed/underwear references are more useful for neutral torso, waist, hip, thigh, and posture proportions than close wide-angle explicit shots.

### Materials

- Use subtle regional variation in roughness, color, and subsurface response; avoid flat single-color materials.
- Avoid copying tattoos, jewelry, faces, scars, or distinctive pigmentation from source subjects.
- Lighting and camera normalization are required before comparing color across references.

## Camera cautions

- Several sources use very close, low-angle, or wide-angle cameras that exaggerate foreground structures and feet/legs.
- Do not derive absolute dimensions from these recordings.
- Use orthographic or calibrated clinical references for proportions and use these videos only for qualitative deformation and variation.

## Proposed adult-only parameters

- `pelvicTilt`
- `hipFlexion`
- `hipAbduction`
- `innerThighCompression`
- `monsFullness`
- `outerFoldVolume`
- `innerFoldVisibility`
- `leftRightAsymmetry`
- `perinealSoftTissueDepth`
- `regionalPigmentationVariation`
- `surfaceRoughnessVariation`

These parameters must remain under the `adult-clinical` content profile. General and pediatric cases must not mount, expose, or accept commands for intimate anatomy, endoscopy, or insertion-training props.

## Excluded uses

- Reproducing a source subject’s likeness or exact body
- Training or publishing from raw media without verified rights and consent
- Inferring internal anatomy, clinical technique, or measurements from uncalibrated recordings
- Representing the media as independently verified university material
- Using adult intimate references in pediatric model generation
