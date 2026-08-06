// MedStage — Patient chat overlay
// Shows the patient's dialogue as speech bubbles, with emotion icons.

import type { PatientUtterance } from '../hooks/useConversation';

interface PatientChatProps {
  utterances: PatientUtterance[];
  visible: boolean;
}

const emotionEmoji: Record<string, string> = {
  neutral: '💬',
  happy: '🙂',
  concerned: '😟',
  pain: '😣',
  amused: '😄',
  thoughtful: '🤔',
};

const emotionColor: Record<string, string> = {
  neutral: 'var(--color-info)',
  happy: 'var(--color-accent)',
  concerned: 'var(--color-warning)',
  pain: 'var(--color-error)',
  amused: 'var(--color-warning)',
  thoughtful: 'var(--color-info)',
};

export function PatientChat({ utterances, visible }: PatientChatProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 200,
        left: 24,
        zIndex: 55,
        width: 320,
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        animation: 'slideInLeft 0.6s var(--transition-slow) 0.3s both',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          padding: '0 4px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 3,
            height: 14,
            background: 'var(--color-primary-bright)',
            borderRadius: 2,
          }}
        />
        Patient Dialogue
      </div>
      {utterances.length === 0 && (
        <div
          style={{
            padding: '14px 16px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            color: 'var(--color-text-dim)',
            fontSize: 12.5,
            fontStyle: 'italic',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          Conversation mode active. Say something to the patient — they'll respond in character.
        </div>
      )}
      {utterances.map((u) => {
        const color = emotionColor[u.emotion || 'neutral'] || 'var(--color-info)';
        return (
          <div
            key={u.id}
            style={{
              padding: '12px 14px',
              background: 'var(--color-surface-elevated)',
              border: `1px solid ${color}40`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 10,
              color: 'var(--color-text)',
              fontSize: 13,
              lineHeight: 1.5,
              boxShadow: 'var(--shadow-sm)',
              animation: 'bubbleIn 0.3s var(--transition-base) both',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color,
                fontWeight: 700,
                letterSpacing: 0.5,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{emotionEmoji[u.emotion || 'neutral']}</span>
              <span>Patient · {u.emotion || 'neutral'}</span>
            </div>
            <div>"{u.text}"</div>
          </div>
        );
      })}
    </div>
  );
}
