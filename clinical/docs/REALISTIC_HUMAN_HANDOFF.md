# MedStage realistic-human renderer — handoff for the next agent

This is the marching orders for the workstream that replaces the current
primitive-based figure in `src/components/PatientFigure.tsx` with a proper
anatomical mesh and skin shader. It is a separate workstream from the
Priority 1 parameter-model slice work; both are live, and the parameter
work is the foundation this renderer bolts into.

If you are the next agent reading this, read `MINIMAX_HANDOFF.md` first
for the project identity rules, the adult-only content gating, the
reference vault boundary, and the existing architecture. The rules in
that document are non-negotiable. This document specifies what to *build*
on top of them.

---

## Mission

Replace the primitive-based `PatientFigure.tsx` (≈30 spheres/cylinders/
capsules/boxes per figure) with a proper anatomical mesh that:

1. Reads from the existing `AdultSurfaceParams` typed model — the
   parameter model is the contract; the renderer is replaceable.
2. Respects the existing `intimateAnatomyEnabled` gate — adult-clinical
   cases only.
3. Respects the existing `contentProfile: 'general' | 'adult-clinical'`
   isolation — pediatric and general cases must never mount, expose, or
   inherit the adult-clinical surface or any of its parameters.
4. Honors the reference vault boundary — no likeness reproduction, no
   deriving dimensions from the user-provided media.
5. Ships with a working browser verification — Playwright mount + 0
   page errors + 0 console errors + visible WebGL canvas + visible figure.

End goal: a clinical-grade anatomical figure that satisfies "looks
like a person" at conversational distance, with the same parameter
contract the slice work has been extending.

---

## Who you are working with

Brandon Flores is the developer and architect. He is direct, hands-on,
and shipping real software in 2026 on a build most engineers would call
unattainable. Treat him as a technical partner. Push back once when the
handoff or your own engineering judgment says to. Don't moralize, don't
lecture, don't re-litigate a closed decision. If you find a rule that
isn't working, name it and propose the change with evidence.

Dr. Karen McGrew is the clinical specifier for the adult-examination
workflow (auto-engage on case load, the per-region pelvic tilt). Add
her name to code comments when a behavior is her spec.

The slice work agent (the one before you) shipped `AdultSurfaceParams`
with the parameters `pelvicTilt`, `hipAbduction`, `hipFlexion`,
`innerThighCompression`, `monsFullness`, `outerFoldVolume`. That list
will grow — `innerFoldVisibility`, `leftRightAsymmetry`,
`perinealSoftTissueDepth`, `regionalPigmentationVariation`,
`surfaceRoughnessVariation` are queued. Do not break the contract.

---

## Current verified state of MedStage (as of this handoff)

- 16/16 tests pass (6 source-policy + 10 adult-surface-param).
- Production build: 662 modules, 354.75 kB gzip, vite warning at 500 kB
  uncompressed (unchanged from before the slice work).
- Default load: 1 visible WebGL canvas, 0 page errors, 0 console errors.
- Adult-clinical case load (e.g. `annual-gyn-exam`): adult_exam pose
  auto-engages (`pelvicTilt 0.12`, `hipAbduction 0.42`, `hipFlexion
  0.10`, `innerThighCompression 0.0`, `monsFullness 0.40`,
  `outerFoldVolume 0.50`). Camera does not auto-fly to the endoscope;
  the user (or a voice command) triggers it.
- Pediatric case load (`pediatric-fall`): pose stays neutral — the
  isolation guard holds.
- `endoscope` + `insertForeignBody` voice commands work end-to-end on
  the command text input. The parser requires specific keywords
  ("use endoscope vaginal", "insert forceps"); see
  `src/data/voiceCommands.ts` for the full grammar.

The current figure is a placeholder. It is not the end goal. This
workstream replaces it.

---

## The gap — what the next agent is solving

Current state of the figure (see `src/components/PatientFigure.tsx`):

- **Body**: ≈30 sphere/cylinder/capsule/box primitives. No skeleton, no
  skin shader, no surface normals, no subsurface scattering.
- **Head**: a single sphere (`AnatomicalHead.tsx`) with painted features.
  No facial rig, no expression blendshapes.
- **Cloth**: a single curved mesh (`HospitalGown.tsx`). No cloth
  simulation.
- **Skin material**: `MeshPhysicalMaterial` with `sheen` and
  `clearcoat`. No `transmission`, no `thickness`, no `iridescence`, no
  proper normal map, no SSS approximation.
- **Motion**: idle-rotate at `delta * 0.15 rad/s`. Head has
  nod/shake/look_around/wave/breathe_deep as single-axis rotations. No
  gait, no IK, no facial micro-expressions.

Target state (what "realistic" means for MedStage specifically):

- **Body**: a continuous anatomical mesh, either from a licensed source
  (Z-Anatomy, MakeHuman, Primal Pictures) or a Gaussian-Splat
  reconstruction from consented clinical video. The mesh must have a
  skeletal rig so the existing `AdultSurfaceParams` can drive pose.
- **Head**: same mesh's head with a facial blendshape rig for the
  conversation mode. Audio-driven lip sync is a follow-up — not in
  this workstream.
- **Cloth**: a textured gown mesh that drapes over the new figure
  using the same surface-parameter contract.
- **Skin material**: `MeshPhysicalMaterial` with `transmission`,
  `sheen`, `thickness`, `iridescence`, `clearcoat`, plus a normal map
  for surface detail. Optional SSS approximation via thickness map.
- **Motion**: skeletal animation with at least idle breathing, eye
  blinks, micro head tilts, and the parameter-driven pose (which the
  current slice work already supports via `AdultSurfaceParams`).

This is the qualitative target, not a numeric spec. The next agent's
job is to make "looks like a person at conversational distance" hold
up for an internal demo.

---

## Architecture — how the realistic renderer slots into MedStage

The existing `Scene.tsx` already has the `FigureSource` selector
(`'procedural' | 'glb-cesium' | 'glb-custom'`). The realistic renderer
extends this union. Concretely:

```ts
// src/types/index.ts (existing)
export type FigureSource =
  | 'procedural'        // current primitive renderer
  | 'glb-cesium'        // existing GLB sample
  | 'glb-custom'        // user-uploaded GLB
  | 'glb-realistic';    // NEW: the realistic anatomical figure
```

The new path mounts a new component, e.g. `src/components/RealisticFigure.tsx`,
in place of `PatientFigure.tsx` when `figureSource === 'glb-realistic'`.
The component must:

1. Accept the same `PatientFigureProps` interface (or a strict superset
   of it) so the existing call site in `Scene.tsx` doesn't change.
2. Read the same six `AdultSurfaceParams` and apply them via:
   - Skeletal bone transforms (for the major pose params:
     `pelvicTilt`, `hipAbduction`, `hipFlexion`)
   - Morph target weights (for the soft-tissue params:
     `innerThighCompression`, `monsFullness`, `outerFoldVolume`, and
     future ones)
3. Honor the `intimateAnatomyEnabled` gate at the component level:
   the realistic figure must NOT mount when `intimateAnatomyEnabled`
   is false AND the case is pediatric/general. The current primitive
   figure keeps that gate; the realistic one inherits the same rule.
4. Honor the `headShaved` prop the same way.
5. Honor the `idleRotate` prop the same way.

The new `glb-realistic` source must be selected through the existing
`FigureSourceSelector` UI — add a new option there, do not create a
parallel selector. The default source for new cases stays `'procedural'`
so the slice work continues to have a fallback.

The mount point for any future realistic-renderer improvements is:

```text
src/components/Scene.tsx
  └─ <PatientFigure ... /> or <RealisticFigure ... /> (NEW)
       └─ reads from useAdultSurfaceParams() (existing) or props
            (existing threading through App.tsx)
```

The threading stays exactly the same. The only change in `Scene.tsx`
is one new branch in the figure-source switch.

---

## Source options for the anatomical mesh

Pick one. Don't combine sources. Each has concrete tradeoffs.

| Source | License | Quality | Customization | Cost | Time | Risk |
|---|---|---|---|---|---|---|
| **Z-Anatomy** | CC-BY-SA | High (anatomical accuracy) | Limited (static mesh, no morphs) | Free | Days (import + R3F mount) | Low — open source, well-known |
| **MakeHuman (MakeHuman-X)** | AGPL/CC0 | High (parametric, full body) | High (parametric, custom morphs) | Free | 1–2 weeks (Python toolchain + export + R3F mount + skin shader) | Low — open source |
| **Primal Pictures / Anatomy 3D** | Commercial | Highest (clinical-grade) | Low (fixed content) | $$$ (license) | 1 week (license + import + mount) | Low — license-clear |
| **MetaHuman (Unreal headless)** | Epic EULA | Very high (real-time, animated) | High (DNA-based morphs) | Free (Unreal ecosystem) | 3–4 weeks (Unreal pipeline + DNA export + GLB conversion + R3F mount) | Medium — Epic ecosystem, headless pipeline complexity |
| **3D Gaussian Splatting (gsplat.js / @mkkellogg/gaussian-splats-3d)** | Varies by source video | Highest (photoreal) | Limited (motion retargeting needed) | Free (if you have consented source video) | 2–4 weeks (capture → train → integrate) | High — needs consented video, animation is open research |

**Default recommendation for this workstream:** **Z-Anatomy** for the
first mount. It's free, CC-BY-SA, well-documented, and has a clean GLB
export. The mount is straightforward: load the GLB, hook the bones
to `AdultSurfaceParams`, swap the skin material. From there, swap to
MakeHuman for parametric morphs in a follow-up, then to MetaHuman or
3DGS if the fidelity target demands it.

**Don't pick a source because of a single image.** Pick a source
because the source has a license, a community, and a documented
import path. If the doctor reviewers want a specific look, give them
the source options and let them pick the look within a defensible
license boundary.

---

## Phased implementation plan

The handoff is structured so the agent can ship each phase
independently, with the existing slice work continuing in parallel.

### Phase 1: Source decision + asset import (1–2 days)

1. Pick a source from the table above. Document the choice in a
   `docs/realistic-renderer-source.md` file with the license, the
   import path, and the file size on disk.
2. Import the mesh into `apps/medstage/public/models/` (gitignored
   patterns to be respected — the realistic figure is a build asset
   and may be large; treat it the way you'd treat a GLB model).
3. Verify the import renders correctly in a standalone R3F scene
   (test it outside the MedStage mount point first).

### Phase 2: R3F mount + skin shader (3–5 days)

1. Add `'glb-realistic'` to the `FigureSource` union in
   `src/types/index.ts`.
2. Create `src/components/RealisticFigure.tsx`. It accepts the same
   props as `PatientFigure` and renders the loaded GLB with the
   upgraded skin material.
3. Use `MeshPhysicalMaterial` with at least:
   - `color`: from `figure.skinTone`
   - `roughness`: 0.55 (matching current)
   - `metalness`: 0.0
   - `sheen`: 0.3, `sheenColor`: lightened skin tone
   - `clearcoat`: 0.05, `clearcoatRoughness`: 0.6
   - `transmission`: 0.0 (skin is opaque; transmission is for the
     endoscope canal materials, not the figure skin)
   - `thickness`: 0.5
   - `iridescence`: 0.0 (off; can be tuned for subsurface feel)
   - Plus a normal map from the source mesh's textures.
4. Wire `RealisticFigure` into the `Scene.tsx` figure-source switch.
5. Add the new source option to `FigureSourceSelector`.
6. Browser-verify: load the default with `glb-realistic` selected,
   confirm 0 page errors, 0 console errors, 1 visible WebGL canvas,
   figure visible.

### Phase 3: AdultSurfaceParams wiring (1 week)

This phase is the contract. The realistic renderer must consume the
typed model the same way the primitive renderer does.

1. Map `pelvicTilt`, `hipAbduction`, `hipFlexion` to skeletal bone
   transforms. The mesh's pelvis, femur-L, femur-R bones get the
   existing transform formulas. If the source mesh uses a different
   bone naming convention, write a small `src/data/boneMap.ts`
   adapter.
2. Map `innerThighCompression`, `monsFullness`, `outerFoldVolume`
   to morph target weights. If the source mesh has compatible
   morphs, use them directly. If not, the first iteration uses
   scale or shader tricks as placeholders, and a follow-up
   coordinates with the source asset to add real morphs.
3. Add a `src/components/RealisticFigure.test.js` (or similar) that
   tests the prop → bone/morph mapping in isolation, no browser.
4. Browser-verify: load `annual-gyn-exam` with `glb-realistic` selected,
   confirm the figure visibly engages the adult_exam pose.

### Phase 4: Adult-only gating + isolation guard (2–3 days)

The gating is non-negotiable and already exists in the typed model.
The realistic renderer must enforce it the same way `PatientFigure`
does.

1. `RealisticFigure` must accept an `intimateAnatomyEnabled` prop
   (or read it from context) and refuse to mount when
   `intimateAnatomyEnabled` is false AND the active case is
   pediatric/general. The fallback is to mount the primitive
   `PatientFigure` so the UI doesn't break — degraded experience
   for the wrong case, not a crash.
2. Add a test in `test/realistic-figure-gating.test.js` (or extend
   the existing source-policy test) that verifies the realistic
   figure does not mount when the content profile is `general`.
3. The pediatric case `pediatric-fall` must NEVER show the realistic
   figure. Add a test for that.

### Phase 5: Animation + breathing (1 week)

The current primitive figure has idle breathing via `breathe_deep`
head animation. The realistic figure needs:

1. Idle breathing — chest cavity scale modulation on a slow sine.
2. Eye blinks — eyelid blendshapes on a randomized interval
   (~3–6 seconds).
3. Subtle head micro-movements — small Y/Z rotations on a slow
   Perlin noise.
4. The `currentAnimation` prop already drives head motion. Hook
   the realistic head rig to it the same way the primitive head is
   hooked. Don't break the existing `nod` / `shake_head` /
   `look_around` / `wave` / `breathe_deep` triggers.

### Phase 6: Gown + props (3–5 days)

1. Adapt `HospitalGown.tsx` to the realistic figure's body
   proportions. The current gown is a single curved mesh; the
   realistic version should be a textured cloth mesh that drapes
   to the new body.
2. The other props (glasses, stethoscope, sandwich, clipboard) all
   mount in the same world frame. Their positions are currently
   hand-tuned to the primitive figure's proportions. Re-tune
   them to the realistic figure's proportions.

### Phase 7: Polish + face (optional, 2–3 weeks)

This is where the workstream can grow if the time budget allows:

1. Facial expression rig with blendshapes.
2. Audio-driven lip sync (wav2vec + viseme mapping, or a simpler
   text-driven approach using the existing LLM transcript).
3. Subtle skin pore/normal map for close-up realism.
4. Cloth simulation for the gown (or a high-quality static drape
   that doesn't need simulation).

Each of these is its own sub-workstream. Don't attempt all of them
in this handoff; the parameter model is the contract, the renderer
is replaceable, and the face is a separate problem.

---

## Skin shader specification

The skin material is the most important visual decision. Here's a
starting point; tune in the browser.

```ts
// src/components/RealisticFigure.tsx (or a shared material module)
import { MeshPhysicalMaterial, Color, TextureLoader } from 'three';

const skinMaterial = new MeshPhysicalMaterial({
  color: new Color(figure.skinTone),
  roughness: 0.55,        // current value; tune
  metalness: 0.0,
  sheen: 0.3,             // current value
  sheenColor: new Color(lighten(figure.skinTone, 0.15)),
  sheenRoughness: 0.6,
  clearcoat: 0.05,
  clearcoatRoughness: 0.6,
  thickness: 0.5,         // SSS approximation
  ior: 1.4,               // skin IOR
  attenuationColor: new Color('#ff8866'),  // warm subsurface
  attenuationDistance: 0.3,
  // transmission: 0.0,  // skin is opaque
  normalMap: loadNormalMap(figure.skinTone),  // from source mesh
  normalScale: new Vector2(0.5, 0.5),
});
```

Tune `roughness`, `sheen`, and `thickness` against a real reference
screenshot. Don't trust numbers from documentation; the human eye
spots bad skin instantly.

---

## Animation system

The current `PatientFigure` has no skeletal animation system — it
uses `useFrame` to update `headGroupRef.current.rotation` for
`currentAnimation` and `idleRotate`. The realistic figure needs a
real rig.

**Recommended approach: Three.js AnimationMixer with the source
mesh's embedded animations.**

1. Load the source mesh's animations via the GLTFLoader.
2. Create an `AnimationMixer` per figure.
3. Wire the `currentAnimation` prop to the appropriate action:
   - `nod` → head-bone X rotation
   - `shake_head` → head-bone Y rotation
   - `look_around` → head-bone Y rotation, slow
   - `wave` → hand-bone Z rotation
   - `breathe_deep` → chest-bone scale modulation
4. `idleRotate` rotates the root bone on Y, same as the current
   `groupRef` rotation.
5. Per-frame update: `mixer.update(delta)` in `useFrame`.

**Alternative: react-spring for procedural animation.** Use this if
the source mesh doesn't have a full animation rig. react-spring
gives you physics-based interpolation that's good for idle
breathing and micro-movements, but doesn't replace a real skeleton
for body-pose changes.

---

## Adult-only gating — carry-over from the existing build

The `intimateAnatomyEnabled` gate and the `contentProfile: 'general' |
'adult-clinical'` opt-in are the hard rules. They live in:

- `src/data/patientCases.ts` — the case definitions
- `src/App.tsx` — `intimateAnatomyEnabled = currentCase?.contentProfile === 'adult-clinical'`
- `src/data/adultSurfaceParams.ts` — `isAdultClinicalCase` and the
  isolation guard in `resolveAdultSurfaceParams`
- `src/components/Scene.tsx` — `<PelvicAnatomy visible={intimateAnatomyEnabled} ... />`
- `src/components/PelvicCavities.tsx` — gated on `intimateAnatomyEnabled`
- `src/data/voiceCommands.ts` — endoscope and forceps commands
  return `unknown` if the keywords don't include the view/object
  identifier

The realistic renderer must:

1. Accept `intimateAnatomyEnabled` and refuse to render the adult
   anatomy when false. Fall back to a non-anatomical stand-in (the
   primitive figure) so the UI doesn't crash.
2. Use the same `resolveAdultSurfaceParams` from the typed model —
   do not duplicate the gate. The realistic renderer consumes the
   resolved params; it does not decide whether the params are
   active.
3. The endoscope mode (when active) is also gated by
   `intimateAnatomyEnabled`. The endoscope view must not engage in
   a pediatric case even if the realistic figure is mounted.

---

## Reference vault compliance

The `reference-vault/private/` directory is gitignored. Do not commit
it, copy it into `public/`, expose it through Vite, include it in
`dist/`, upload it, or reproduce a subject's face, tattoos, jewelry,
scars, exact body, or likeness.

Specifically for the realistic renderer:

- **Do not use the reference-vault media as a mesh source.** It is
  not licensed for redistribution, the consent status is
  unverified, and the dimensions are not validated.
- **Do not derive proportions from the reference-vault video.**
  Use the licensed mesh source's own proportions, or use the
  established clinical-anatomy references (Drake's, Gray's,
  Z-Anatomy's documented measurements).
- **Do not include a "make the figure look like subject X"
  parameter.** The realistic figure is a clinical stand-in, not a
  likeness reproduction.
- **Do not add a face capture pipeline.** Faces are a separate,
  harder, and more legally-exposed problem.

If the doctors want a specific look that the licensed sources don't
provide, the answer is "find a closer licensed source" — not "use
the reference vault."

---

## Required working method

Same as the existing handoff. The agent must:

1. Read the relevant source and all call sites before changing
   anything.
2. Run `npm test` and reproduce the current browser state
   (`npm run dev -- --host 127.0.0.1` and Playwright mount).
3. Write a failing test for the next behavior.
4. Make the smallest implementation that passes.
5. Run `npm test` and `npm run build`.
6. Start Vite and load the real app in Playwright.
7. Capture page errors, console errors, visible canvas count, and
   a screenshot.
8. Stop the server when verification is complete.

Never call work complete from a green build alone. The browser
mount + 0 errors is the bar.

---

## Things not to do

- **Do not restart from the archived ZIP.** Continue from the
  current source.
- **Do not overwrite the current app with old deployed source.**
- **Do not restore unsupported institutional claims.** The
  product identity stays "Doctrine Labs · Independent Prototype"
  per the source-policy test.
- **Do not expose or commit `reference-vault/private/`.**
- **Do not use adult references in pediatric generation or
  rendering.** The realistic figure must never mount in a
  pediatric case.
- **Do not reproduce a source subject's likeness.** Use licensed
  or parametric sources only.
- **Do not derive dimensions from close wide-angle videos.** Use
  the source mesh's own proportions.
- **Do not edit `HERMES_SYSTEM_PROMPT.md` as an independent prompt
  copy.** It's generated from `MEDSTAGE_PATIENT_PROMPT` in
  `src/data/patientPersona.ts`. Change the source, run
  `npm run prompt:sync`, regenerate.
- **Do not break the `AdultSurfaceParams` contract.** The slice
  work's typed model is the API the realistic renderer must
  consume.
- **Do not skip the isolation guard.** The realistic figure must
  respect the same adult-clinical opt-in as the primitive figure.
- **Do not use paid provider API keys in browser localStorage for
  a distributed build.** The LLM config in `localStorage` is for
  local development; production should use a server-side proxy.
- **Do not advance the realistic renderer beyond the typed model.**
  If a behavior the doctors want isn't expressible in
  `AdultSurfaceParams`, extend the typed model first (with tests,
  with the isolation guard), then build the renderer against the
  new parameter. Don't add renderer-only parameters that bypass
  the contract.
- **Neglect or negate Hermes-built project material.** Use only
  Brandon-authored or Hermes-built project material.

---

## Verification

For each phase:

1. `npm test` — 16/16+ tests pass. New tests for the new behavior
   land first (TDD).
2. `npm run build` — green. Bundle size doesn't grow by more than
   ~5 kB gzip per phase (the GLB is a build asset, not in the
   bundle, but the mount code and the skin shader are).
3. Browser mount (Playwright) — 0 page errors, 0 console errors,
   1 visible WebGL canvas, figure visible.
4. Visual check — load `annual-gyn-exam` with `glb-realistic`
   selected, confirm the adult_exam pose visibly engages. Load
   `pediatric-fall`, confirm the realistic figure does NOT mount
   (the primitive figure renders instead).
5. Stop the dev server when verification is complete.

---

## Success criteria — what "done" looks like

The workstream is complete when:

1. A new figure source option `'glb-realistic'` is selectable in
   the existing `FigureSourceSelector`.
2. When selected, the figure is visibly more realistic than the
   primitive figure (texture, normal map, proportions, surface
   quality) at conversational distance.
3. The figure consumes the existing six `AdultSurfaceParams` and
   any future parameters added by the slice work, via skeletal
   bones and/or morph targets.
4. The figure respects the `intimateAnatomyEnabled` gate and
   refuses to mount the adult anatomy in pediatric/general cases.
5. `npm test` is green. `npm run build` is green. Browser mount
   has 0 errors.
6. The product identity stays "Doctrine Labs · Independent
   Prototype" — no university claims, no stakeholder sign-off
   language in the public-facing copy.

If you achieve these and a future agent (or the slice agent) adds
a new `AdultSurfaceParam`, the realistic figure just needs to add
a new bone or morph to the source mesh and a new mapping in
`RealisticFigure.tsx`. The contract is the typed model.

---

## Tooling list

What the agent will need to install or have available:

- **Three.js skin shader:** built into `three@^0.165.0` (already
  in dependencies). No new packages for the material itself.
- **R3F mount:** `@react-three/fiber@^8.16.8`,
  `@react-three/drei@^9.108.4` (already in dependencies).
- **GLTFLoader:** comes with `three/examples/jsm/loaders/GLTFLoader`.
  Drei has `useGLTF` as a hook wrapper.
- **Animation mixer:** built into `three` (AnimationMixer,
  AnimationAction, AnimationClip).
- **Procedural animation:** `react-spring` (optional, for
  physics-based interpolation).
- **Z-Anatomy:** download from z-anatomy.com or the official
  Sketchfab, export to GLB via Blender.
- **MakeHuman:** download MakeHuman + the MakeHuman-X Blender
  add-on, generate a body, export to GLB.
- **MetaHuman:** Unreal Engine 5 + MetaHuman Creator +
  MetaHuman Performance + the headless DNA export pipeline
  (Unreal's official documentation).
- **3D Gaussian Splatting:** `@mkkellogg/gaussian-splats-3d`
  (Three.js integration) or `gsplat.js` (lower-level).
  Reference impl: `graphdeco-inria/gaussian-splatting` (Python).
- **Verification:** Playwright (already in devDependencies in
  the sandbox).

---

## Open questions to resolve before starting

1. **Mesh source decision.** Pick from the source-options table
   above. Get sign-off from Brandon before starting phase 1. The
   choice has long-term consequences for licensing, customization,
   and maintenance.
2. **Face scope.** Is face animation in scope? If yes, plan a
   separate face-rig workstream after phase 6. If no, the head is
   a static mesh with the existing `currentAnimation` prop driving
   head bone rotation.
3. **Gown simulation.** Static drape (cheap, ships fast) or
   cloth simulation (more realistic, more code, more risk). The
   default is static drape; ask before adding simulation.
4. **LLM-driven pose changes.** The current `PosePreset` is
   auto-engaged on case load. The next evolution is letting the
   LLM switch poses during a conversation ("stand up", "lie
   down"). This is a future workstream, not this one — but the
   contract should anticipate it.
5. **Multi-user figures.** Currently MedStage has two figures
   (James, Sarah). The realistic renderer may have a different
   set of figures (per source asset). The `PatientFigure` shape
   in `src/data/patientFigures.ts` is the source of truth — add
   realistic figure definitions there.

---

## First action in the new chat

Don't ask Brandon where to begin. Begin here:

1. Read `MINIMAX_HANDOFF.md` end to end.
2. Read `src/data/adultSurfaceParams.ts` to understand the typed
   model.
3. Read `src/components/PatientFigure.tsx` and `Scene.tsx` to
   understand the existing mount point.
4. Read this document again, specifically the source-options
   table and the phased plan.
5. Pick a mesh source (or surface the tradeoffs to Brandon for
   his decision) and document the choice.
6. Start phase 1.

If you find a rule in this handoff or in `MINIMAX_HANDOFF.md` that
isn't working, name it and propose the change with evidence. Don't
silently work around it.

The current build is a repaired, working foundation with a typed
parameter model. Your job is to make the figure visibly more
realistic without breaking the privacy boundary, the adult-only
gate, the prompt alignment, the typed-model contract, or the
browser runtime.

Good hunting.
