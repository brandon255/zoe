// MedStage — 3D Mesh Generation Panel
// UI for generating 3D models from images using the configured backend.

import { useState, useEffect, useRef } from 'react';
import {
  generateMesh,
  checkLocalService,
  loadMeshGenConfig,
  saveMeshGenConfig,
  type MeshGenConfig,
  type MeshGenProgress,
} from '../services/meshGen';

interface MeshGenPanelProps {
  visible: boolean;
  images: File[];
  onClose: () => void;
}

export function MeshGenPanel({ visible, images, onClose }: MeshGenPanelProps) {
  const [config, setConfig] = useState<MeshGenConfig>(loadMeshGenConfig);
  const [serviceStatus, setServiceStatus] = useState<{ ok: boolean; info?: any; error?: string } | null>(null);
  const [progress, setProgress] = useState<MeshGenProgress | null>(null);
  const [result, setResult] = useState<{ url: string; durationMs: number; backend: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      checkService();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const checkService = async () => {
    const status = await checkLocalService(config.localUrl);
    setServiceStatus(status);
  };

  const saveConfig = (newConfig: MeshGenConfig) => {
    setConfig(newConfig);
    saveMeshGenConfig(newConfig);
  };

  const handleGenerate = async (image: File) => {
    setIsGenerating(true);
    setProgress({ stage: 'connecting', message: 'Starting...' });
    setResult(null);

    try {
      const r = await generateMesh(image, config, (p) => setProgress(p));
      setResult({
        url: r.url,
        durationMs: r.durationMs,
        backend: r.backend,
      });
      setProgress({ stage: 'complete', message: `Generated in ${(r.durationMs / 1000).toFixed(1)}s` });
    } catch (err) {
      setProgress({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 230,
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
          maxWidth: 600,
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
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)' }}>
              🧊 3D Mesh Generation
            </h2>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Convert patient photos to 3D meshes — open source, self-hosted
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Service status */}
        <div
          style={{
            padding: 14,
            background:
              serviceStatus?.ok
                ? 'rgba(56, 211, 159, 0.08)'
                : serviceStatus === null
                ? 'rgba(94, 110, 133, 0.08)'
                : 'rgba(255, 92, 92, 0.08)',
            border: `1px solid ${
              serviceStatus?.ok
                ? 'var(--color-accent)'
                : serviceStatus === null
                ? 'var(--color-border)'
                : 'var(--color-error)'
            }`,
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 12.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {config.backend === 'local' ? '🖥️  Local Service' : config.backend === 'huggingface' ? '🤗 Hugging Face' : '🎭 Demo Mode'}
                {' — '}
                <span style={{ color: serviceStatus?.ok ? 'var(--color-accent)' : serviceStatus === null ? 'var(--color-text-muted)' : 'var(--color-error)' }}>
                  {serviceStatus?.ok
                    ? 'Connected'
                    : serviceStatus === null
                    ? 'Checking...'
                    : 'Not reachable'}
                </span>
              </div>
              {serviceStatus?.info && (
                <div style={{ marginTop: 4, color: 'var(--color-text-muted)', fontSize: 11 }}>
                  Model: {serviceStatus.info.model_name || 'not loaded'} · Device: {serviceStatus.info.device || 'unknown'}
                </div>
              )}
              {serviceStatus?.error && (
                <div style={{ marginTop: 4, color: 'var(--color-text-muted)', fontSize: 11 }}>
                  {serviceStatus.error}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={checkService}
                style={{
                  padding: '5px 10px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                Re-check
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '5px 10px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                }}
              >
                Settings
              </button>
            </div>
          </div>

          {showSettings && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Backend
                </label>
                <select
                  value={config.backend}
                  onChange={(e) => saveConfig({ ...config, backend: e.target.value as any })}
                  className="settings-input"
                  style={{ marginTop: 4 }}
                >
                  <option value="local">Local Python service (recommended)</option>
                  <option value="huggingface">Hugging Face Inference API</option>
                  <option value="demo">Demo (no actual generation)</option>
                </select>
              </div>
              {config.backend === 'local' && (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                    Service URL
                  </label>
                  <input
                    type="text"
                    value={config.localUrl}
                    onChange={(e) => saveConfig({ ...config, localUrl: e.target.value })}
                    className="settings-input"
                    style={{ marginTop: 4 }}
                    placeholder="http://localhost:7860"
                  />
                </div>
              )}
              {config.backend === 'huggingface' && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      HF Model
                    </label>
                    <input
                      type="text"
                      value={config.hfModel}
                      onChange={(e) => saveConfig({ ...config, hfModel: e.target.value })}
                      className="settings-input"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      HF Token
                    </label>
                    <input
                      type="password"
                      value={config.hfToken}
                      onChange={(e) => saveConfig({ ...config, hfToken: e.target.value })}
                      className="settings-input"
                      style={{ marginTop: 4 }}
                      placeholder="hf_..."
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Setup instructions if local service not reachable */}
        {config.backend === 'local' && !serviceStatus?.ok && serviceStatus !== null && (
          <div
            style={{
              padding: 14,
              background: 'rgba(90, 158, 255, 0.08)',
              borderLeft: '2px solid var(--color-info)',
              borderRadius: '0 6px 6px 0',
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--color-info)', marginBottom: 6 }}>
              🐍 Start the self-hosted service:
            </div>
            <pre
              style={{
                background: 'var(--color-bg)',
                padding: 10,
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                overflow: 'auto',
                marginBottom: 8,
                color: 'var(--color-text)',
              }}
            >
{`cd medstage/python
docker build -t medstage-meshgen .
docker run -p 7860:7860 --gpus all medstage-meshgen`}
            </pre>
            <div>Or without Docker:</div>
            <pre
              style={{
                background: 'var(--color-bg)',
                padding: 10,
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                overflow: 'auto',
                marginTop: 6,
                color: 'var(--color-text)',
              }}
            >
{`cd medstage/python
pip install -r requirements.txt
pip install git+https://github.com/VAST-AI-Research/TripoSR.git
python serve.py`}
            </pre>
            <div style={{ marginTop: 8 }}>
              <strong>TripoSR</strong> is open source (MIT). The first build takes ~10 min (downloads model). Runs on GPU or CPU. See <code>python/README.md</code> for details.
            </div>
          </div>
        )}

        {/* Image upload + generate */}
        {images.length === 0 ? (
          <div
            style={{
              padding: 32,
              border: '2px dashed var(--color-border)',
              borderRadius: 12,
              textAlign: 'center',
              background: 'rgba(94, 110, 133, 0.04)',
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Upload one or more patient photos
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  // Open file input isn't connected to parent; show inline below
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 10.5, color: 'var(--color-text-dim)', marginTop: 12, lineHeight: 1.5 }}>
              For best results: object centered, fill 70%+ of frame, plain background.<br />
              Single image: TripoSR. Multiple images: combine in the chat.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {images.map((file, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)' }}>
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  onClick={() => handleGenerate(file)}
                  disabled={isGenerating}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    opacity: isGenerating ? 0.5 : 1,
                  }}
                >
                  {isGenerating ? 'Generating…' : 'Generate 3D'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>{progress.message}</span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color:
                    progress.stage === 'error'
                      ? 'var(--color-error)'
                      : progress.stage === 'complete'
                      ? 'var(--color-accent)'
                      : 'var(--color-info)',
                }}
              >
                {progress.stage}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--color-border)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background:
                    progress.stage === 'error'
                      ? 'var(--color-error)'
                      : progress.stage === 'complete'
                      ? 'var(--color-accent)'
                      : 'var(--color-info)',
                  width:
                    progress.stage === 'complete' || progress.stage === 'error'
                      ? '100%'
                      : progress.stage === 'connecting'
                      ? '20%'
                      : progress.stage === 'uploading'
                      ? '40%'
                      : progress.stage === 'processing'
                      ? '70%'
                      : progress.stage === 'downloading'
                      ? '90%'
                      : '0%',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'rgba(56, 211, 159, 0.08)',
              border: '1px solid var(--color-accent)',
              borderRadius: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                Mesh generated in {(result.durationMs / 1000).toFixed(1)}s via {result.backend}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={result.url}
                download="mesh.glb"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Download .glb
              </a>
              <a
                href={`https://gltf-viewer.donmccurdy.com/?url=${encodeURIComponent(result.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  border: '1px solid var(--color-border)',
                }}
              >
                View in browser
              </a>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              💡 The .glb file can be viewed in any 3D viewer, imported into Blender, or used as a custom patient model in MedStage.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
