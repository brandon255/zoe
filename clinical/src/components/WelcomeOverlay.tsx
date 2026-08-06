// MedStage — Welcome overlay
// First-time splash that requests mic permission and onboards the user.

import { useEffect, useState } from 'react';

interface WelcomeOverlayProps {
  visible: boolean;
  micSupported: boolean;
  onStart: () => void;
  onSkip: () => void;
  errorMessage: string | null;
}

export function WelcomeOverlay({ visible, micSupported, onStart, onSkip, errorMessage }: WelcomeOverlayProps) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!visible) setPressed(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="welcome-card">
        <div className="welcome-eyebrow">Independent Prototype · v0.1</div>
        <h1 className="welcome-title" id="welcome-title">
          Voice-driven <span className="accent">medical anatomy</span> for the
          <br />
          Doctrine Labs independent medical-training prototype
        </h1>
        <p className="welcome-body">
          A 100% hands-free, voice-controlled 3D anatomy learning environment. Med students
          explore the human body by speaking — rotate, isolate, study surface landmarks, and
          build muscle memory without a mouse.
        </p>
        <ul className="welcome-checklist">
          <li>
            <div className="welcome-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            Click below to grant microphone access
          </li>
          <li>
            <div className="welcome-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            Try "rotate left" or "zoom in"
          </li>
          <li>
            <div className="welcome-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            Say "help" anytime to see all commands
          </li>
        </ul>
        <button
          className="welcome-cta"
          onClick={() => {
            setPressed(true);
            onStart();
          }}
          disabled={!micSupported || pressed}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          {pressed ? 'Starting…' : 'Start voice control'}
        </button>
        {!micSupported && (
          <div className="welcome-error">
            Voice control requires Chrome or Edge. The 3D scene still works — you can drag to rotate.
          </div>
        )}
        {errorMessage && micSupported && (
          <div className="welcome-error">{errorMessage}</div>
        )}
        <button className="welcome-skip" onClick={onSkip}>
          Skip — explore scene only
        </button>
      </div>
    </div>
  );
}
