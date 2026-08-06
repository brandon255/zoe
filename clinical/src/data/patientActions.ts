// MedStage — Patient action catalog
// Maps LLM-returned actions to scene mutations.
// Add new actions here, then update the HERMES_SYSTEM_PROMPT.md to expose them.

import type { PatientAction } from '../services/llm';
import type { LayerId } from '../types';

export type ActionContext = {
  // Scene state setters
  setModelRotationY: (updater: (prev: number) => number) => void;
  setModelRotationX: (updater: (prev: number) => number) => void;
  setCameraDistance: (updater: (prev: number) => number) => void;
  setIdleRotate: (idle: boolean) => void;
  setLayers: (updater: (prev: Record<LayerId, boolean>) => Record<LayerId, boolean>) => void;
  // Prop state
  setAttachedObjects: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  // Animation triggers
  triggerAnimation: (name: PatientAnimation, durationMs?: number) => void;
  setCurrentAnimation: (name: PatientAnimation) => void;
  // Figure switching
  setFigureId: (id: string) => void;
};

export type PatientAnimation =
  | 'idle'
  | 'nod'
  | 'shake_head'
  | 'wave'
  | 'breathe_deep'
  | 'look_around'
  | 'lie_down'
  | 'sit_up';

const LAYER_MAP: Record<string, LayerId> = {
  skin: 'skin',
  surface: 'skin',
  skeletal: 'skeletal',
  skeleton: 'skeletal',
  bone: 'skeletal',
  bones: 'skeletal',
  muscular: 'muscular',
  muscle: 'muscular',
  muscles: 'muscular',
  vascular: 'vascular',
  vessels: 'vascular',
  blood: 'vascular',
  circulation: 'vascular',
  nervous: 'nervous',
  nerve: 'nervous',
  nerves: 'nervous',
  brain: 'brain',
  cerebrum: 'brain',
  cerebellum: 'brain',
  head: 'brain',
  foot: 'foot_bones',
  feet: 'foot_bones',
  foot_bones: 'foot_bones',
  pelvis: 'pelvis',
  pelvic: 'pelvis',
  sacrum: 'pelvis',
  coccyx: 'pelvis',
  hip: 'pelvis',
  hips: 'pelvis',
  organs: 'organs',
  organ: 'organs',
  heart: 'organs',
  lung: 'organs',
  lungs: 'organs',
  liver: 'organs',
  kidney: 'organs',
  kidneys: 'organs',
};

const VALID_OBJECTS = new Set(['glasses', 'stethoscope', 'gown', 'sandwich', 'clipboard', 'watch', 'mask']);

const VALID_ANIMATIONS: PatientAnimation[] = [
  'idle',
  'nod',
  'shake_head',
  'wave',
  'breathe_deep',
  'look_around',
  'lie_down',
  'sit_up',
];

/**
 * Apply a PatientAction to the scene. Returns a brief description
 * of what was applied (for logging / debugging).
 */
export function applyPatientAction(
  action: PatientAction,
  ctx: ActionContext,
  attachedObjects: Record<string, boolean>
): string {
  const { type, params = {} } = action;

  switch (type) {
    case 'none':
      return 'no scene change';

    case 'rotate_camera': {
      const direction = params.direction || 'right';
      const amount = (params.amount ?? 0.6) * (Math.PI / 6);
      ctx.setIdleRotate(false);
      if (direction === 'left') {
        ctx.setModelRotationY((r) => r - amount);
      } else if (direction === 'right') {
        ctx.setModelRotationY((r) => r + amount);
      } else if (direction === 'up') {
        ctx.setModelRotationX((r) => Math.max(-0.5, r - amount * 0.5));
      } else if (direction === 'down') {
        ctx.setModelRotationX((r) => Math.min(0.5, r + amount * 0.5));
      }
      return `rotated ${direction}`;
    }

    case 'zoom_camera': {
      const direction = params.direction || 'in';
      const amount = params.amount ?? 0.5;
      if (direction === 'in') {
        ctx.setCameraDistance((d) => Math.max(1.5, d - amount));
      } else {
        ctx.setCameraDistance((d) => Math.min(8, d + amount));
      }
      return `zoomed ${direction}`;
    }

    case 'reset_camera': {
      ctx.setIdleRotate(true);
      ctx.setModelRotationY(() => 0);
      ctx.setModelRotationX(() => 0);
      ctx.setCameraDistance(() => 3.5);
      return 'reset to default';
    }

    case 'show_layer': {
      const layer = LAYER_MAP[params.layer?.toLowerCase() || ''];
      if (layer) {
        ctx.setLayers((prev) => ({ ...prev, [layer]: true }));
        return `showed ${layer}`;
      }
      return 'invalid layer';
    }

    case 'hide_layer': {
      const layer = LAYER_MAP[params.layer?.toLowerCase() || ''];
      if (layer) {
        ctx.setLayers((prev) => ({ ...prev, [layer]: false }));
        return `hid ${layer}`;
      }
      return 'invalid layer';
    }

    case 'toggle_layer': {
      const layer = LAYER_MAP[params.layer?.toLowerCase() || ''];
      if (layer) {
        ctx.setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
        return `toggled ${layer}`;
      }
      return 'invalid layer';
    }

    case 'isolate_layer': {
      const layer = LAYER_MAP[params.layer?.toLowerCase() || ''];
      if (layer) {
        const allLayers: LayerId[] = ['skin', 'skeletal', 'muscular', 'vascular', 'nervous', 'organs'];
        ctx.setLayers(() =>
          allLayers.reduce(
            (acc, l) => ({ ...acc, [l]: l === layer }),
            {} as Record<LayerId, boolean>
          )
        );
        return `isolated ${layer}`;
      }
      return 'invalid layer';
    }

    case 'remove_object': {
      const obj = (params.object || '').toLowerCase();
      if (!VALID_OBJECTS.has(obj)) {
        return `invalid object: ${obj}`;
      }
      if (!attachedObjects[obj]) {
        return `${obj} is not currently attached`;
      }
      ctx.setAttachedObjects((prev) => ({ ...prev, [obj]: false }));
      return `removed ${obj}`;
    }

    case 'attach_object': {
      const obj = (params.object || '').toLowerCase();
      if (!VALID_OBJECTS.has(obj)) {
        return `invalid object: ${obj}`;
      }
      if (attachedObjects[obj]) {
        return `${obj} is already attached`;
      }
      ctx.setAttachedObjects((prev) => ({ ...prev, [obj]: true }));
      return `attached ${obj}`;
    }

    case 'animate_character': {
      const anim = (params.animation || 'idle') as PatientAnimation;
      if (!VALID_ANIMATIONS.includes(anim)) {
        return `invalid animation: ${anim}`;
      }
      const duration = params.duration_ms || 2000;
      ctx.triggerAnimation(anim, duration);
      return `animated: ${anim}`;
    }

    case 'switch_patient': {
      const figureId = (params.figure_id || '').toLowerCase();
      ctx.setFigureId(figureId);
      return `switched patient to ${figureId}`;
    }

    case 'narrate': {
      // Pure dialogue, no scene change
      return 'narrated';
    }

    default:
      return `unknown action type: ${type}`;
  }
}

export const PATIENT_OBJECTS = Array.from(VALID_OBJECTS);
export const PATIENT_ANIMATIONS = VALID_ANIMATIONS;
