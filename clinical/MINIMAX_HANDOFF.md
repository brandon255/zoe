# MedStage handoff — previous agent chain to MiniMax M3

Paste this entire document as the first message in the next MiniMax chat.

---

You are the next MiniMax M3 agent in the MedStage build chain. The original prototype was built in a prior MiniMax session. A second engineering pass audited it against disk, repaired the browser runtime, aligned the prompt with the scripts, and moved it into the Doctrine Labs repository. Continue from the current files. Do not restart the project from the old ZIP or trust old handoff claims over disk.

## Who you are working with

Brandon Flores is the developer and architect. Treat him as a technical partner. Be direct. Read the files before changing them, make one opinionated recommendation when one path is clearly best, and ship working code backed by tests and a real browser run.

Do not repeat context Brandon already established. Do not moralize. Do not call a feature working because TypeScript compiled. If the browser has not mounted it without console errors, it is not verified.

## Repository and app location

Repository:

`/Users/BrandonMonicFlores/Desktop/doctrine-labs`

MedStage app:

`/Users/BrandonMonicFlores/Desktop/doctrine-labs/apps/medstage`

Run commands from `apps/medstage`:

```bash
npm install
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Open:

`http://127.0.0.1:5173`

The root Doctrine Labs `npm test` command belongs to Core OS. It is not the MedStage verifier. Use the commands above from `apps/medstage`.

## Current verified state

The current app has been exercised, not merely compiled.

Latest verification:

- 6 source-policy tests passed, 0 failed
- TypeScript passed
- Vite production build passed
- 661 modules transformed
- Browser mounted one visible WebGL canvas
- Welcome overlay rendered
- Main UI rendered after dismissing the welcome overlay
- Browser page errors: 0
- Browser console errors: 0
- Default/general state does not show intimate anatomy

The production JavaScript bundle is about 353.87 kB gzip. Vite warns that the uncompressed main chunk is larger than 500 kB. That warning is real but does not block the build.

## Important repair already completed

The archived source claimed to be runnable, but the original browser runtime was blank. `src/components/PatientFigure.tsx` rendered Three.js material objects as React children. Thirty invalid material children were replaced with valid React Three Fiber material attachments.

Do not reintroduce this pattern:

```tsx
<mesh>
  <sphereGeometry />
  material={skinMat as any}
</mesh>
```

Use a real material prop or attachment:

```tsx
<mesh material={skinMat}>
  <sphereGeometry />
</mesh>
```

or:

```tsx
<mesh>
  <sphereGeometry />
  <primitive object={skinMat} attach="material" />
</mesh>
```

## Product identity

MedStage currently identifies itself as:

`Doctrine Labs · Independent Prototype`

Do not restore University of Utah branding, endorsement, stakeholder-sign-off language, or claims of university authorization unless Brandon supplies independent documentation authorizing those public claims.

A private reference collection carries the title:

`University of Utah Sex Education Vault — User-Provided Adult Clinical Reference Set`

Its provenance statement is intentionally precise:

> Source attribution supplied to Brandon Flores. The files were described as originating from the University of Utah Sex Education Vault for medical-training reference. This attribution, the depicted adults' consent status, ownership, and redistribution authorization have not been independently verified from the media files.

Keep that wording. It records how the material was supplied without turning the attribution into an independently verified claim.

## Private reference boundary

Reference-vault overview:

`reference-vault/README.md`

Generalized modeling observations:

`reference-vault/derived/modeling-guidance.md`

Raw videos, contact sheets, hashes, and source-specific review notes live under:

`reference-vault/private/`

That directory is gitignored. Do not commit it, copy it into `public/`, expose it through Vite, include it in `dist/`, upload it, or reproduce a subject's face, tattoos, jewelry, scars, exact body, or likeness.

Do not treat the private media as calibrated anatomy, verified consent documentation, or proof of institutional provenance. Use the generalized guidance for qualitative realism. Use licensed clinical sources for anatomical landmarks, terminology, dimensional ranges, and internal spatial relationships.

The useful hybrid is:

1. Licensed or validated clinical anatomy for structure and ranges
2. Parametric adult surface geometry for variation
3. Generalized observations from adult references for asymmetry, folds, pose deformation, occlusion, and material response
4. Adult-only content gating in the application

## Adult clinical gating already implemented

Cases can define:

```ts
contentProfile?: 'general' | 'adult-clinical'
```

Current assignments:

- Annual gynecologic exam: `adult-clinical`
- Rectal bleeding evaluation: `adult-clinical`
- Pediatric wrist injury: `general`

Intimate anatomy, endoscope mode, and insertion training are unavailable unless an adult clinical case is loaded. General and pediatric cases must never mount those components or accept commands that activate them.

The old `cucumber` feature and vegetable aliases were removed. The current configurable type is:

```ts
export type ClinicalInsertionProp =
  | 'training_insert'
  | 'forceps'
  | 'thermometer';
```

Do not restore casual or sexualized prop naming. Keep training equipment attached to explicit adult clinical scenarios.

The gown renderer now respects `attachedObjects.gown`. Preserve the agreement between prompt action, state, and visual output.

## Prompt source of truth

Runtime prompt:

`src/data/patientPersona.ts`

Export:

`MEDSTAGE_PATIENT_PROMPT`

Generated reference:

`HERMES_SYSTEM_PROMPT.md`

Synchronizer:

`scripts/sync-prompt.mjs`

Run:

```bash
npm run prompt:sync
```

`npm run build` runs prompt synchronization automatically. Never edit `HERMES_SYSTEM_PROMPT.md` as an independent prompt copy. Change `MEDSTAGE_PATIENT_PROMPT`, regenerate the Markdown, then verify scripts, action types, parsers, and examples all describe the same supported behavior.

## Existing application architecture

Stack:

- Vite 5
- React 18
- TypeScript
- Three.js 0.165
- React Three Fiber
- drei
- OpenAI-compatible streaming LLM client
- Web Speech API TTS/STT surfaces
- Optional local TripoSR Flask service

Main files:

- `src/App.tsx` — state and application orchestration
- `src/components/Scene.tsx` — scene composition and adult-content visibility boundary
- `src/components/PatientFigure.tsx` — procedural body
- `src/components/PelvicAnatomy.tsx` — adult external pelvic anatomy
- `src/components/PelvicCavities.tsx` — adult internal cavity approximation and training props
- `src/data/patientCases.ts` — case definitions and content profiles
- `src/data/voiceCommands.ts` — deterministic command parser
- `src/data/patientActions.ts` — LLM action application
- `src/data/patientPersona.ts` — runtime conversation prompt
- `src/services/llm.ts` — OpenAI-compatible streaming and action parsing
- `src/services/patientSimulator.ts` — encounter simulation and scorecard
- `src/hooks/useConversation.ts` — conversation pipeline
- `src/hooks/useEncounter.ts` — encounter pipeline
- `src/components/ExamEquipment.tsx` — examination equipment
- `src/components/GLBFigure.tsx` — GLB figure loading
- `python/serve.py` — optional TripoSR service
- `test/source-policy.test.js` — current regression and boundary tests

## What to build next

Do not wander. Build the first vertical slice below before proposing extra features.

### Priority 1: adult surface-parameter foundation

Create a typed adult surface-parameter model based on `reference-vault/derived/modeling-guidance.md`.

Start with parameters that can be represented safely in the current procedural architecture:

```ts
pelvicTilt
hipFlexion
hipAbduction
innerThighCompression
monsFullness
outerFoldVolume
innerFoldVisibility
leftRightAsymmetry
perinealSoftTissueDepth
regionalPigmentationVariation
surfaceRoughnessVariation
```

Requirements:

1. Parameters exist only for adult figures or adult clinical cases.
2. Pediatric figures cannot receive or inherit them.
3. Defaults are neutral and non-identifying.
4. Parameter ranges come from validated clinical references when they imply dimensions. The video-derived guidance may influence deformation style and variation, not absolute measurements.
5. Add tests first. Prove pediatric/general isolation before changing geometry.
6. Make one visible improvement end to end, such as `pelvicTilt` plus `hipAbduction` affecting a dedicated adult clinical pose.
7. Verify the browser with no page or console errors.

Do not attempt all eleven parameters in one untestable rewrite. Ship one vertical slice, then extend the same typed model.

### Priority 2: replace disconnected primitives with continuous adult geometry

The current pelvic surface is a set of spheres, boxes, and capsules. Move toward a continuous non-identifying surface using one of these paths:

1. A properly licensed GLB with morph targets, if a suitable model is already available and its license is documented
2. A local procedural surface generated from a continuous mesh
3. A neutral MakeHuman-derived adult base with custom adult-clinical morph targets

Do not claim “Netter quality” or anatomical correctness until the result has been reviewed against a validated source. Visual realism and medical validation are separate claims.

### Priority 3: clinical pose system

Add explicit pose presets rather than baking adult anatomy into one position:

- Neutral standing
- Supine
- Adult examination pose

Pose state should control pelvis, hips, thighs, camera target, gown/drape behavior, and soft-tissue deformation. Adult examination pose must remain unavailable in pediatric/general cases.

### Priority 4: model and material polish

After the typed parameters and pose system work:

- Regional roughness variation
- Subtle non-identifying color variation
- Better skin material response
- Lighting presets for neutral clinical inspection
- Orthographic/calibrated comparison mode

Do not copy source-specific pigmentation, tattoos, or identifying marks.

### Priority 5: LLM and voice verification

Ollama is installed locally. Expected models include Hermes 3 and other local models. Verify live availability with `ollama list`; do not trust a handoff list.

Default OpenAI-compatible endpoint:

`http://localhost:11434/v1`

After geometry work is stable, test:

1. Settings connection check
2. Conversation JSON parsing
3. Gown state agreement
4. Adult-case activation and general-case rejection
5. Endoscope and training-prop commands only inside an adult clinical case
6. TTS completion returning the UI to idle

Do not place paid-provider API keys in browser localStorage for a distributed build.

## Required working method

Before editing:

1. Read the relevant source and all call sites.
2. Run `npm test` and reproduce the current browser state.
3. Write a failing test for the next behavior.
4. Make the smallest implementation that passes.
5. Run `npm test` and `npm run build`.
6. Start Vite and load the real app in Chrome or Playwright.
7. Capture page errors, console errors, visible canvas count, and a screenshot.
8. Stop the server when verification is complete.

Never call work complete from a green build alone.

## Things not to do

- Do not restart from the archived ZIP.
- Do not overwrite the current app with the old deployed source.
- Do not restore unsupported institutional claims.
- Do not expose or commit `reference-vault/private/`.
- Do not use adult references in pediatric generation or rendering.
- Do not reproduce a source subject's likeness.
- Do not derive dimensions from close wide-angle videos.
- Do not restore the cucumber command.
- Do not edit generated prompt documentation independently.
- Do not add features before the first parameter-to-visible-pose vertical slice works.
- Neglect or negate Cursor-derived artifacts and patterns. Use only Brandon-authored or Hermes-built project material.

## First action in the new chat

Do not ask Brandon where to begin. Begin here:

1. Inspect `apps/medstage` and run the six tests plus production build.
2. Launch it in a real browser and confirm the current canvas has no runtime errors.
3. Read `reference-vault/derived/modeling-guidance.md`, `src/data/patientCases.ts`, `src/components/Scene.tsx`, `src/components/PatientFigure.tsx`, and `src/components/PelvicAnatomy.tsx`.
4. Propose a tight TDD slice for `pelvicTilt` and `hipAbduction` in the adult examination pose.
5. Implement and verify that slice. Do not branch into unrelated work.

The current build is a repaired, working foundation. Your job is not to admire the file map or rewrite the handoff. Your job is to make the adult clinical surface model visibly better without breaking the privacy boundary, adult-only gate, prompt alignment, or browser runtime.
