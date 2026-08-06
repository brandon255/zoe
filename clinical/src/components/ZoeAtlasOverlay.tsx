// MedStage — Zoe atlas overlay
// Instant clinical stills beside / over the 3D stage. Falls back quietly if a file is missing.

import { useState } from 'react';
import { ATLAS_SLOTS, type AtlasSlotId, getAtlasSlot } from '../data/zoeAtlas';

interface ZoeAtlasOverlayProps {
  activeSlot: AtlasSlotId;
  visible: boolean;
  husbandPresent?: boolean;
  onSelectSlot?: (id: AtlasSlotId) => void;
}

export function ZoeAtlasOverlay({
  activeSlot,
  visible,
  husbandPresent = false,
  onSelectSlot,
}: ZoeAtlasOverlayProps) {
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  if (!visible) return null;

  const slot = getAtlasSlot(activeSlot);
  const showHusband = husbandPresent && !broken['husband-beside'];
  const primarySrc = slot && !broken[slot.id] ? slot.src : null;

  return (
    <div className="zoe-atlas-overlay" aria-label="Zoe anatomy atlas">
      <div className="zoe-atlas-header">
        <span className="zoe-atlas-title">Zoe atlas</span>
        <span className="zoe-atlas-slot-label">{slot?.label ?? 'View'}</span>
      </div>

      <div className="zoe-atlas-stage">
        {primarySrc ? (
          <img
            key={slot!.id}
            className="zoe-atlas-image"
            src={primarySrc}
            alt={slot!.clinicalNote}
            onError={() => setBroken((b) => ({ ...b, [slot!.id]: true }))}
          />
        ) : (
          <div className="zoe-atlas-fallback">
            Atlas still pending for this slot — using 3D stage.
            <div className="zoe-atlas-fallback-hint">{slot?.clinicalNote}</div>
          </div>
        )}
        {showHusband && (
          <img
            className="zoe-atlas-husband"
            src="/zoe-atlas/husband-beside.png"
            alt="Supportive partner present"
            onError={() => setBroken((b) => ({ ...b, 'husband-beside': true }))}
          />
        )}
      </div>

      <div className="zoe-atlas-thumbs" role="tablist">
        {ATLAS_SLOTS.filter((s) => s.id !== 'husband-beside').map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === activeSlot}
            className={`zoe-atlas-thumb ${s.id === activeSlot ? 'active' : ''}`}
            title={s.clinicalNote}
            onClick={() => onSelectSlot?.(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
