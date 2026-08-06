// MedStage — Encounter mode hook
// In encounter mode, the user is the doctor and the LLM is the patient.
// Voice/text input from the user goes to the LLM, which responds in
// character as a real patient. The patient response is then spoken
// with a different TTS voice profile from the narrator.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LLMConfig,
} from '../services/llm';
import {
  type TTSConfig,
  speakAs,
  stopSpeaking,
  type SpeakerProfile,
} from '../services/tts';
import {
  streamPatientResponse,
  detectAnatomyMentions,
  scoreEncounter,
  encounterSummary,
  STANDARD_ANNUAL_GYN_CHECKLIST,
  type EncounterMessage,
  type EncounterChecklistItem,
} from '../services/patientSimulator';
import {
  type PatientSimulatorPersona,
  DEFAULT_PERSONA,
} from '../data/patientSimulatorPersona';
import type { ExamTool } from '../components/ExamEquipment';

export type EncounterPhase =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'patient-speaking'
  | 'finished'
  | 'error';

export interface UseEncounterProps {
  enabled: boolean;
  llmConfig: LLMConfig;
  ttsConfig: TTSConfig;
  patientProfile: SpeakerProfile;
  narratorProfile: SpeakerProfile;
  persona?: PatientSimulatorPersona;
  /** Voice transcript from STT */
  transcript: string;
  transcriptFinal: boolean;
  onTranscriptHandled: () => void;
  /** Notify parent when anatomy is mentioned (for highlighting) */
  onAnatomyMentioned?: (layerIds: string[]) => void;
}

export interface UseEncounterReturn {
  phase: EncounterPhase;
  messages: EncounterMessage[];
  isActive: boolean;
  lastError: string | null;
  checklist: EncounterChecklistItem[];
  summary: ReturnType<typeof encounterSummary>;
  currentPhase: string;
  phases: string[];
  activeTools: Set<ExamTool>;
  setTool: (tool: ExamTool, active: boolean) => void;
  setTools: (tools: ExamTool[]) => void;
  startEncounter: () => void;
  endEncounter: () => void;
  doctorSays: (text: string) => Promise<void>;
  reset: () => void;
  advancePhase: () => void;
  setPhaseByIndex: (idx: number) => void;
}

const ENCOUNTER_PHASES = [
  'pre-encounter',
  'history',
  'review of systems',
  'positioning',
  'external exam',
  'speculum exam',
  'bimanual exam',
  'findings',
  'plan and counseling',
  'closing',
];

export function useEncounter(props: UseEncounterProps): UseEncounterReturn {
  const [phase, setPhase] = useState<EncounterPhase>('idle');
  const [messages, setMessages] = useState<EncounterMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(ENCOUNTER_PHASES[0]);
  const [activeTools, setActiveTools] = useState<Set<ExamTool>>(new Set(['gloves']));
  const messagesRef = useRef<EncounterMessage[]>([]);
  const phaseRef = useRef(currentPhase);
  const persona = props.persona ?? DEFAULT_PERSONA;
  const busyRef = useRef(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    phaseRef.current = currentPhase;
  }, [currentPhase]);

  // Keep the ref in sync with the state for the LLM call
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Auto-equip tools based on the current encounter phase.
  // The doctor can override with voice commands.
  useEffect(() => {
    const phaseTools: Record<string, ExamTool[]> = {
      'pre-encounter': ['gloves'],
      'history': ['gloves'],
      'review of systems': ['gloves'],
      'positioning': ['gloves', 'drape'],
      'external exam': ['gloves', 'drape', 'light'],
      'speculum exam': ['gloves', 'drape', 'light', 'speculum'],
      'bimanual exam': ['gloves', 'drape', 'forceps'],
      'findings': ['gloves', 'drape'],
      'plan and counseling': ['drape'],
      'closing': [],
    };
    const tools = phaseTools[currentPhase] ?? ['gloves'];
    // Don't override if the user has manually customized — only on phase change.
    // We always reset on phase change to keep things consistent.
    setActiveTools(new Set(tools));
  }, [currentPhase]);

  const advancePhase = useCallback(() => {
    setCurrentPhase((prev) => {
      const idx = ENCOUNTER_PHASES.indexOf(prev);
      const next = ENCOUNTER_PHASES[Math.min(idx + 1, ENCOUNTER_PHASES.length - 1)];
      return next;
    });
  }, []);

  const setPhaseByIndex = useCallback((idx: number) => {
    setCurrentPhase(ENCOUNTER_PHASES[Math.max(0, Math.min(idx, ENCOUNTER_PHASES.length - 1))]);
  }, []);

  const checklist = scoreEncounter(STANDARD_ANNUAL_GYN_CHECKLIST, messages);
  const summary = encounterSummary(checklist);

  const startEncounter = useCallback(() => {
    setMessages([]);
    messagesRef.current = [];
    setCurrentPhase(ENCOUNTER_PHASES[0]);
    setPhase('idle');
    setLastError(null);
    setActiveTools(new Set(['gloves']));
  }, []);

  const endEncounter = useCallback(() => {
    stopSpeaking();
    busyRef.current = false;
    setPhase('finished');
  }, []);

  const reset = useCallback(() => {
    stopSpeaking();
    busyRef.current = false;
    cancelRef.current = true;
    setMessages([]);
    messagesRef.current = [];
    setCurrentPhase(ENCOUNTER_PHASES[0]);
    setPhase('idle');
    setLastError(null);
    setActiveTools(new Set(['gloves']));
  }, []);

  const setTool = useCallback((tool: ExamTool, active: boolean) => {
    setActiveTools((prev) => {
      const next = new Set(prev);
      if (active) next.add(tool);
      else next.delete(tool);
      return next;
    });
  }, []);

  const setTools = useCallback((tools: ExamTool[]) => {
    setActiveTools(new Set(tools));
  }, []);

  const handleDoctorInput = useCallback(
    async (doctorText: string) => {
      if (!doctorText.trim() || busyRef.current) return;
      busyRef.current = true;
      cancelRef.current = false;
      setLastError(null);
      setPhase('thinking');

      // Add doctor message to history
      const doctorMessage: EncounterMessage = {
        role: 'doctor',
        text: doctorText,
        timestamp: Date.now(),
      };
      const newMessages = [...messagesRef.current, doctorMessage];
      messagesRef.current = newMessages;
      setMessages(newMessages);

      // Detect anatomy mentions in the doctor's text and notify parent
      if (props.onAnatomyMentioned) {
        const mentions = detectAnatomyMentions(doctorText);
        if (mentions.length > 0) {
          props.onAnatomyMentioned(mentions);
        }
      }

      // Build context for the patient simulator
      const context = {
        persona,
        currentPhase: phaseRef.current,
        messages: newMessages,
      };

      let streamedText = '';
      let fullText = '';

      try {
        await streamPatientResponse(props.llmConfig, context, doctorText, {
          onToken: (token) => {
            streamedText += token;
            // Could surface streaming tokens in the UI
          },
          onComplete: async (text) => {
            fullText = text;
            if (cancelRef.current) {
              busyRef.current = false;
              setPhase('idle');
              return;
            }

            // Clean up the response — strip any code fences or quotes
            let cleanText = text.trim();
            cleanText = cleanText.replace(/^```[\s\S]*?```$/gm, '').trim();
            cleanText = cleanText.replace(/^["']|["']$/g, '').trim();
            // Remove any leading "Patient:" or "Sarah:" prefix
            cleanText = cleanText.replace(/^(patient|sarah|assistant):\s*/i, '');

            if (!cleanText) {
              busyRef.current = false;
              setPhase('idle');
              return;
            }

            // Detect anatomy mentions in the patient's text
            if (props.onAnatomyMentioned) {
              const mentions = detectAnatomyMentions(cleanText);
              if (mentions.length > 0) {
                props.onAnatomyMentioned(mentions);
              }
            }

            // Add patient message to history
            const patientMessage: EncounterMessage = {
              role: 'patient',
              text: cleanText,
              timestamp: Date.now(),
            };
            const updatedMessages = [...messagesRef.current, patientMessage];
            messagesRef.current = updatedMessages;
            setMessages(updatedMessages);

            // Speak the patient response with the patient voice profile
            setPhase('patient-speaking');
            await speakAs(cleanText, props.ttsConfig, props.patientProfile, {
              onStart: () => setPhase('patient-speaking'),
              onEnd: () => {
                setPhase('idle');
                busyRef.current = false;
              },
              onError: (err) => {
                setLastError(err.message);
                setPhase('error');
                busyRef.current = false;
              },
            });
          },
          onError: (err) => {
            setLastError(err.message);
            setPhase('error');
            busyRef.current = false;
          },
        });
      } catch (err) {
        setLastError(err instanceof Error ? err.message : String(err));
        setPhase('error');
        busyRef.current = false;
      }
    },
    [props.llmConfig, props.ttsConfig, props.patientProfile, props.onAnatomyMentioned, persona]
  );

  // Watch for final voice transcripts and feed them to the LLM
  useEffect(() => {
    if (!props.enabled) return;
    if (!props.transcriptFinal) return;
    if (!props.transcript) return;
    if (phase !== 'idle' && phase !== 'listening') return;

    const text = props.transcript;
    props.onTranscriptHandled();
    handleDoctorInput(text);
  }, [
    props.transcriptFinal,
    props.transcript,
    props.enabled,
    phase,
    handleDoctorInput,
    props,
  ]);

  const doctorSays = useCallback(
    async (text: string) => {
      await handleDoctorInput(text);
    },
    [handleDoctorInput]
  );

  // Reset on disable
  useEffect(() => {
    if (!props.enabled) {
      stopSpeaking();
      busyRef.current = false;
      cancelRef.current = true;
      setPhase('idle');
    }
  }, [props.enabled]);

  return {
    phase,
    messages,
    isActive: props.enabled,
    lastError,
    checklist,
    summary,
    currentPhase,
    phases: ENCOUNTER_PHASES,
    activeTools,
    setTool,
    setTools,
    startEncounter,
    endEncounter,
    doctorSays,
    reset,
    advancePhase,
    setPhaseByIndex,
  };
}
