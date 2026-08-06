// MedStage — Web Speech API hook
// Captures voice input and routes to the intent parser.
// Designed to be swappable for Vosk/Whisper later — emits intents, not raw audio.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { VoiceIntent, VoiceState } from '../types';
import { parseIntent } from '../data/voiceCommands';

interface UseVoiceCommandsOptions {
  onIntent: (intent: VoiceIntent) => void;
  continuous?: boolean;
}

interface UseVoiceCommandsReturn {
  state: VoiceState;
  transcript: string;
  /** True after a final transcript has been emitted (cleared when consumed) */
  transcriptFinal: boolean;
  lastIntent: VoiceIntent | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  isSupported: boolean;
  errorMessage: string | null;
  /** Acknowledge a final transcript (so the next one can be detected) */
  ackTranscript: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognitionInstance };
    webkitSpeechRecognition: { new (): SpeechRecognitionInstance };
  }
}

const getSpeechRecognition = (): SpeechRecognitionInstance | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
};

export function useVoiceCommands({
  onIntent,
  continuous = true,
}: UseVoiceCommandsOptions): UseVoiceCommandsReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [transcriptFinal, setTranscriptFinal] = useState(false);
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onIntentRef = useRef(onIntent);

  useEffect(() => {
    onIntentRef.current = onIntent;
  }, [onIntent]);

  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!isSupported) {
      setErrorMessage('Speech recognition not supported in this browser. Use Chrome or Edge.');
      setState('error');
      return;
    }

    // Tear down any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
    }

    const recognition = getSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState('listening');
      setErrorMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      const display = (final + interim).trim();
      setTranscript(display);

      if (final) {
        const intent = parseIntent(final);
        setLastIntent(intent);
        setTranscriptFinal(true);
        onIntentRef.current(intent);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg =
        event.error === 'not-allowed'
          ? 'Microphone access denied. Please allow microphone in browser settings.'
          : event.error === 'no-speech'
          ? 'No speech detected. Try again.'
          : `Voice error: ${event.error}`;
      setErrorMessage(msg);
      setState('error');
    };

    recognition.onend = () => {
      // If we were supposed to be continuous, restart automatically
      setState((prev) => {
        if (prev === 'listening' && continuous) {
          try {
            recognition.start();
            return 'listening';
          } catch {
            return 'idle';
          }
        }
        return 'idle';
      });
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setErrorMessage(`Failed to start voice: ${err instanceof Error ? err.message : String(err)}`);
      setState('error');
    }
  }, [isSupported, continuous]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    setState('idle');
  }, []);

  const toggle = useCallback(() => {
    if (state === 'listening') {
      stop();
    } else {
      start();
    }
  }, [state, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
    };
  }, []);

  return {
    state,
    transcript,
    transcriptFinal,
    lastIntent,
    start,
    stop,
    toggle,
    isSupported,
    errorMessage,
    ackTranscript: () => setTranscriptFinal(false),
  };
}
