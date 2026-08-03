// MedStage — Main App
// Composes the 3D scene, voice control, panels, overlays, and conversation mode.

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene } from './components/Scene';
import { BrandHeader } from './components/BrandHeader';
import { VoiceControl } from './components/VoiceControl';
import { LayerPanel } from './components/LayerPanel';
import { HelpPanel } from './components/HelpPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { ChatInterface, type ChatMessage } from './components/ChatInterface';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { QuickCommands } from './components/QuickCommands';
import { PatientChat } from './components/PatientChat';
import { LLMSettings } from './components/LLMSettings';
import { PatientSelector } from './components/PatientSelector';
import { CaseLibrary } from './components/CaseLibrary';
import { MeshGenPanel } from './components/MeshGenPanel';
import { useVoiceCommands } from './hooks/useVoiceCommands';
import { useConversation } from './hooks/useConversation';
import { ANATOMY_LAYERS, getDefaultLayerState } from './data/anatomyLayers';
import { parseIntent, VOICE_HELP_LINES } from './data/voiceCommands';
import { DEFAULT_PATIENT_PROMPT } from './data/patientPersona';
import { DEFAULT_LLM_CONFIG, type LLMConfig } from './services/llm';
import { DEFAULT_TTS_CONFIG, type TTSConfig } from './services/tts';
import {
  loadLLMConfig,
  saveLLMConfig,
  loadTTSConfig,
  saveTTSConfig,
} from './components/LLMSettings';
import type { VoiceIntent, LayerId } from './types';
import type { ActionContext, PatientAnimation } from './data/patientActions';
import { PATIENT_FIGURES, getFigureById, type PatientFigure } from './data/patientFigures';
import { BUILTIN_CASES, getCaseById, getAllCases, type PatientCase } from './data/patientCases';

type Mode = 'command' | 'conversation';

const FIGURE_STORAGE_KEY = 'medstage:active-figure';

const loadActiveFigure = (): PatientFigure => {
  try {
    const id = localStorage.getItem(FIGURE_STORAGE_KEY);
    if (id) return getFigureById(id);
  } catch {
    /* noop */
  }
  return PATIENT_FIGURES[0];
};

export default function App() {
  // Patient figure
  const [activeFigure, setActiveFigure] = useState<PatientFigure>(loadActiveFigure);

  // Layer state
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(() => {
    const def = getDefaultLayerState() as Record<LayerId, boolean>;
    return def;
  });

  // Camera state — target follows the figure
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([0, 0.5, 0]);
  const [cameraDistance, setCameraDistance] = useState(3.5);

  // Model rotation
  const [modelRotationY, setModelRotationY] = useState(0);
  const [modelRotationX, setModelRotationX] = useState(0);
  const [idleRotate, setIdleRotate] = useState(true);

  // Patient props
  const [attachedObjects, setAttachedObjects] = useState<Record<string, boolean>>({
    glasses: true,
    stethoscope: false,
    gown: true,
    sandwich: false,
    clipboard: false,
  });

  // Head shave
  const [headShaved, setHeadShaved] = useState(false);

  // Endoscope / camera views
  const [endoscopeView, setEndoscopeView] = useState<'vaginal' | 'rectal' | null>(null);

  // Foreign body (cucumber, forceps, thermometer)
  const [foreignBody, setForeignBody] = useState<'cucumber' | 'forceps' | 'thermometer' | null>(null);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Uploaded images (shared between chat and MeshGen panel)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [meshGenOpen, setMeshGenOpen] = useState(false);

  // Character animation
  const [currentAnimation, setCurrentAnimation] = useState<PatientAnimation>('idle');
  const animationTriggerRef = useRef<{ name: PatientAnimation; until: number }>({ name: 'idle', until: 0 });

  const triggerAnimation = useCallback((name: PatientAnimation, durationMs = 2000) => {
    setCurrentAnimation(name);
    animationTriggerRef.current = { name, until: Date.now() + durationMs };
    setTimeout(() => {
      if (Date.now() >= animationTriggerRef.current.until) {
        setCurrentAnimation('idle');
      }
    }, durationMs + 50);
  }, []);

  // UI state
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastAction, setLastAction] = useState<string>('');
  const [lastIntentKind, setLastIntentKind] = useState<string>('idle');
  const [helpHighlight, setHelpHighlight] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Mode
  const [mode, setMode] = useState<Mode>('command');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [caseLibraryOpen, setCaseLibraryOpen] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // LLM + TTS configs
  const [llmConfig, setLLMConfigState] = useState<LLMConfig>(() => ({
    ...loadLLMConfig(),
    systemPrompt: DEFAULT_PATIENT_PROMPT,
  }));
  const [ttsConfig, setTTSConfigState] = useState<TTSConfig>(loadTTSConfig);

  const setLLMConfig = useCallback((c: LLMConfig) => {
    setLLMConfigState(c);
    saveLLMConfig(c);
  }, []);
  const setTTSConfig = useCallback((c: TTSConfig) => {
    setTTSConfigState(c);
    saveTTSConfig(c);
  }, []);

  // Build the action context for the conversation hook
  const actionContextRef = useRef<ActionContext | null>(null);
  // We update the action context after handleLoadCase/handleNextCase are defined below
  // (will be set in a useEffect at the bottom of the component)

  // Update camera target when figure changes
  useEffect(() => {
    setCameraTarget([0, activeFigure.proportions.waistY - activeFigure.proportions.footHeight, 0]);
  }, [activeFigure]);

  // Voice command hook
  const voice = useVoiceCommands({
    onIntent: (intent) => {
      if (mode === 'command') {
        applyCommandIntent(intent);
      }
    },
  });

  // Command-mode intent application
  const applyCommandIntent = useCallback((intent: VoiceIntent) => {
    setLastIntentKind(intent.kind);
    setHasInteracted(true);
    setRecentCommands((c) => [intentLabel(intent), ...c].slice(0, 5));

    switch (intent.kind) {
      case 'rotate': {
        setIdleRotate(false);
        const amount = (intent.amount ?? 0.6) * (Math.PI / 6);
        if (intent.direction === 'left') setModelRotationY((r) => r - amount);
        else if (intent.direction === 'right') setModelRotationY((r) => r + amount);
        else if (intent.direction === 'up') setModelRotationX((r) => Math.max(-0.5, r - amount * 0.5));
        else if (intent.direction === 'down') setModelRotationX((r) => Math.min(0.5, r + amount * 0.5));
        setLastAction(`Rotated ${intent.direction}`);
        break;
      }
      case 'zoom': {
        const amount = intent.amount ?? 0.5;
        if (intent.direction === 'in') setCameraDistance((d) => Math.max(1.5, d - amount));
        else setCameraDistance((d) => Math.min(8, d + amount));
        setLastAction(`Zoomed ${intent.direction}`);
        break;
      }
      case 'reset': {
        setIdleRotate(true);
        setModelRotationY(0);
        setModelRotationX(0);
        setCameraDistance(3.5);
        setLastAction('View reset');
        break;
      }
      case 'showLayer': {
        setLayers((prev) => ({ ...prev, [intent.layer]: true }));
        setLastAction(`Showing ${intent.layer}`);
        break;
      }
      case 'hideLayer': {
        setLayers((prev) => ({ ...prev, [intent.layer]: false }));
        setLastAction(`Hid ${intent.layer}`);
        break;
      }
      case 'toggleLayer': {
        setLayers((prev) => ({ ...prev, [intent.layer]: !prev[intent.layer] }));
        setLastAction(`Toggled ${intent.layer}`);
        break;
      }
      case 'isolateLayer': {
        setLayers(
          ANATOMY_LAYERS.reduce(
            (acc, l) => ({ ...acc, [l.id]: l.id === intent.layer }),
            {} as Record<LayerId, boolean>
          )
        );
        setLastAction(`Isolated ${intent.layer}`);
        break;
      }
      case 'isolatePart': {
        setLastAction(`Selected ${intent.part} — post-sign-off`);
        break;
      }
      case 'showAll': {
        setLayers(ANATOMY_LAYERS.reduce((acc, l) => ({ ...acc, [l.id]: true }), {} as Record<LayerId, boolean>));
        setLastAction('All layers shown');
        break;
      }
      case 'hideAll': {
        setLayers(ANATOMY_LAYERS.reduce((acc, l) => ({ ...acc, [l.id]: false }), {} as Record<LayerId, boolean>));
        setLastAction('All layers hidden');
        break;
      }
      case 'switchPatient': {
        const fig = getFigureById(intent.figureId);
        setActiveFigure(fig);
        try {
          localStorage.setItem(FIGURE_STORAGE_KEY, intent.figureId);
        } catch {
          /* noop */
        }
        setLastAction(`Switched to ${fig.name} (${fig.age}, ${fig.sex})`);
        break;
      }
      case 'shaveHead': {
        setHeadShaved(true);
        setLastAction('Head shaved');
        break;
      }
      case 'growHair': {
        setHeadShaved(false);
        setLastAction('Hair restored');
        break;
      }
      case 'endoscope': {
        setEndoscopeView(intent.view);
        setIdleRotate(false);
        // Position the camera at the opening
        if (intent.view === 'vaginal') {
          setCameraTarget([0, activeFigure.proportions.hipY - activeFigure.proportions.footHeight - 0.05, activeFigure.proportions.hipDepth * 0.95]);
        } else if (intent.view === 'rectal') {
          setCameraTarget([0, activeFigure.proportions.hipY - activeFigure.proportions.footHeight - 0.1, -activeFigure.proportions.hipDepth * 0.55]);
        }
        setCameraDistance(0.04);
        setLastAction(`Endoscope in ${intent.view} canal`);
        break;
      }
      case 'exitEndoscope': {
        setEndoscopeView(null);
        setCameraTarget([0, activeFigure.proportions.waistY - activeFigure.proportions.footHeight, 0]);
        setCameraDistance(3.5);
        setLastAction('Exited endoscope view');
        break;
      }
      case 'insertForeignBody': {
        setForeignBody(intent.object);
        setLastAction(`Inserted ${intent.object}`);
        break;
      }
      case 'removeForeignBody': {
        setForeignBody(null);
        setLastAction('Foreign body removed');
        break;
      }
      case 'loadCase': {
        const c = getCaseById(intent.caseId);
        if (c) {
          handleLoadCase(c);
        } else {
          setLastAction(`Case not found: ${intent.caseId}`);
        }
        break;
      }
      case 'nextCase': {
        handleNextCase();
        break;
      }
      case 'help': {
        setHelpHighlight(true);
        setLastAction('Showing voice commands');
        setTimeout(() => setHelpHighlight(false), 5000);
        break;
      }
      case 'unknown': {
        setLastAction(`Didn't catch that — try "help"`);
        break;
      }
    }
  }, []);

  // Conversation hook
  const conversation = useConversation({
    enabled: mode === 'conversation',
    llmConfig,
    ttsConfig,
    actionContext: actionContextRef,
    attachedObjects,
    sceneState: {
      visibleLayers: Object.entries(layers).filter(([, v]) => v).map(([k]) => k),
      currentRotation: { y: modelRotationY, x: modelRotationX },
      zoomLevel: cameraDistance,
      attachedObjects: Object.entries(attachedObjects).filter(([, v]) => v).map(([k]) => k),
      recentCommands,
    },
    patientContext: {
      name: activeFigure.name,
      age: activeFigure.age,
      sex: activeFigure.sex,
      pronouns: activeFigure.pronouns,
      background: activeFigure.background,
      voice: activeFigure.voice,
    },
    transcript: voice.transcript,
    transcriptFinal: voice.transcriptFinal,
    onTranscriptHandled: voice.ackTranscript,
  });

  useEffect(() => {
    if (mode !== 'conversation') return;
    if (conversation.phase === 'thinking') setLastAction('Patient is thinking…');
    else if (conversation.phase === 'speaking') setLastAction('Patient is speaking…');
    else if (conversation.phase === 'error' && conversation.lastError) {
      setLastAction(`LLM error: ${conversation.lastError}`);
    }
  }, [mode, conversation.phase, conversation.lastError]);

  useEffect(() => {
    if (!lastAction) return;
    const t = setTimeout(() => setLastAction(''), 4000);
    return () => clearTimeout(t);
  }, [lastAction]);

  const executeQuickCommand = useCallback(
    (text: string) => {
      const intent = parseIntent(text);
      applyCommandIntent(intent);
      setLastTranscript(text);
    },
    [applyCommandIntent]
  );

  const handleWelcomeStart = useCallback(() => {
    setWelcomeVisible(false);
    voice.start();
  }, [voice]);

  const handleWelcomeSkip = useCallback(() => {
    setWelcomeVisible(false);
  }, []);

  const handleVoiceToggle = useCallback(() => {
    setHasInteracted(true);
    voice.toggle();
  }, [voice]);

  const layerToggler = useCallback(
    (id: LayerId) => {
      setHasInteracted(true);
      setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
      setLastAction(`${layers[id] ? 'Hid' : 'Showing'} ${id}`);
    },
    [layers]
  );

  const handleFigureSelect = useCallback((figureId: string) => {
    const fig = getFigureById(figureId);
    setActiveFigure(fig);
    try {
      localStorage.setItem(FIGURE_STORAGE_KEY, figureId);
    } catch {
      /* noop */
    }
    setLastAction(`Switched to ${fig.name}`);
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestingConnection(true);
    try {
      await conversation.testConnection();
    } finally {
      setTestingConnection(false);
    }
  }, [conversation]);

  const handleLoadCase = useCallback((c: PatientCase) => {
    setCurrentCaseId(c.id);
    setCaseLibraryOpen(false);
    // Apply figure
    const fig = c.customFigure || (c.figureId ? getFigureById(c.figureId) : null) || activeFigure;
    setActiveFigure(fig);
    try {
      localStorage.setItem(FIGURE_STORAGE_KEY, fig.id);
    } catch {
      /* noop */
    }
    // Apply attached objects
    setAttachedObjects(c.attachedObjects);
    // Apply default layers
    setLayers((prev) => {
      const next = { ...prev };
      // Turn everything off first
      ANATOMY_LAYERS.forEach((l) => (next[l.id] = false));
      // Then turn on the ones the case wants
      Object.entries(c.defaultLayers).forEach(([k, v]) => {
        next[k as LayerId] = v as boolean;
      });
      return next;
    });
    // Reset camera
    setIdleRotate(true);
    setModelRotationY(0);
    setModelRotationX(0);
    setCameraDistance(3.5);
    setCameraTarget([0, fig.proportions.waistY - fig.proportions.footHeight, 0]);
    setLastAction(`Loaded case: ${c.name}`);
  }, [activeFigure]);

  const handleNextCase = useCallback(() => {
    const all = getAllCases();
    const idx = all.findIndex((c) => c.id === currentCaseId);
    const next = all[(idx + 1) % all.length] || all[0];
    if (next) handleLoadCase(next);
  }, [currentCaseId, handleLoadCase]);

  const displayState = mode === 'conversation' ? mapConversationPhase(conversation.phase) : voice.state;

  // Now that handleLoadCase/handleNextCase are defined, populate the action context
  useEffect(() => {
    actionContextRef.current = {
      setModelRotationY: (updater) => setModelRotationY((p) => updater(p)),
      setModelRotationX: (updater) => setModelRotationX((p) => updater(p)),
      setCameraDistance: (updater) => setCameraDistance((p) => updater(p)),
      setIdleRotate: setIdleRotate,
      setLayers: (updater) => setLayers((p) => updater(p)),
      setAttachedObjects: (updater) => setAttachedObjects((p) => updater(p)),
      triggerAnimation,
      setCurrentAnimation,
      setFigureId: (id) => {
        const fig = getFigureById(id);
        setActiveFigure(fig);
        try {
          localStorage.setItem(FIGURE_STORAGE_KEY, id);
        } catch {
          /* noop */
        }
        setCameraTarget([0, fig.proportions.waistY - fig.proportions.footHeight, 0]);
      },
    };
  }, [triggerAnimation, handleLoadCase, handleNextCase]);

  // Send message handler (text or images)
  const handleSendMessage = useCallback(
    (text: string, images?: File[]) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      if (text || images) {
        setChatMessages((prev) => [...prev, userMsg]);
        // Track uploaded images for the MeshGen panel
        if (images && images.length > 0) {
          setUploadedImages((prev) => [...prev, ...images]);
        }
      }

      // If in command mode, parse the text as a command
      if (text && mode === 'command') {
        const intent = parseIntent(text);
        applyCommandIntent(intent);
      }
      // If in conversation mode, the conversation hook handles it
    },
    [mode, applyCommandIntent]
  );

  return (
    <div className="app">
      <BrandHeader />

      <WelcomeOverlay
        visible={welcomeVisible}
        micSupported={voice.isSupported}
        onStart={handleWelcomeStart}
        onSkip={handleWelcomeSkip}
        errorMessage={voice.errorMessage}
      />

      <Canvas
        className="scene-canvas"
        shadows
        camera={{ position: [2.2, 1.5, 2.8], fov: 38, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene
            figure={activeFigure}
            cameraDistance={cameraDistance}
            cameraTarget={cameraTarget}
            modelRotationY={modelRotationY}
            modelRotationX={modelRotationX}
            idleRotate={idleRotate}
            attachedObjects={attachedObjects}
            currentAnimation={currentAnimation}
            mode={mode}
            layers={layers}
            headShaved={headShaved}
            endoscopeActive={endoscopeView !== null}
            endoscopeView={endoscopeView}
            foreignBody={foreignBody}
          />
        </Suspense>
      </Canvas>

      {!welcomeVisible && (
        <>
          <div className="mode-toggle">
            <button
              className={mode === 'command' ? 'active' : ''}
              onClick={() => setMode('command')}
            >
              Command
            </button>
            <button
              className={mode === 'conversation' ? 'active' : ''}
              onClick={() => setMode('conversation')}
            >
              Conversation
            </button>
          </div>

          <button
            className="settings-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            title="LLM & Voice settings"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Case library button */}
          <button
            className="case-library-button"
            onClick={() => setCaseLibraryOpen(true)}
            aria-label="Open case library"
            title="Case library"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18M3 12h18M3 17h18" />
              <circle cx="6" cy="7" r="1" fill="currentColor" />
              <circle cx="6" cy="12" r="1" fill="currentColor" />
              <circle cx="6" cy="17" r="1" fill="currentColor" />
            </svg>
            {currentCaseId && <div className="case-indicator-dot" />}
          </button>

          {/* 3D generation button */}
          <button
            className="meshgen-button"
            onClick={() => setMeshGenOpen(true)}
            aria-label="3D mesh generation"
            title="3D mesh generation — turn photos into 3D models"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            {uploadedImages.length > 0 && (
              <div className="meshgen-badge">{uploadedImages.length}</div>
            )}
          </button>

          <VoiceControl
            state={displayState}
            transcript={voice.transcript}
            onToggle={handleVoiceToggle}
            errorMessage={voice.errorMessage || conversation.lastError}
          />

          <PatientSelector
            figures={PATIENT_FIGURES}
            currentFigureId={activeFigure.id}
            onSelect={handleFigureSelect}
            visible={true}
          />

          <LayerPanel layers={layers} onToggle={layerToggler} />

          {mode === 'command' && <HelpPanel highlighted={helpHighlight} />}

          {mode === 'command' && <QuickCommands onSelect={executeQuickCommand} />}

          {mode === 'conversation' && (
            <PatientChat utterances={conversation.patientUtterances} visible={true} />
          )}

          {/* Chat interface — replaces ActivityFeed, works in both modes */}
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isListening={displayState === 'listening'}
            voiceTranscript={voice.transcript}
            voiceTranscriptFinal={voice.transcriptFinal}
            onToggleVoice={handleVoiceToggle}
            voiceSupported={voice.isSupported}
            isProcessing={displayState === 'speaking'}
          />

          {mode === 'conversation' && (
            <div
              style={{
                position: 'absolute',
                top: 280,
                left: 24,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                pointerEvents: 'none',
                animation: 'slideInLeft 0.6s var(--transition-slow) 0.4s both',
              }}
            >
              <div className={`phase-badge ${conversation.phase}`}>
                <span className="dot" />
                <span>{phaseLabel(conversation.phase)}</span>
              </div>
              {conversation.isLLMConnected === false && (
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--color-error)',
                    fontWeight: 500,
                  }}
                >
                  ⚠ LLM not reachable — open settings (⚙)
                </div>
              )}
            </div>
          )}
        </>
      )}

      {settingsOpen && (
        <LLMSettings
          llmConfig={llmConfig}
          ttsConfig={ttsConfig}
          onLLMConfigChange={setLLMConfig}
          onTTSConfigChange={setTTSConfig}
          onTestConnection={handleTestConnection}
          connectionStatus={conversation.isLLMConnected}
          testingConnection={testingConnection}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {caseLibraryOpen && (
        <CaseLibrary
          visible={true}
          currentCaseId={currentCaseId}
          onLoadCase={handleLoadCase}
          currentFigure={activeFigure}
          currentLayers={layers}
          currentAttachedObjects={attachedObjects}
          onClose={() => setCaseLibraryOpen(false)}
        />
      )}

      {meshGenOpen && (
        <MeshGenPanel
          visible={true}
          images={uploadedImages}
          onClose={() => setMeshGenOpen(false)}
        />
      )}

      <div className="app-footer">MedStage · Prototype for stakeholder review · v0.3 · LLM + multi-patient</div>
    </div>
  );
}

function intentLabel(intent: VoiceIntent): string {
  switch (intent.kind) {
    case 'rotate':
      return `rotate ${intent.direction}`;
    case 'zoom':
      return `zoom ${intent.direction}`;
    case 'showLayer':
    case 'hideLayer':
    case 'toggleLayer':
    case 'isolateLayer':
      return `${intent.kind} ${intent.layer}`;
    case 'isolatePart':
      return `isolate ${intent.part}`;
    case 'showAll':
      return 'show all';
    case 'hideAll':
      return 'hide all';
    case 'switchPatient':
      return `switch to ${intent.figureId}`;
    case 'loadCase':
      return `load case ${intent.caseId}`;
    case 'nextCase':
      return 'next case';
    case 'shaveHead':
      return 'shave head';
    case 'growHair':
      return 'grow hair';
    case 'endoscope':
      return `endoscope ${intent.view}`;
    case 'exitEndoscope':
      return 'exit endoscope';
    case 'insertForeignBody':
      return `insert ${intent.object}`;
    case 'removeForeignBody':
      return 'remove foreign body';
    case 'reset':
      return 'reset';
    case 'help':
      return 'help';
    case 'unknown':
      return intent.transcript;
  }
}

function mapConversationPhase(phase: string): 'idle' | 'listening' | 'speaking' | 'error' {
  if (phase === 'listening') return 'listening';
  if (phase === 'thinking') return 'speaking';
  if (phase === 'speaking') return 'speaking';
  if (phase === 'error') return 'error';
  return 'idle';
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'listening':
      return 'Listening';
    case 'thinking':
      return 'Thinking…';
    case 'speaking':
      return 'Patient speaking';
    case 'error':
      return 'Error';
    default:
      return 'Ready';
  }
}
