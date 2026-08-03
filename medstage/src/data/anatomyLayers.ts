// MedStage — anatomical layer definitions
// For the sign-off prototype, only the "skin" layer is fully implemented.
// All other layers are stubs that will be filled in post sign-off.

import type { Layer } from '../types';

export const ANATOMY_LAYERS: Layer[] = [
  {
    id: 'skin',
    label: 'Skin / Surface',
    description: 'Integumentary system — epidermis, dermis, surface anatomy',
    color: '#e8c4a0',
    defaultVisible: true,
  },
  {
    id: 'skeletal',
    label: 'Skeletal System',
    description: '206 bones of the human skeleton',
    color: '#f0e8d8',
    defaultVisible: false,
  },
  {
    id: 'muscular',
    label: 'Muscular System',
    description: '650+ skeletal muscles',
    color: '#c9485b',
    defaultVisible: false,
    stub: true,
  },
  {
    id: 'vascular',
    label: 'Vascular System',
    description: 'Arteries, veins, capillaries',
    color: '#5a9eff',
    defaultVisible: false,
    stub: true,
  },
  {
    id: 'nervous',
    label: 'Nervous System',
    description: 'Central + peripheral nervous system',
    color: '#ffd93d',
    defaultVisible: false,
    stub: true,
  },
  {
    id: 'brain',
    label: 'Brain',
    description: 'Cerebrum, cerebellum, brainstem — for neurosurgery',
    color: '#e8a8a8',
    defaultVisible: false,
  },
  {
    id: 'foot_bones',
    label: 'Foot Bones',
    description: '26 bones of the foot — for podiatry/orthopedics',
    color: '#e8d8a8',
    defaultVisible: false,
  },
  {
    id: 'pelvis',
    label: 'Bony Pelvis',
    description: 'Ilium, ischium, pubis, sacrum — for proctology/gynecology',
    color: '#d4c8a8',
    defaultVisible: false,
  },
  {
    id: 'organs',
    label: 'Internal Organs',
    description: 'Heart, lungs, liver, kidneys, GI tract',
    color: '#8b6f9e',
    defaultVisible: false,
    stub: true,
  },
];

export const getDefaultLayerState = (): Record<string, boolean> => {
  const state: Record<string, boolean> = {};
  ANATOMY_LAYERS.forEach((l) => {
    state[l.id] = l.defaultVisible;
  });
  return state;
};
