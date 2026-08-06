# MedStage — Voice-Driven Medical Anatomy Prototype

**Doctrine Labs independent medical-training prototype** · v0.2 · LLM-powered

A voice-controlled 3D anatomy learning environment with two modes:
- **Command mode** — discrete voice commands ("rotate left", "show muscles")
- **Conversation mode** — natural language to an LLM-powered patient character ("take off your glasses", "show me the bones")

Built for the prototype review demo, designed to extend into a full anatomy learning platform.

---

## Quick start

```bash
npm install
npm run dev   # http://localhost:5173
```

Then open **Chrome or Edge**. The welcome screen will appear, click "Start voice control" to grant mic access.

To switch between modes, use the toggle in the top-right area: **Command** / **Conversation**.

---

## Two modes

### Command mode (default)
- "rotate left" / "turn right" → rotates the model
- "zoom in" / "closer" → zooms camera
- "show muscles" / "hide skin" → toggles layers
- "isolate the heart" → highlights a part
- "show all" / "hide all" → toggles all layers
- "reset" → restore default view
- "help" → highlights the help panel

These are parsed by `parseIntent()` in `src/data/voiceCommands.ts` using keyword/pattern matching. No LLM needed.

### Conversation mode
- Speak naturally to the patient character
- The LLM (Hermes/Llama via Ollama, or any OpenAI-compatible endpoint) interprets your intent
- The patient responds in character with dialogue + actions
- TTS speaks the patient's response out loud
- All the command-mode actions are still available (the LLM can issue them)

Example: say "take off your glasses" → glasses animate off, patient says "Sure thing, doc."

---

## Running with Ollama + Hermes (recommended for the demo)

1. **Install Ollama** (https://ollama.com):
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull Hermes 3** (or your preferred model):
   ```bash
   ollama pull hermes3
   # Or alternatives:
   ollama pull llama3.1:8b
   ollama pull mistral
   ```

3. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/v1/models
   ```

4. **Open MedStage** in Chrome/Edge, click the ⚙ gear icon (top right), confirm:
   - Base URL: `http://localhost:11434/v1`
   - Model: `hermes3`
   - Click "Test connection" → should say "Connected"

5. **Switch to Conversation mode** and start talking.

### Using OpenAI / Claude / other providers
In the settings panel, set:
- **Base URL:** `https://api.openai.com/v1` (or your provider)
- **Model:** `gpt-4o-mini` / `gpt-4o` / `claude-3-5-sonnet-...`
- **API Key:** your provider's key

---

## What works in this prototype

✅ Procedural human figure with PBR skin
✅ Hospital gown overlay
✅ Procedural props with animations:
  - Glasses (default on, can be removed)
  - Stethoscope (default off, can be put on)
  - Sandwich (default off, for the joke)
  - Clipboard (default off)
✅ Simple character head animation (nod, shake, wave, breathe)
✅ Voice control (Web Speech API, Chrome/Edge)
✅ Command mode with 20+ natural language patterns
✅ Conversation mode with LLM (Ollama/Hermes/OpenAI compatible)
✅ Patient chat bubble overlay with emotion indicators
✅ TTS for patient dialogue (Web Speech API, swappable)
✅ Polished UI with welcome screen, help panel, quick commands
✅ Settings panel for LLM/TTS configuration
✅ Persistent config (localStorage)

## What's stubbed for after sign-off

- Internal anatomy meshes (Z-Anatomy GLBs)
- Realistic human figure (MakeHuman GLB)
- Cross-sectioning
- Anatomical labels
- More sophisticated character animations (full skeletal rig)
- Premium TTS (ElevenLabs / OpenAI TTS)
- Conversation history persistence
- Multi-figure support (different body types)
- Clinical scenarios (intake interview, exam, etc.)

---

## Architecture

```
medstage/
├── public/
│   └── models/              # Drop GLB files here
├── src/
│   ├── components/
│   │   ├── AnatomyModel.tsx     # Procedural human
│   │   ├── HospitalGown.tsx
│   │   ├── PatientProps.tsx     # Glasses, stethoscope, sandwich, clipboard
│   │   ├── Scene.tsx            # 3D scene, lighting, camera
│   │   ├── VoiceControl.tsx     # Mic button + waveform
│   │   ├── VoiceWaveform.tsx    # Animated audio bars
│   │   ├── LayerPanel.tsx
│   │   ├── HelpPanel.tsx
│   │   ├── ActivityFeed.tsx     # Bottom-center status bubbles
│   │   ├── PatientChat.tsx      # Conversation mode dialogue history
│   │   ├── LLMSettings.tsx      # LLM + TTS configuration
│   │   ├── WelcomeOverlay.tsx
│   │   └── QuickCommands.tsx
│   ├── hooks/
│   │   ├── useVoiceCommands.ts  # Web Speech API → VoiceIntent
│   │   └── useConversation.ts   # Voice → LLM → action → TTS
│   ├── services/
│   │   ├── llm.ts               # OpenAI-compatible LLM client
│   │   └── tts.ts               # TTS abstraction
│   ├── data/
│   │   ├── anatomyLayers.ts
│   │   ├── voiceCommands.ts     # Intent parser (command mode)
│   │   ├── patientActions.ts    # Action catalog (conversation mode)
│   │   └── patientPersona.ts    # Default system prompt
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx                  # Main app, mode toggle, state orchestration
│   └── main.tsx
├── HERMES_SYSTEM_PROMPT.md      # Onboarding prompt for the LLM
├── README.md
└── package.json
```

### Voice flow

**Command mode:**
```
You speak → Web Speech API → parseIntent() (keywords) → action
```

**Conversation mode:**
```
You speak → Web Speech API → transcript → Ollama/Hermes (LLM)
  → JSON: { type, params, dialogue, emotion }
  → applyPatientAction() executes scene change
  → PatientChat shows dialogue bubble
  → TTS speaks dialogue out loud
```

### Extending

**Add a new voice command (command mode):**
Edit `src/data/voiceCommands.ts` — add patterns to `parseIntent()`. Handle the new intent in `App.tsx::applyCommandIntent`.

**Add a new patient action (conversation mode):**
1. Add to `PatientAction` type in `src/services/llm.ts`
2. Add handler in `src/data/patientActions.ts::applyPatientAction()`
3. Add to the action table in `HERMES_SYSTEM_PROMPT.md`
4. Add an example interaction

**Swap TTS to ElevenLabs:**
Edit `src/services/tts.ts::speakWithElevenLabs()` to call the ElevenLabs API. The interface stays the same.

**Swap voice input to Vosk/Whisper:**
Edit `src/hooks/useVoiceCommands.ts` — replace the Web Speech API implementation. The interface (`VoiceIntent`) stays the same.

---

## Tech stack

- **Vite** — fast dev server, instant HMR
- **React 18** + **TypeScript** — type safety
- **Three.js** + **React Three Fiber** — 3D rendering
- **@react-three/drei** — helpers (OrbitControls, Environment, ContactShadows)
- **Web Speech API** — voice input (Chrome/Edge) + default TTS
- **OpenAI-compatible API** — LLM (works with Ollama, LM Studio, OpenAI, etc.)

---

## Browser requirements

- **Chrome or Edge** (Web Speech API)
- Microphone access
- Hardware-accelerated WebGL (any laptop from 2019+)

For Firefox/Safari support, swap `useVoiceCommands.ts` to use Vosk via WebAssembly.

---

## License & attribution

Code: MIT (or your preference — adjust for Doctrine Labs).

Default anatomical model: procedural placeholder. Replace with:
- **MakeHuman** output (CC0) for the realistic human shell
- **Z-Anatomy** (CC BY-SA 4.0) for internal anatomy layers
- **BodyParts3D** (CC BY-SA 2.1 Japan) — parent dataset

For an internal Doctrine Labs prototype, attribution is sufficient. For a distributed product, consult Doctrine Labs's tech transfer / IP office.

---

## For the Tech With Tim video 🎬

1. **Cold open:** Open MedStage, click "Start voice control", show welcome screen
2. **Command mode demo:** "rotate left" → "show muscles" → "zoom in" — show the polish
3. **The pivot:** Click "Conversation" mode
4. **The wow:** "Hey doc, can you take off your glasses?" — glasses animate off, patient responds in character
5. **Behind the scenes:** Open ⚙ settings, show the Ollama/Hermes connection
6. **Show the prompt:** Open `HERMES_SYSTEM_PROMPT.md` — show how the persona is defined
7. **Close:** Mention Doctrine Labs Medical Center, prototype review, what's next

Total runtime: ~3-5 minutes for a tight demo. The LLM response time is the only unknown — Hermes 3 on a decent laptop is ~1-2 seconds per response.

---

## Roadmap (post sign-off)

1. Realistic human figure (MakeHuman GLB)
2. Z-Anatomy internal layers (skeletal, muscular, vascular, nervous, organs)
3. Skeletal rig for full character animation
4. ElevenLabs / OpenAI TTS integration for natural voice
5. Conversation memory across sessions
6. Multiple patient personas (different ages, conditions)
7. Clinical scenario scripts (intake, exam, history-taking)
8. Cross-sectioning tool
9. Anatomical labels (Terminologia Anatomica)
10. Measurement tool (distance between landmarks)
11. Multi-user / classroom mode
12. Mobile (iOS/Android) — likely with Capacitor wrapper

---

## Build status

🟢 **Runnable.** TypeScript clean, production build succeeds (304KB gzipped), dev server starts.

The prototype is intentionally lean. Every piece is here to be replaced/upgraded — not to be the final product.
