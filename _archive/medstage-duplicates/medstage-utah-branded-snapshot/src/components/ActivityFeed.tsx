// MedStage — Activity feed (bottom center)
// Shows the last voice command heard, the action taken, and live transcript.

interface ActivityFeedProps {
  transcript: string;
  lastAction: string;
  isListening: boolean;
  lastIntentKind: string;
}

export function ActivityFeed({ transcript, lastAction, isListening, lastIntentKind }: ActivityFeedProps) {
  const isError = lastIntentKind === 'unknown';
  const isSuccess = lastIntentKind && lastIntentKind !== 'unknown' && lastIntentKind !== 'idle';

  return (
    <div className="activity-feed" aria-live="polite">
      {transcript && (
        <div className="activity-bubble">
          <div className="activity-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </div>
          <div className="activity-text">
            <span className="you-said">Heard:</span>
            "{transcript}"
          </div>
        </div>
      )}

      {!transcript && lastAction && (
        <div className={`activity-bubble ${isError ? 'error' : isSuccess ? 'success' : ''}`}>
          <div className="activity-icon">
            {isError ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : isSuccess ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : null}
          </div>
          <div className="activity-text">{lastAction}</div>
        </div>
      )}

      {!transcript && !lastAction && isListening && (
        <div className="activity-hint">Listening… say "help" to see commands</div>
      )}

      {!transcript && !lastAction && !isListening && (
        <div className="activity-hint">Tap the microphone above to start</div>
      )}
    </div>
  );
}
