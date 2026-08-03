// MedStage — 3D Mesh Generation Service (frontend)
// Talks to the self-hosted Python service (default: http://localhost:7860)
// or to the Hugging Face Inference API as a fallback.
//
// The Python service is the recommended path — it's free, fast, MIT-licensed,
// and runs entirely on your machine. See ../python/README.md for setup.

export type MeshGenBackend = 'local' | 'huggingface' | 'demo';

export interface MeshGenConfig {
  backend: MeshGenBackend;
  /** URL of the local Python service (default: http://localhost:7860) */
  localUrl: string;
  /** Hugging Face token for the inference API fallback */
  hfToken: string;
  /** Hugging Face model ID (default: stabilityai/TripoSR) */
  hfModel: string;
}

export const DEFAULT_MESHGEN_CONFIG: MeshGenConfig = {
  backend: 'local',
  localUrl: 'http://localhost:7860',
  hfToken: '',
  hfModel: 'stabilityai/TripoSR',
};

const STORAGE_KEY = 'medstage:meshgen-config';

export function loadMeshGenConfig(): MeshGenConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_MESHGEN_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    /* noop */
  }
  return DEFAULT_MESHGEN_CONFIG;
}

export function saveMeshGenConfig(config: MeshGenConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* noop */
  }
}

export interface MeshGenResult {
  /** The GLB blob */
  blob: Blob;
  /** A URL to display the blob (revoke when done) */
  url: string;
  /** Time taken in milliseconds */
  durationMs: number;
  /** The backend that was used */
  backend: MeshGenBackend;
}

export interface MeshGenProgress {
  stage: 'connecting' | 'uploading' | 'processing' | 'downloading' | 'complete' | 'error';
  message: string;
  percent?: number;
}

/**
 * Check if the local Python service is reachable.
 */
export async function checkLocalService(url: string): Promise<{ ok: boolean; info?: any; error?: string }> {
  try {
    const response = await fetch(`${url}/health`, { method: 'GET' });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const info = await response.json();
    return { ok: true, info };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

/**
 * Generate a 3D mesh from an image using the configured backend.
 */
export async function generateMesh(
  image: File | Blob,
  config: MeshGenConfig,
  onProgress?: (progress: MeshGenProgress) => void
): Promise<MeshGenResult> {
  const startTime = Date.now();

  if (config.backend === 'local') {
    return generateLocal(image, config, onProgress, startTime);
  }
  if (config.backend === 'huggingface') {
    return generateHuggingFace(image, config, onProgress, startTime);
  }
  // demo mode — just returns the image back as a "mesh" for testing
  return generateDemo(image, onProgress, startTime);
}

async function generateLocal(
  image: File | Blob,
  config: MeshGenConfig,
  onProgress: ((p: MeshGenProgress) => void) | undefined,
  startTime: number
): Promise<MeshGenResult> {
  onProgress?.({ stage: 'connecting', message: 'Connecting to local service...' });

  const formData = new FormData();
  formData.append('image', image);
  formData.append('model', 'triposr');

  onProgress?.({ stage: 'uploading', message: 'Uploading image...' });

  const response = await fetch(`${config.localUrl}/api/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    onProgress?.({ stage: 'error', message: `Service error: ${err}` });
    throw new Error(`Local service error: ${err}`);
  }

  onProgress?.({ stage: 'downloading', message: 'Receiving mesh...' });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  onProgress?.({ stage: 'complete', message: 'Mesh generated' });

  return {
    blob,
    url,
    durationMs: Date.now() - startTime,
    backend: 'local',
  };
}

async function generateHuggingFace(
  image: File | Blob,
  config: MeshGenConfig,
  onProgress: ((p: MeshGenProgress) => void) | undefined,
  startTime: number
): Promise<MeshGenResult> {
  onProgress?.({ stage: 'connecting', message: 'Connecting to Hugging Face...' });

  if (!config.hfToken) {
    throw new Error('Hugging Face token required for HF backend. Add one in settings.');
  }

  // Convert image to base64
  const base64 = await blobToBase64(image);

  onProgress?.({ stage: 'processing', message: 'Generating mesh via HF Inference API...' });

  // Note: TripoSR isn't directly on the HF Inference API as of writing.
  // The recommended path is to use the Space via Gradio client, or to use
  // a model that IS on the Inference API. For the prototype, this is a
  // scaffold showing the API call pattern.
  const response = await fetch(`https://api-inference.huggingface.co/models/${config.hfModel}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: base64,
      parameters: {},
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    onProgress?.({ stage: 'error', message: `HF error: ${err}` });
    throw new Error(`HF Inference API error: ${err}`);
  }

  onProgress?.({ stage: 'downloading', message: 'Receiving mesh...' });

  // HF returns binary GLB directly
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  onProgress?.({ stage: 'complete', message: 'Mesh generated via HF' });

  return {
    blob,
    url,
    durationMs: Date.now() - startTime,
    backend: 'huggingface',
  };
}

async function generateDemo(
  image: File | Blob,
  onProgress: ((p: MeshGenProgress) => void) | undefined,
  startTime: number
): Promise<MeshGenResult> {
  onProgress?.({ stage: 'processing', message: 'Demo mode — returning image as placeholder...' });
  await new Promise((r) => setTimeout(r, 1000));
  const blob = new Blob([await image.arrayBuffer()], { type: image.type || 'image/jpeg' });
  const url = URL.createObjectURL(blob);
  onProgress?.({ stage: 'complete', message: 'Demo mesh ready' });
  return { blob, url, durationMs: Date.now() - startTime, backend: 'demo' };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get pure base64
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
