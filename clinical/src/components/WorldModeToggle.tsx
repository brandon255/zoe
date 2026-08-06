// MedStage — Clinical ↔ Pizarro world toggle

import type { WorldMode } from '../data/worldMode';
import { worldModeLabel } from '../data/worldMode';

interface WorldModeToggleProps {
  mode: WorldMode;
  onChange: (mode: WorldMode) => void;
}

export function WorldModeToggle({ mode, onChange }: WorldModeToggleProps) {
  const isPizarro = mode === 'pizarro';

  return (
    <div
      className={`world-mode-toggle ${isPizarro ? 'pizarro' : 'clinical'}`}
      role="group"
      aria-label="World mode"
    >
      <button
        type="button"
        className={!isPizarro ? 'active' : ''}
        onClick={() => onChange('clinical')}
        title="Clinical Zoe — guardrails on, medical training"
      >
        Clinical
      </button>
      <button
        type="button"
        className={isPizarro ? 'active' : ''}
        onClick={() => onChange('pizarro')}
        title="Pizarro Zoe — red-team wild west (no minors, no violence)"
      >
        Pizarro
      </button>
      <span className="world-mode-hint">
        {isPizarro ? 'Red team · rails: no minors · no violence' : worldModeLabel(mode)}
      </span>
    </div>
  );
}
