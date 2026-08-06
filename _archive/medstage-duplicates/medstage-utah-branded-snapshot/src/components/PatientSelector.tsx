// MedStage — Patient selector UI
// Tab/menu for switching between male and female patients.

import type { PatientFigure } from '../data/patientFigures';

interface PatientSelectorProps {
  figures: PatientFigure[];
  currentFigureId: string;
  onSelect: (figureId: string) => void;
  visible: boolean;
}

export function PatientSelector({ figures, currentFigureId, onSelect, visible }: PatientSelectorProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 200,
        right: 320,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: 'fadeIn 0.4s var(--transition-base) 0.2s both',
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          padding: '0 4px 4px',
        }}
      >
        Patient
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 6,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {figures.map((f) => {
          const active = f.id === currentFigureId;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              className="patient-selector-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--color-text)',
                fontSize: 12.5,
                fontWeight: 600,
                transition: 'all 150ms',
                textAlign: 'left',
                minWidth: 180,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(204, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: active ? 'rgba(255,255,255,0.2)' : f.skinTone,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: active ? 'white' : 'transparent',
                  flexShrink: 0,
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {active && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span>{f.name}</span>
                  <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : 'var(--color-text-dim)' }}>
                    {f.age}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : 'var(--color-text-dim)' }}>
                  {f.sex === 'male' ? '♂' : '♀'} {f.build} · {f.height.toFixed(2)}m
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
