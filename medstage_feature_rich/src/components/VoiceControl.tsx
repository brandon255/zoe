// MedStage — Voice control: large mic button with waveform + state feedback

import { VoiceWaveform } from './VoiceWaveform';
import type { VoiceState } from '../types';

interface VoiceControlProps {
  state: VoiceState;
  transcript: string;
  onToggle: () => void;
  errorMessage: string | null;
}

const stateLabel = (state: VoiceState, errorMessage: string | null): string => {
  if (state === 'listening') return 'Listening — speak a command';
  if (state === 'speaking') return 'Processing…';
  if (state === 'error') return errorMessage ?? 'Voice error';
  return 'Tap to start dictating';
};

export function VoiceControl({ state, transcript, onToggle, errorMessage }: VoiceControlProps) {
  const isListening = state === 'listening';
  const isError = state === 'error';

  return (
    <div className="voice-control">
      <button
        className={`voice-button ${state}`}
        onClick={onToggle}
        aria-label="Toggle voice input"
        title="Click to start voice control"
      >
        <span className="pulse-ring" />
        <span className="pulse-ring delay" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isError ? (
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          ) : isListening ? (
            <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
          ) : (
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" />
          )}
        </svg>
      </button>
      <VoiceWaveform active={isListening} />
      <div className={`voice-button-label ${isListening ? 'listening' : ''}`}>
        {stateLabel(state, errorMessage)}
        {isListening && transcript && (
          <span style={{ marginLeft: 8, color: 'var(--color-text-dim)' }}>"{transcript}"</span>
        )}
      </div>
    </div>
  );
}
