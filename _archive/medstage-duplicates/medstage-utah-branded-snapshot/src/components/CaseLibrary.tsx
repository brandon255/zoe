// MedStage — Case Library UI
// Browse, load, and manage patient cases for clinical training scenarios.

import { useState, useRef } from 'react';
import type { PatientCase } from '../data/patientCases';
import { BUILTIN_CASES, getAllCases, saveUserCase, deleteUserCase, getCaseById } from '../data/patientCases';
import type { PatientFigure } from '../data/patientFigures';
import { PATIENT_FIGURES, getFigureById } from '../data/patientFigures';
import type { LayerId } from '../types';

interface CaseLibraryProps {
  visible: boolean;
  currentCaseId: string | null;
  onLoadCase: (c: PatientCase) => void;
  currentFigure: PatientFigure;
  currentLayers: Record<LayerId, boolean>;
  currentAttachedObjects: Record<string, boolean>;
  onClose: () => void;
}

const SPECIALTY_COLORS: Record<PatientCase['specialty'], string> = {
  neurosurgery: '#a78bfa',
  orthopedics: '#fbbf24',
  proctology: '#f87171',
  gynecology: '#ec4899',
  general: '#60a5fa',
  cardiology: '#f43f5e',
};

export function CaseLibrary({
  visible,
  currentCaseId,
  onLoadCase,
  currentFigure,
  currentLayers,
  currentAttachedObjects,
  onClose,
}: CaseLibraryProps) {
  const [filter, setFilter] = useState<'all' | PatientCase['specialty']>('all');
  const [showSave, setShowSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const allCases = getAllCases();
  const filteredCases = filter === 'all' ? allCases : allCases.filter((c) => c.specialty === filter);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, caseId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = () => {
      const c = getCaseById(caseId);
      if (c) {
        const dataUrl = reader.result as string;
        if (isVideo) {
          c.videoDataUrl = dataUrl;
        } else {
          c.photoDataUrl = dataUrl;
        }
        if (c.builtin) {
          // Convert to user case
          const userCase: PatientCase = {
            ...c,
            id: `${c.id}-user-${Date.now()}`,
            builtin: false,
            [isVideo ? 'videoDataUrl' : 'photoDataUrl']: dataUrl,
          };
          saveUserCase(userCase);
          onLoadCase(userCase);
        } else {
          saveUserCase(c);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCurrent = (name: string) => {
    const newCase: PatientCase = {
      id: `user-${Date.now()}`,
      name,
      title: name,
      specialty: 'general',
      chiefComplaint: 'Custom case',
      history: 'User-created case',
      attachedObjects: { ...currentAttachedObjects },
      defaultLayers: { ...currentLayers },
      suggestedCommands: [],
      customFigure: currentFigure,
      createdAt: new Date().toISOString(),
    };
    saveUserCase(newCase);
    onLoadCase(newCase);
    setShowSave(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 20px 20px',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 16,
          padding: 28,
          maxWidth: 900,
          width: '100%',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          animation: 'scaleIn 0.3s var(--transition-base)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
              Case Library
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Load clinical scenarios — past cases, common presentations, custom patients
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowSave(true)}
              style={{
                padding: '8px 14px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Save current as case
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(204, 0, 0, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Specialty filter */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {(['all', 'neurosurgery', 'orthopedics', 'proctology', 'gynecology', 'general'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                color: filter === f ? 'white' : 'var(--color-text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Cases grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
          }}
        >
          {filteredCases.map((c) => {
            const isActive = c.id === currentCaseId;
            const accentColor = SPECIALTY_COLORS[c.specialty];
            return (
              <div
                key={c.id}
                style={{
                  background: isActive ? 'rgba(204, 0, 0, 0.08)' : 'var(--color-surface)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 12,
                  padding: 14,
                  transition: 'all 200ms',
                  position: 'relative',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => onLoadCase(c)}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Specialty badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '3px 8px',
                    background: accentColor,
                    color: 'white',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    borderBottomLeftRadius: 8,
                  }}
                >
                  {c.specialty}
                </div>

                {/* Media thumbnail (photo or video) */}
                {c.videoDataUrl && (
                  <div style={{ position: 'relative', marginBottom: 10, borderRadius: 6, overflow: 'hidden' }}>
                    <video
                      src={c.videoDataUrl}
                      style={{
                        width: '100%',
                        height: 100,
                        objectFit: 'cover',
                        background: '#000',
                      }}
                      muted
                      loop
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 3,
                        letterSpacing: 0.5,
                      }}
                    >
                      ▶ VIDEO
                    </div>
                  </div>
                )}
                {!c.videoDataUrl && c.photoDataUrl && (
                  <div
                    style={{
                      width: '100%',
                      height: 100,
                      backgroundImage: `url(${c.photoDataUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 6,
                      marginBottom: 10,
                    }}
                  />
                )}

                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                  {c.name}
                </h3>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                  {c.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.45,
                    marginBottom: 10,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  "{c.chiefComplaint}"
                </div>

                {/* Photo/Video upload button */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                >
                  <label
                    style={{
                      padding: '5px 10px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    {c.photoDataUrl || c.videoDataUrl ? 'Replace' : 'Add photo / video'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleMediaUpload(e, c.id)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {!c.builtin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete case "${c.name}"?`)) {
                          deleteUserCase(c.id);
                          // Force re-render
                          window.location.reload();
                        }
                      }}
                      style={{
                        padding: '5px 8px',
                        background: 'transparent',
                        color: 'var(--color-error)',
                        fontSize: 10.5,
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>

                {isActive && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '4px 8px',
                      background: 'var(--color-primary)',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 4,
                      textAlign: 'center',
                      letterSpacing: 0.5,
                    }}
                  >
                    ACTIVE
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {showSave && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: 'rgba(90, 158, 255, 0.08)',
              border: '1px solid var(--color-info)',
              borderRadius: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
              Save current patient as a case
            </div>
            <input
              type="text"
              placeholder="Case name (e.g., 'Mr. Smith, knee pain')"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.currentTarget;
                  if (target.value.trim()) handleSaveCurrent(target.value.trim());
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                color: 'var(--color-text)',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 6 }}>
              Press Enter to save. Cases are stored locally and can include photos.
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            padding: 12,
            background: 'rgba(90, 158, 255, 0.08)',
            borderLeft: '2px solid var(--color-info)',
            borderRadius: '0 6px 6px 0',
            fontSize: 11.5,
            color: 'var(--color-text-muted)',
            lineHeight: 1.55,
          }}
        >
          💡 <strong>Voice:</strong> Say "load case 1", "show me the head injury case", or "next case" to cycle. Photos are stored as data URLs in localStorage. For AI-generated patients, use the LLM in conversation mode: "Create a 60-year-old male with diabetes and a left foot ulcer."
        </div>
      </div>
    </div>
  );
}
