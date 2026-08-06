# Zoe Builder — clinical slice accelerator

Use this skill when Brandon asks to extend the **Friday clinical demo** under `zoe/clinical/`.

## Scope

- **In:** `zoe/clinical/src/**`, `zoe/clinical/public/zoe-atlas/**`, `zoe/clinical/test/**`, `zoe/CLINICAL_LAYOUT.md`
- **Out:** Core OS vault/`USER/`/keys, intimate companion `zoe/persona/zoe.md`, Utah branding without authorization

## Hard product locks

1. Patient first name **Zoe** only in UI — no memorial surnames.
2. Clinical / scientific tone only.
3. Atlas = **prebaked** stills, not live SDXL/video per utterance.
4. Speculum opens the canal; forceps grasp — keep tray semantics honest.
5. Hosted GLM/MiniMax OK for Friday; local LLM is product-later.

## Build loop

1. Read `zoe/CLINICAL_LAYOUT.md` + `zoe/clinical/FRIDAY_DEMO.md`
2. Implement the named slice (case / tray / atlas / command / LLM preset)
3. `cd zoe/clinical && npm test`
4. Smoke `npm run dev` — Command mode: "lithotomy", "insert speculum", "open the speculum"
5. Report BUILT vs still-missing atlas stills

## Command grammar anchors

- Atlas: `src/data/zoeAtlas.ts`, `src/components/ZoeAtlasOverlay.tsx`
- Intents: `src/types/index.ts`, `src/data/voiceCommands.ts`
- Tray: `src/components/ExamEquipment.tsx`, `EncounterMode` tool grid
- Persona/case: `zoe-annual-gyn`, `ZOE_PATIENT`
