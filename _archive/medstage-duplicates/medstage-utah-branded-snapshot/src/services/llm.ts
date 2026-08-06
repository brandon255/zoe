// MedStage — LLM Service
// OpenAI-compatible chat completions API. Works with:
//   - Local Ollama (http://localhost:11434/v1) — Hermes, Llama, Mistral, etc.
//   - Local LM Studio (http://localhost:1234/v1)
//   - OpenAI (https://api.openai.com/v1)
//   - Any other OpenAI-compatible endpoint
//
// The LLM receives a system prompt with the full MedStage architecture,
// conversation history, and current scene state. It returns JSON describing
// what action to take and what the patient character should say in response.

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  stream: boolean;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  baseUrl: 'http://localhost:11434/v1',
  model: 'hermes3',
  temperature: 0.7,
  maxTokens: 512,
  stream: true,
  systemPrompt: '', // filled at runtime from HERMES_SYSTEM_PROMPT.md
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PatientAction {
  type:
    | 'none'
    | 'rotate_camera'
    | 'zoom_camera'
    | 'reset_camera'
    | 'show_layer'
    | 'hide_layer'
    | 'toggle_layer'
    | 'isolate_layer'
    | 'remove_object'
    | 'attach_object'
    | 'animate_character'
    | 'switch_patient'
    | 'narrate';
  params?: Record<string, any>;
  /** What the patient character says in response. Always include this. */
  dialogue: string;
  /** Optional emotion for the dialogue delivery */
  emotion?: 'neutral' | 'happy' | 'concerned' | 'pain' | 'amused' | 'thoughtful';
}

export interface LLMStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

interface ChatCompletionChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string;
  }>;
}

const buildRequestBody = (
  config: LLMConfig,
  messages: ChatMessage[]
): Record<string, any> => ({
  model: config.model,
  messages,
  temperature: config.temperature,
  max_tokens: config.maxTokens,
  stream: config.stream,
});

const getHeaders = (config: LLMConfig): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
};

/**
 * Test if the LLM endpoint is reachable.
 * Returns null on success, error message string on failure.
 */
export async function testLLMConnection(config: LLMConfig): Promise<string | null> {
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      method: 'GET',
      headers: getHeaders(config),
    });
    if (!response.ok) {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : 'Connection failed';
  }
}

/**
 * Stream a chat completion. Calls onToken for each chunk, onComplete when done.
 */
export async function streamChatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  callbacks: LLMStreamCallbacks
): Promise<void> {
  const url = `${config.baseUrl}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify(buildRequestBody(config, messages)),
    });
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!response.ok) {
    const text = await response.text();
    callbacks.onError(new Error(`LLM request failed: ${response.status} — ${text}`));
    return;
  }

  if (!response.body) {
    callbacks.onError(new Error('No response body'));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE format: lines starting with "data: " separated by newlines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed: ChatCompletionChunk = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  callbacks.onComplete(fullText);
}

/**
 * Parse the LLM's response text into a structured PatientAction.
 * Expects JSON in a code fence, but falls back to treating the whole text as dialogue.
 */
export function parsePatientResponse(text: string): PatientAction {
  // Try to extract JSON from a code fence
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        type: parsed.type || 'none',
        params: parsed.params || {},
        dialogue: parsed.dialogue || text.replace(/```[\s\S]*?```/g, '').trim(),
        emotion: parsed.emotion || 'neutral',
      };
    } catch {
      // fall through
    }
  }

  // Try parsing the whole thing as JSON
  try {
    const parsed = JSON.parse(text);
    if (parsed.dialogue || parsed.type) {
      return {
        type: parsed.type || 'none',
        params: parsed.params || {},
        dialogue: parsed.dialogue || text,
        emotion: parsed.emotion || 'neutral',
      };
    }
  } catch {
    // not JSON
  }

  // Fallback: treat the whole response as dialogue
  return {
    type: 'none',
    dialogue: text.trim(),
    emotion: 'neutral',
  };
}

/**
 * Build a context-aware system prompt that includes current scene state.
 */
export function buildSystemPrompt(
  baseSystemPrompt: string,
  sceneContext: {
    visibleLayers: string[];
    currentRotation: { y: number; x: number };
    zoomLevel: number;
    attachedObjects: string[];
    recentCommands: string[];
  },
  patientContext?: {
    name: string;
    age: number;
    sex: 'male' | 'female';
    pronouns: { subject: string; object: string; possessive: string };
    background: string;
    voice: string;
  }
): string {
  const patientBlock = patientContext
    ? `
[CURRENT PATIENT]
Name: ${patientContext.name}
Age: ${patientContext.age}
Sex: ${patientContext.sex}
Pronouns: ${patientContext.pronouns.subject}/${patientContext.pronouns.object}/${patientContext.pronouns.possessive}
Background: ${patientContext.background}
Voice: ${patientContext.voice}

You ARE ${patientContext.name}. Speak as ${patientContext.name}, using ${patientContext.pronouns.subject}/${patientContext.pronouns.object}/${patientContext.pronouns.possessive} pronouns. Refer to yourself in first person.
`
    : '';

  const contextBlock = `
${patientBlock}
[CURRENT SCENE STATE]
Visible anatomical layers: ${sceneContext.visibleLayers.join(', ') || 'none'}
Model rotation: yaw=${sceneContext.currentRotation.y.toFixed(2)}rad, pitch=${sceneContext.currentRotation.x.toFixed(2)}rad
Zoom distance: ${sceneContext.zoomLevel.toFixed(2)}
Attached objects on patient: ${sceneContext.attachedObjects.join(', ') || 'none'}
Recent voice commands: ${sceneContext.recentCommands.join(' | ') || 'none'}

[INSTRUCTIONS]
When the user speaks, return a JSON object describing the action to take and the patient's response.
Format:
\`\`\`json
{
  "type": "rotate_camera" | "zoom_camera" | "reset_camera" | "show_layer" | "hide_layer" | "toggle_layer" | "isolate_layer" | "remove_object" | "attach_object" | "animate_character" | "switch_patient" | "narrate" | "none",
  "params": { /* type-specific */ },
  "dialogue": "What the patient says in response (1-2 sentences, natural, in-character)",
  "emotion": "neutral" | "happy" | "concerned" | "pain" | "amused" | "thoughtful"
}
\`\`\`
Always include a "dialogue" field. Speak naturally in character. Keep dialogue short (1-2 sentences). The action should match what the user asked for; if the request is unclear, set type to "none" and ask a clarifying question in dialogue.
`;

  return baseSystemPrompt + '\n\n' + contextBlock;
}
