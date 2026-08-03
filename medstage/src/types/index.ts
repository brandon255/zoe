// MedStage — shared type definitions

export type LayerId = 'skin' | 'skeletal' | 'muscular' | 'vascular' | 'nervous' | 'organs' | 'brain' | 'foot_bones' | 'pelvis';

export interface Layer {
  id: LayerId;
  label: string;
  description: string;
  color: string;
  defaultVisible: boolean;
  /** When true, layer exists as a stub for future anatomical content */
  stub?: boolean;
}

export type VoiceIntent =
  | { kind: 'rotate'; direction: 'left' | 'right' | 'up' | 'down'; amount?: number }
  | { kind: 'zoom'; direction: 'in' | 'out'; amount?: number }
  | { kind: 'reset' }
  | { kind: 'showLayer'; layer: LayerId }
  | { kind: 'hideLayer'; layer: LayerId }
  | { kind: 'toggleLayer'; layer: LayerId }
  | { kind: 'isolateLayer'; layer: LayerId }
  | { kind: 'isolatePart'; part: string }
  | { kind: 'showAll' }
  | { kind: 'hideAll' }
  | { kind: 'switchPatient'; figureId: string }
  | { kind: 'loadCase'; caseId: string }
  | { kind: 'nextCase' }
  | { kind: 'shaveHead' }
  | { kind: 'growHair' }
  | { kind: 'endoscope'; view: 'vaginal' | 'rectal' }
  | { kind: 'exitEndoscope' }
  | { kind: 'insertForeignBody'; object: 'cucumber' | 'forceps' | 'thermometer' }
  | { kind: 'removeForeignBody' }
  | { kind: 'help' }
  | { kind: 'unknown'; transcript: string };

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'error';

export interface AnatomyModelProps {
  layers: Record<LayerId, boolean>;
  onIsolatePart?: (partId: string) => void;
}
