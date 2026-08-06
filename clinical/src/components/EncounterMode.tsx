// MedStage — Encounter mode UI
// Shows the patient persona card, conversation log, phase progress,
// and input controls. Designed to be the primary UI when the user is
// practicing a patient encounter.

import { useState, useRef, useEffect } from 'react';
import type { EncounterMessage } from '../services/patientSimulator';
import type { PatientSimulatorPersona } from '../data/patientSimulatorPersona';
import type { ExamTool } from './ExamEquipment';

export type EncounterPhase = 'idle' | 'listening' | 'thinking' | 'patient-speaking' | 'finished' | 'error';

const TOOL_BUTTONS: Array<{ id: ExamTool; label: string; icon: string; tooltip: string }> = [
  { id: 'gloves', label: 'Gloves', icon: '🧤', tooltip: 'Put on / take off gloves' },
  { id: 'drape', label: 'Drape', icon: '🩹', tooltip: 'Apply sterile drape' },
  { id: 'speculum', label: 'Speculum', icon: '🔧', tooltip: 'Insert speculum (closed)' },
  { id: 'speculum_open', label: 'Open Spec', icon: '↔️', tooltip: 'Open the speculum' },
  { id: 'cytobrush', label: 'Cytobrush', icon: '🖌️', tooltip: 'Show cytobrush for Pap' },
  { id: 'spatula', label: 'Spatula', icon: '🥄', tooltip: 'Show Ayre spatula' },
  { id: 'forceps', label: 'Forceps', icon: '🗜️', tooltip: 'Show ring forceps' },
  { id: 'lubricant', label: 'Lube', icon: '🧴', tooltip: 'Show lubricant tube' },
  { id: 'light', label: 'Light', icon: '💡', tooltip: 'Exam light on/off' },
  { id: 'gauze', label: 'Gauze', icon: '⬜', tooltip: 'Gauze stack' },
];

export interface EncounterScorecard {
  total: number;
  covered: number;
  percent: number;
  byCategory: Record<string, { total: number; covered: number }>;
  items: Array<{ id: string; category: string; question: string; covered: boolean }>;
}

interface EncounterModeProps {
  persona: PatientSimulatorPersona;
  currentPhase: string;
  phases: string[];
  phase: EncounterPhase;
  messages: EncounterMessage[];
  isActive: boolean;
  isListening: boolean;
  voiceTranscript: string;
  voiceTranscriptFinal: boolean;
  onToggleVoice: () => void;
  voiceSupported: boolean;
  onSendDoctorMessage: (text: string) => void;
  onEndEncounter: () => void;
  onReset: () => void;
  onAdvancePhase?: () => void;
  onSetPhase?: (idx: number) => void;
  lastError: string | null;
  scorecard: EncounterScorecard;
  activeTools?: Set<ExamTool>;
  onToolToggle?: (tool: ExamTool, active: boolean) => void;
}

export function EncounterMode({
  persona,
  currentPhase,
  phases,
  phase,
  messages,
  isActive,
  isListening,
  voiceTranscript,
  voiceTranscriptFinal,
  onToggleVoice,
  voiceSupported,
  onSendDoctorMessage,
  onEndEncounter,
  onReset,
  onAdvancePhase,
  onSetPhase,
  lastError,
  scorecard,
  activeTools,
  onToolToggle,
}: EncounterModeProps) {
  const [input, setInput] = useState('');
  const [showScorecard, setShowScorecard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phaseIdx = phases.indexOf(currentPhase);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Note: voice transcript is auto-handled by the useEncounter hook.
  // We just need to clear the input when the voice transcript finalizes.

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendDoctorMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPhaseStatus = (idx: number): 'past' | 'current' | 'future' => {
    if (idx < phaseIdx) return 'past';
    if (idx === phaseIdx) return 'current';
    return 'future';
  };

  const getPhaseLabel = (p: string) => {
    return p
      .split(' ')
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getPhaseDescription = (p: string): string => {
    const map: Record<string, string> = {
      'pre-encounter': 'Introduce yourself, verify identity, offer chaperone',
      'history': 'Chief complaint, OB/GYN history, review of systems',
      'review of systems': 'Systematic review of all body systems',
      'positioning': 'Help patient into dorsal lithotomy position',
      'external exam': 'Inspect external genitalia, note any lesions',
      'speculum exam': 'Insert speculum, visualize cervix',
      'bimanual exam': 'Palpate uterus and adnexa',
      'findings': 'Summarize normal vs. abnormal findings',
      'plan and counseling': 'Discuss plan, follow-up, answer questions',
      'closing': 'End encounter, document findings',
    };
    return map[p] || '';
  };

  return (
    <div className="encounter-mode">
      {/* Persona card */}
      <div className="encounter-persona-card">
        <div className="encounter-persona-avatar">
          <div className="avatar-circle">{persona.name.split(' ').map((n) => n[0]).join('')}</div>
          <div className="encounter-listening-dot" data-listening={isListening}></div>
        </div>
        <div className="encounter-persona-info">
          <div className="encounter-persona-name">{persona.name}</div>
          <div className="encounter-persona-meta">
            {persona.age}yo {persona.pronouns.split('/')[0]} · {persona.occupation}
          </div>
          <div className="encounter-persona-cc">
            <span className="cc-label">Visit:</span> {persona.chiefComplaint}
          </div>
          <div className="encounter-persona-state">
            {persona.emotionalState}
          </div>
        </div>
      </div>

      {/* Phase progress */}
      <div className="encounter-phases">
        <div className="encounter-phases-header">
          <span className="encounter-section-label">Encounter Phase</span>
          {onAdvancePhase && (
            <button
              className="encounter-phase-next"
              onClick={onAdvancePhase}
              disabled={phaseIdx >= phases.length - 1}
            >
              Next →
            </button>
          )}
        </div>
        <div className="encounter-phase-current">
          <strong>{getPhaseLabel(currentPhase)}</strong>
          <p>{getPhaseDescription(currentPhase)}</p>
        </div>
        <div className="encounter-phase-track">
          {phases.map((p, idx) => (
            <button
              key={p}
              className={`encounter-phase-pill encounter-phase-${getPhaseStatus(idx)}`}
              onClick={() => onSetPhase?.(idx)}
              title={getPhaseDescription(p)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Tool controls */}
      {activeTools && onToolToggle && (
        <div className="encounter-tools">
          <div className="encounter-section-label">Exam Tools</div>
          <div className="encounter-tool-grid">
            {TOOL_BUTTONS.map((tool) => {
              const isActive = activeTools.has(tool.id);
              return (
                <button
                  key={tool.id}
                  className={`encounter-tool-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onToolToggle(tool.id, !isActive)}
                  title={tool.tooltip}
                >
                  <span className="encounter-tool-icon">{tool.icon}</span>
                  <span className="encounter-tool-label">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation log */}
      <div className="encounter-conversation">
        <div className="encounter-section-label-row">
          <span className="encounter-section-label">Conversation</span>
          <span className="encounter-message-count">{messages.length} messages</span>
        </div>
        <div className="encounter-messages">
          {messages.length === 0 && (
            <div className="encounter-empty">
              <div className="encounter-empty-icon">🎙️</div>
              <div className="encounter-empty-text">
                <strong>Begin the encounter</strong>
                <p>Introduce yourself and verify the patient's identity. Press the mic and speak, or type below.</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`encounter-message encounter-msg-${m.role}`}>
              <div className="encounter-msg-bubble">
                <div className="encounter-msg-label">
                  {m.role === 'doctor' ? '👨‍⚕️ You (Doctor)' : `🤒 ${persona.name}`}
                </div>
                <div className="encounter-msg-text">{m.text}</div>
              </div>
            </div>
          ))}
          {phase === 'thinking' && (
            <div className="encounter-message encounter-msg-patient encounter-msg-pending">
              <div className="encounter-msg-bubble">
                <div className="encounter-msg-label">🤒 {persona.name}</div>
                <div className="encounter-msg-text">
                  <span className="typing-dots"><span>•</span><span>•</span><span>•</span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="encounter-input-area">
        {lastError && (
          <div className="encounter-error">⚠️ {lastError}</div>
        )}
        <div className="encounter-input-row">
          <button
            className={`encounter-mic-button ${isListening ? 'listening' : ''}`}
            onClick={onToggleVoice}
            disabled={!voiceSupported || phase === 'thinking' || phase === 'patient-speaking'}
            title={voiceSupported ? (isListening ? 'Stop listening' : 'Speak to patient') : 'Voice not supported in this browser'}
          >
            {isListening ? '⏹️' : '🎙️'}
          </button>
          <input
            className="encounter-input"
            type="text"
            placeholder={
              phase === 'thinking'
                ? 'Patient is responding...'
                : phase === 'patient-speaking'
                ? 'Patient is speaking...'
                : 'Type what you say to the patient...'
            }
            value={voiceTranscriptFinal ? '' : voiceTranscript || input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={phase === 'thinking' || phase === 'patient-speaking'}
          />
          <button
            className="encounter-send-button"
            onClick={handleSend}
            disabled={!input.trim() || phase === 'thinking' || phase === 'patient-speaking'}
          >
            Send
          </button>
        </div>
        {isListening && (
          <div className="encounter-listening-indicator">
            <span className="listening-dot"></span>
            Listening... "{voiceTranscript}"
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="encounter-footer">
        <button
          className="encounter-scorecard-toggle"
          onClick={() => setShowScorecard(!showScorecard)}
        >
          📋 Scorecard ({scorecard.covered}/{scorecard.total} · {scorecard.percent}%)
        </button>
        <div className="encounter-footer-actions">
          <button className="encounter-reset-button" onClick={onReset}>
            ↻ Reset
          </button>
          <button className="encounter-end-button" onClick={onEndEncounter}>
            ⏹ End Encounter
          </button>
        </div>
      </div>

      {/* Scorecard drawer */}
      {showScorecard && (
        <div className="encounter-scorecard">
          <div className="encounter-scorecard-header">
            <strong>Encounter Coverage</strong>
            <button onClick={() => setShowScorecard(false)}>✕</button>
          </div>
          <div className="encounter-scorecard-summary">
            <div className="encounter-scorecard-percent">{scorecard.percent}%</div>
            <div className="encounter-scorecard-detail">
              {scorecard.covered} of {scorecard.total} recommended items covered
            </div>
            <div className="encounter-scorecard-bar">
              <div
                className="encounter-scorecard-fill"
                style={{ width: `${scorecard.percent}%` }}
              ></div>
            </div>
          </div>
          <div className="encounter-scorecard-list">
            {Object.entries(scorecard.byCategory).map(([cat, stats]) => (
              <div key={cat} className="encounter-scorecard-category">
                <div className="encounter-scorecard-cat-header">
                  {cat} ({stats.covered}/{stats.total})
                </div>
                {scorecard.items
                  .filter((i) => i.category === cat)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`encounter-scorecard-item ${item.covered ? 'covered' : 'missed'}`}
                    >
                      <span className="encounter-scorecard-icon">
                        {item.covered ? '✓' : '○'}
                      </span>
                      {item.question}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
