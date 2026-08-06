// MedStage — Layer panel (right side)
// Polished with hover effects, color swatches, and "soon" badges for stub layers.

import type { LayerId } from '../types';
import { ANATOMY_LAYERS } from '../data/anatomyLayers';

interface LayerPanelProps {
  layers: Record<LayerId, boolean>;
  onToggle: (id: LayerId) => void;
}

export function LayerPanel({ layers, onToggle }: LayerPanelProps) {
  return (
    <aside className="layer-panel" aria-label="Anatomical layers">
      <div className="panel-header">
        <div className="panel-title">Anatomical Layers</div>
      </div>
      {ANATOMY_LAYERS.map((layer) => {
        const active = layers[layer.id];
        return (
          <div
            key={layer.id}
            className="layer-row"
            onClick={() => onToggle(layer.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(layer.id);
              }
            }}
          >
            <div className="layer-info">
              <div className="layer-swatch" style={{ background: layer.color }} />
              <div className="layer-name">
                {layer.label}
                {layer.stub && <span className="layer-soon">Soon</span>}
              </div>
            </div>
            <button
              className={`layer-toggle ${active ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggle(layer.id);
              }}
              aria-label={`Toggle ${layer.label}`}
              aria-pressed={active}
            />
          </div>
        );
      })}
      <div className="layer-note">
        The skin layer is live. Skeletal, muscular, vascular, nervous, and organ systems populate after stakeholder sign-off.
      </div>
    </aside>
  );
}
