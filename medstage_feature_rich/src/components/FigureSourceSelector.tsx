// MedStage — Figure Source Selector
// Switch between procedural, GLB, or custom GLB models.

import { useRef } from 'react';
import type { FigureSource } from '../types';

interface FigureSourceSelectorProps {
  currentSource: FigureSource;
  onSourceChange: (source: FigureSource) => void;
  onCustomGlbLoad: (url: string | null) => void;
  visible: boolean;
}

const SOURCES: Array<{ id: FigureSource; label: string; icon: string; description: string }> = [
  {
    id: 'procedural',
    label: 'Procedural',
    icon: '🧍',
    description: 'Built from primitives — stylized-realistic, fully editable',
  },
  {
    id: 'glb-cesium',
    label: 'GLB Sample',
    icon: '🧑',
    description: 'CesiumMan rigged character — realistic human proportions',
  },
  {
    id: 'glb-custom',
    label: 'Your GLB',
    icon: '📁',
    description: 'Drop in a MakeHuman or Z-Anatomy export',
  },
];

export function FigureSourceSelector({
  currentSource,
  onSourceChange,
  onCustomGlbLoad,
  visible,
}: FigureSourceSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      alert('Please select a .glb or .gltf file');
      return;
    }
    const url = URL.createObjectURL(file);
    onCustomGlbLoad(url);
    onSourceChange('glb-custom');
  };

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
        animation: 'fadeIn 0.4s var(--transition-base) 0.3s both',
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
        Figure Source
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 6,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          minWidth: 220,
        }}
      >
        {SOURCES.map((s) => {
          const active = s.id === currentSource;
          return (
            <button
              key={s.id}
              onClick={() => {
                if (s.id === 'glb-custom') {
                  fileInputRef.current?.click();
                } else {
                  onSourceChange(s.id);
                }
              }}
              className="patient-selector-btn"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 8,
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? 'white' : 'var(--color-text)',
                fontSize: 12.5,
                fontWeight: 600,
                transition: 'all 150ms',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{s.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <div>{s.label}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: active ? 'rgba(255,255,255,0.7)' : 'var(--color-text-dim)',
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  {s.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
