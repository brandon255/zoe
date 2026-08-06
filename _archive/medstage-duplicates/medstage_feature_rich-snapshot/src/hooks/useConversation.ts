// MedStage — Conversation mode hook
// Orchestrates: STT transcript → LLM intent + dialogue → scene action → TTS
// In command mode, this hook is dormant. In conversation mode, it's the main loop.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  streamChatCompletion,
  parsePatientResponse,
  buildSystemPrompt,
  testLLMConnection,
  type LLMConfig,
  type ChatMessage,
  type PatientAction,
} from '../services/llm';
import { speak, stopSpeaking, type TTSConfig } from '../services/tts';
import { applyPatientAction, type ActionContext, type PatientAnimation } from '../data/patientActions';
import type { LayerId } from '../types';

export type ConversationPhase = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

export interface PatientUtterance {
  id: string;
  text: string;
  emotion?: PatientAction['emotion'];
  timestamp: number;
}

export interface UseConversationProps {
  enabled: boolean;
  llmConfig: LLMConfig;
  ttsConfig: TTSConfig;
  /** Ref-based action context — we read it at call time so we always have fresh state */
  actionContext: React.MutableRefObject<ActionContext | null>;
  attachedObjects: Record<string, boolean>;
  sceneState: {
    visibleLayers: string[];
    currentRotation: { y: number; x: number };
    zoomLevel: number;
    attachedObjects: string[];
    recentCommands: string[];
  };
  patientContext?: {
    name: string;
    age: number;
    sex: 'male' | 'female';
    pronouns: { subject: string; object: string; possessive: string };
    background: string;
    voice: string;
  };
  /** Transcript from voice recognition */
  transcript: string;
  /** Whether the voice is in final state (not interim) */
  transcriptFinal: boolean;
  /** Latest user voice transcript (resets after handled) */
  onTranscriptHandled: () => void;
}

export interface UseConversationReturn {
  phase: ConversationPhase;
  patientUtterances: PatientUtterance[];
  isLLMConnected: boolean | null;
  lastError: string | null;
  testConnection: () => Promise<void>;
  triggerTextInput: (text: string) => Promise<void>;
  cancel: () => void;
}

export function useConversation(props: UseConversationProps): UseConversationReturn {
  const [phase, setPhase] = useState<ConversationPhase>('idle');
  const [patientUtterances, setPatientUtterances] = useState<PatientUtterance[]>([]);
  const [isLLMConnected, setIsLLMConnected] = useState<boolean | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const busyRef = useRef(false);
  const cancelRef = useRef(false);

  // Build the system prompt with scene context
  const systemPrompt = buildSystemPrompt(props.llmConfig.systemPrompt, props.sceneState, props.patientContext);

  // When scene state changes meaningfully, update the system message
  useEffect(() => {
    if (messagesRef.current.length > 0 && messagesRef.current[0].role === 'system') {
      messagesRef.current[0] = { role: 'system', content: systemPrompt };
    } else {
      messagesRef.current.unshift({ role: 'system', content: systemPrompt });
    }
  }, [systemPrompt]);

  const testConnection = useCallback(async () => {
    setIsLLMConnected(null);
    const err = await testLLMConnection(props.llmConfig);
    if (err) {
      setIsLLMConnected(false);
      setLastError(err);
    } else {
      setIsLLMConnected(true);
      setLastError(null);
    }
  }, [props.llmConfig]);

  const handleUserInput = useCallback(
    async (userText: string) => {
      if (!userText.trim() || busyRef.current) return;
      busyRef.current = true;
      cancelRef.current = false;
      setLastError(null);
      setPhase('thinking');

      // Add user message to history
      messagesRef.current.push({ role: 'user', content: userText });

      // Cap history to last 20 messages to keep context manageable
      if (messagesRef.current.length > 21) {
        messagesRef.current = [messagesRef.current[0], ...messagesRef.current.slice(-20)];
      }

      let fullResponse = '';

      try {
        await streamChatCompletion(
          props.llmConfig,
          messagesRef.current,
          {
            onToken: () => {
              // Could surface streaming tokens here
            },
            onComplete: async (text) => {
              fullResponse = text;
              if (cancelRef.current) {
                busyRef.current = false;
                setPhase('idle');
                return;
              }

              const action = parsePatientResponse(text);

              // Add assistant response to history
              messagesRef.current.push({
                role: 'assistant',
                content: text,
              });

              // Apply the action
              if (props.actionContext.current) {
                applyPatientAction(action, props.actionContext.current, props.attachedObjects);
              }

              // Add to UI
              setPatientUtterances((prev) =>
                [
                      {
                        id: `${Date.now()}-${Math.random()}`,
                        text: action.dialogue,
                        emotion: action.emotion,
                        timestamp: Date.now(),
                      },
                      ...prev,
                    ].slice(0, 8)
              );

              // Speak the dialogue
              if (action.dialogue && !cancelRef.current) {
                setPhase('speaking');
                await speak(action.dialogue, props.ttsConfig, {
                  onStart: () => setPhase('speaking'),
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
              } else {
                setPhase('idle');
                busyRef.current = false;
              }
            },
            onError: (err) => {
              setLastError(err.message);
              setPhase('error');
              busyRef.current = false;
            },
          }
        );
      } catch (err) {
        setLastError(err instanceof Error ? err.message : String(err));
        setPhase('error');
        busyRef.current = false;
      }
    },
    [props.llmConfig, props.ttsConfig, props.actionContext, props.attachedObjects]
  );

  // Watch for final voice transcripts and feed them to the LLM
  useEffect(() => {
    if (!props.enabled) return;
    if (!props.transcriptFinal) return;
    if (!props.transcript) return;
    if (phase !== 'listening' && phase !== 'idle') return;

    const text = props.transcript;
    props.onTranscriptHandled();
    handleUserInput(text);
  }, [props.transcriptFinal, props.transcript, props.enabled, phase, handleUserInput, props]);

  const triggerTextInput = useCallback(
    async (text: string) => {
      await handleUserInput(text);
    },
    [handleUserInput]
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
    stopSpeaking();
    busyRef.current = false;
    setPhase('idle');
  }, []);

  // Reset on disable
  useEffect(() => {
    if (!props.enabled) {
      cancel();
      setPatientUtterances([]);
    }
  }, [props.enabled, cancel]);

  return {
    phase,
    patientUtterances,
    isLLMConnected,
    lastError,
    testConnection,
    triggerTextInput,
    cancel,
  };
}
