// Zoe anatomy atlas — prebaked clinical views (instant swap, not live gen)

export type AtlasSlotId =
  | 'full-front'
  | 'full-back'
  | 'full-side'
  | 'lithotomy'
  | 'abdomen-close'
  | 'pelvis-external'
  | 'cervix-speculum'
  | 'husband-beside';

export interface AtlasSlot {
  id: AtlasSlotId;
  label: string;
  /** Path under public/ (Vite) */
  src: string;
  clinicalNote: string;
}

export const ATLAS_SLOTS: AtlasSlot[] = [
  {
    id: 'full-front',
    label: 'Full front',
    src: '/zoe-atlas/full-front.png',
    clinicalNote: 'Standing / seated overview — anterior',
  },
  {
    id: 'full-back',
    label: 'Full back',
    src: '/zoe-atlas/full-back.png',
    clinicalNote: 'Posterior overview',
  },
  {
    id: 'full-side',
    label: 'Full side',
    src: '/zoe-atlas/full-side.png',
    clinicalNote: 'Lateral overview',
  },
  {
    id: 'lithotomy',
    label: 'Lithotomy',
    src: '/zoe-atlas/lithotomy.png',
    clinicalNote: 'Exam table / stirrups positioning',
  },
  {
    id: 'abdomen-close',
    label: 'Abdomen',
    src: '/zoe-atlas/abdomen-close.png',
    clinicalNote: 'Abdominal region focus',
  },
  {
    id: 'pelvis-external',
    label: 'External pelvis',
    src: '/zoe-atlas/pelvis-external.png',
    clinicalNote: 'External pelvic exam view',
  },
  {
    id: 'cervix-speculum',
    label: 'Speculum / cervix',
    src: '/zoe-atlas/cervix-speculum.png',
    clinicalNote: 'Speculum insertion / cervical inspection (add clinical still when ready)',
  },
  {
    id: 'husband-beside',
    label: 'Partner present',
    src: '/zoe-atlas/husband-beside.png',
    clinicalNote: 'Supportive partner — clinical, non-sensual',
  },
];

export const getAtlasSlot = (id: AtlasSlotId): AtlasSlot | undefined =>
  ATLAS_SLOTS.find((s) => s.id === id);

/** Map encounter phase → default atlas view */
export const atlasSlotForPhase = (phase: string): AtlasSlotId => {
  const map: Record<string, AtlasSlotId> = {
    'pre-encounter': 'full-front',
    history: 'full-front',
    'review of systems': 'full-front',
    positioning: 'lithotomy',
    'external exam': 'pelvis-external',
    'speculum exam': 'cervix-speculum',
    'bimanual exam': 'pelvis-external',
    findings: 'full-front',
    'plan and counseling': 'full-front',
    closing: 'full-front',
  };
  return map[phase] ?? 'full-front';
};
