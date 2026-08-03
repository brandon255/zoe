// MedStage — TTS Service
// Pluggable text-to-speech. Defaults to the Web Speech API (free, built-in).
// Can be swapped to ElevenLabs / OpenAI TTS by changing the implementation.
//
// Each TTS provider implements the same interface so the rest of the app
// doesn't care which one is active.

export type TTSProviderId = 'web-speech' | 'elevenlabs' | 'openai';

export interface TTSConfig {
  provider: TTSProviderId;
  voiceId?: string;
  rate: number;
  pitch: number;
  volume: number;
}

export const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: 'web-speech',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: Error) => void;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isTTSSupported(config: TTSConfig): boolean {
  if (typeof window === 'undefined') return false;
  if (config.provider === 'web-speech') {
    return 'speechSynthesis' in window;
  }
  // For premium providers, we just need fetch
  return typeof fetch === 'function';
}

export function listAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

/**
 * Speak text using the configured TTS provider.
 * Returns a promise that resolves when speech ends.
 */
export async function speak(
  text: string,
  config: TTSConfig,
  options: SpeakOptions = {}
): Promise<void> {
  if (!text.trim()) return;

  if (config.provider === 'web-speech') {
    return speakWithWebSpeech(text, config, options);
  }
  if (config.provider === 'elevenlabs') {
    return speakWithElevenLabs(text, config, options);
  }
  if (config.provider === 'openai') {
    return speakWithOpenAI(text, config, options);
  }
}

function speakWithWebSpeech(
  text: string,
  config: TTSConfig,
  options: SpeakOptions
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onError?.(new Error('Web Speech API not supported'));
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    if (config.voiceId) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.voiceURI === config.voiceId || v.name === config.voiceId);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => {
      currentUtterance = null;
      options.onEnd?.();
      resolve();
    };
    utterance.onerror = (e) => {
      // "interrupted" / "canceled" are normal when we cancel
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve();
        return;
      }
      options.onError?.(new Error(`TTS error: ${e.error}`));
      resolve();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

async function speakWithElevenLabs(text: string, config: TTSConfig, options: SpeakOptions): Promise<void> {
  // Placeholder — requires the user to add their ElevenLabs API key + voice ID
  options.onError?.(new Error('ElevenLabs integration not yet configured. Add API key in settings.'));
}

async function speakWithOpenAI(text: string, config: TTSConfig, options: SpeakOptions): Promise<void> {
  // Placeholder — requires the user to add their OpenAI API key
  options.onError?.(new Error('OpenAI TTS integration not yet configured. Add API key in settings.'));
}
