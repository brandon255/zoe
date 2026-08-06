// MedStage — LLM Settings panel
// Configure the LLM endpoint, model, and TTS voice.
// Persists to localStorage.

import { useState, useEffect } from 'react';
import type { LLMConfig } from '../services/llm';
import { DEFAULT_LLM_CONFIG } from '../services/llm';
import type { TTSConfig } from '../services/tts';
import { DEFAULT_TTS_CONFIG } from '../services/tts';

const STORAGE_KEY_LLM = 'medstage:llm-config';
const STORAGE_KEY_TTS = 'medstage:tts-config';

export function loadLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LLM);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LLM_CONFIG, ...parsed };
    }
  } catch {
    /* noop */
  }
  return DEFAULT_LLM_CONFIG;
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_LLM, JSON.stringify(config));
  } catch {
    /* noop */
  }
}

export function loadTTSConfig(): TTSConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_TTS_CONFIG, ...parsed };
    }
  } catch {
    /* noop */
  }
  return DEFAULT_TTS_CONFIG;
}

export function saveTTSConfig(config: TTSConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_TTS, JSON.stringify(config));
  } catch {
    /* noop */
  }
}

interface LLMSettingsProps {
  llmConfig: LLMConfig;
  ttsConfig: TTSConfig;
  onLLMConfigChange: (config: LLMConfig) => void;
  onTTSConfigChange: (config: TTSConfig) => void;
  onTestConnection: () => Promise<void>;
  connectionStatus: boolean | null;
  testingConnection: boolean;
  onClose: () => void;
}

export function LLMSettings({
  llmConfig,
  ttsConfig,
  onLLMConfigChange,
  onTTSConfigChange,
  onTestConnection,
  connectionStatus,
  testingConnection,
  onClose,
}: LLMSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 20,
        animation: 'fadeIn 0.2s ease',
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
          maxWidth: 520,
          width: '100%',
          maxHeight: '90vh',
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
            LLM & Voice Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              transition: 'all 150ms',
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

        {/* LLM section */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 12,
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
            Language Model
          </div>

          <Field label="Base URL" hint="Ollama default: http://localhost:11434/v1">
            <input
              className="settings-input"
              type="text"
              value={llmConfig.baseUrl}
              onChange={(e) => onLLMConfigChange({ ...llmConfig, baseUrl: e.target.value })}
              placeholder="http://localhost:11434/v1"
            />
          </Field>
          <Field label="Model" hint="Ollama: hermes3, llama3.1, mistral">
            <input
              className="settings-input"
              type="text"
              value={llmConfig.model}
              onChange={(e) => onLLMConfigChange({ ...llmConfig, model: e.target.value })}
              placeholder="hermes3"
            />
          </Field>
          <Field label="API Key" hint="Leave blank for local Ollama">
            <input
              className="settings-input"
              type="password"
              value={llmConfig.apiKey || ''}
              onChange={(e) => onLLMConfigChange({ ...llmConfig, apiKey: e.target.value })}
              placeholder="sk-... (optional)"
            />
          </Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Field label="Temperature" inline>
              <input
                className="settings-input"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={llmConfig.temperature}
                onChange={(e) =>
                  onLLMConfigChange({ ...llmConfig, temperature: parseFloat(e.target.value) || 0 })
                }
                style={{ width: 80 }}
              />
            </Field>
            <Field label="Max tokens" inline>
              <input
                className="settings-input"
                type="number"
                step="64"
                min="64"
                max="4096"
                value={llmConfig.maxTokens}
                onChange={(e) =>
                  onLLMConfigChange({ ...llmConfig, maxTokens: parseInt(e.target.value) || 512 })
                }
                style={{ width: 80 }}
              />
            </Field>
          </div>

          <button
            onClick={onTestConnection}
            disabled={testingConnection}
            className="settings-button-secondary"
            style={{ marginTop: 12, width: '100%' }}
          >
            {testingConnection ? (
              <>Testing…</>
            ) : connectionStatus === true ? (
              <>
                <span style={{ color: 'var(--color-accent)' }}>●</span> Connected
              </>
            ) : connectionStatus === false ? (
              <>
                <span style={{ color: 'var(--color-error)' }}>●</span> Failed — check URL and model
              </>
            ) : (
              <>Test connection</>
            )}
          </button>
        </div>

        {/* TTS section */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 12,
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
            Text-to-Speech
          </div>
          <Field label="Voice" hint="Web Speech API (browser, free)">
            <select
              className="settings-input"
              value={ttsConfig.voiceId || ''}
              onChange={(e) => onTTSConfigChange({ ...ttsConfig, voiceId: e.target.value })}
            >
              <option value="">System default</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Field label="Rate" inline>
              <input
                className="settings-input"
                type="number"
                step="0.1"
                min="0.5"
                max="2"
                value={ttsConfig.rate}
                onChange={(e) =>
                  onTTSConfigChange({ ...ttsConfig, rate: parseFloat(e.target.value) || 1 })
                }
                style={{ width: 80 }}
              />
            </Field>
            <Field label="Pitch" inline>
              <input
                className="settings-input"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={ttsConfig.pitch}
                onChange={(e) =>
                  onTTSConfigChange({ ...ttsConfig, pitch: parseFloat(e.target.value) || 1 })
                }
                style={{ width: 80 }}
              />
            </Field>
          </div>
        </div>

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
          💡 The system prompt that powers the patient is in <strong>HERMES_SYSTEM_PROMPT.md</strong>.
          Edit that file, then set the LLM base URL here. For Ollama: run <code>ollama pull hermes3</code> first.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  inline,
  children,
}: {
  label: string;
  hint?: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: inline ? 0 : 12, flex: inline ? 1 : undefined }}>
      <label
        style={{
          display: 'block',
          fontSize: 11.5,
          color: 'var(--color-text-muted)',
          fontWeight: 500,
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div style={{ fontSize: 10.5, color: 'var(--color-text-dim)', marginTop: 4 }}>{hint}</div>
      )}
    </div>
  );
}
