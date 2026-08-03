// MedStage — voice intent parser
// Maps natural language transcripts to structured intents.
// Designed to be tolerant of phrasing variations and easy to extend.

import type { VoiceIntent, LayerId } from '../types';

const LAYER_ALIASES: Record<string, LayerId> = {
  skin: 'skin',
  surface: 'skin',
  epidermis: 'skin',
  dermis: 'skin',
  skeleton: 'skeletal',
  skeletal: 'skeletal',
  bone: 'skeletal',
  bones: 'skeletal',
  muscle: 'muscular',
  muscles: 'muscular',
  muscular: 'muscular',
  vascular: 'vascular',
  vessels: 'vascular',
  artery: 'vascular',
  arteries: 'vascular',
  vein: 'vascular',
  veins: 'vascular',
  blood: 'vascular',
  circulation: 'vascular',
  nerve: 'nervous',
  nerves: 'nervous',
  nervous: 'nervous',
  organ: 'organs',
  organs: 'organs',
  heart: 'organs',
  lung: 'organs',
  lungs: 'organs',
  liver: 'organs',
  kidney: 'organs',
  kidneys: 'organs',
  stomach: 'organs',
  brain: 'organs',
  intestine: 'organs',
};

const PART_ALIASES: Record<string, string> = {
  // Maps common terms to anatomy part IDs in Z-Anatomy / FMA naming
  heart: 'heart',
  'brachial plexus': 'brachial_plexus',
  femur: 'femur',
  'left kidney': 'kidney_left',
  'right kidney': 'kidney_right',
  liver: 'liver',
  'left lung': 'lung_left',
  'right lung': 'lung_right',
  brain: 'brain',
  spine: 'vertebral_column',
  pelvis: 'pelvis',
};

const matchAny = (text: string, patterns: string[]): boolean => {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
};

const findLayerInTranscript = (text: string): LayerId | undefined => {
  const lower = text.toLowerCase();
  // Check for multi-word phrases first, then single words
  const sortedKeys = Object.keys(LAYER_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedKeys) {
    if (lower.includes(alias)) {
      return LAYER_ALIASES[alias];
    }
  }
  return undefined;
};

const findPartInTranscript = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  const sortedKeys = Object.keys(PART_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedKeys) {
    if (lower.includes(alias)) {
      return PART_ALIASES[alias];
    }
  }
  return undefined;
};

export const parseIntent = (transcript: string): VoiceIntent => {
  const text = transcript.trim().toLowerCase();
  if (!text) {
    return { kind: 'unknown', transcript };
  }

  // Reset / home
  if (matchAny(text, ['reset', 'reset view', 'home', 'center', 'recenter', 'recenter view'])) {
    return { kind: 'reset' };
  }

  // Help
  if (matchAny(text, ['help', 'what can i say', 'commands', 'options'])) {
    return { kind: 'help' };
  }

  // Show all / hide all
  if (matchAny(text, ['show all', 'show everything', 'all layers on', 'show all layers'])) {
    return { kind: 'showAll' };
  }
  if (matchAny(text, ['hide all', 'hide everything', 'all layers off', 'hide all layers'])) {
    return { kind: 'hideAll' };
  }

  // Switch patient
  if (matchAny(text, ['switch patient', 'change patient', 'next patient', 'switch to', 'change to'])) {
    if (matchAny(text, ['james', 'male', 'man', 'guy', '45', 'male patient', 'male-45'])) {
      return { kind: 'switchPatient', figureId: 'male-45-fit' };
    }
    if (matchAny(text, ['sarah', 'female', 'woman', 'lady', '40', '42', 'female patient', 'female-42'])) {
      return { kind: 'switchPatient', figureId: 'female-42-fit' };
    }
  }

  // Load case
  if (matchAny(text, ['load case', 'open case', 'show case', 'load the case', 'show me the case', 'load patient', 'open patient'])) {
    // Try to match a case by name
    if (matchAny(text, ['head injury', 'mvc', 'motor vehicle'])) {
      return { kind: 'loadCase', caseId: 'head-injury-mvc' };
    }
    if (matchAny(text, ['lower back', 'back pain', 'office worker', 'lbp'])) {
      return { kind: 'loadCase', caseId: 'lower-back-pain-office-worker' };
    }
    if (matchAny(text, ['achilles', 'heel', 'runner'])) {
      return { kind: 'loadCase', caseId: 'achilles-tendinopathy-runner' };
    }
    if (matchAny(text, ['rectal', 'bleeding', 'colon'])) {
      return { kind: 'loadCase', caseId: 'rectal-bleeding-eval' };
    }
    if (matchAny(text, ['annual', 'wellness', 'well woman', 'well-woman', 'gyn'])) {
      return { kind: 'loadCase', caseId: 'annual-gyn-exam' };
    }
    if (matchAny(text, ['pediatric', 'child', 'monkey bars', 'wrist injury'])) {
      return { kind: 'loadCase', caseId: 'pediatric-fall' };
    }
    // Try to match by number
    const numMatch = text.match(/case\s*(\d+)/i);
    if (numMatch) {
      const cases = ['head-injury-mvc', 'lower-back-pain-office-worker', 'achilles-tendinopathy-runner', 'rectal-bleeding-eval', 'annual-gyn-exam', 'pediatric-fall'];
      const idx = parseInt(numMatch[1]) - 1;
      if (cases[idx]) {
        return { kind: 'loadCase', caseId: cases[idx] };
      }
    }
  }

  // Next case
  if (matchAny(text, ['next case', 'next patient'])) {
    return { kind: 'nextCase' };
  }

  // Shave head
  if (matchAny(text, ['shave', 'shave head', 'shave his head', 'shave her head', 'shave the head', 'buzz cut', 'shave it off'])) {
    return { kind: 'shaveHead' };
  }
  if (matchAny(text, ['grow hair', 'let hair grow', 'restore hair', 'hair back', 'unshave'])) {
    return { kind: 'growHair' };
  }

  // Endoscope
  if (matchAny(text, ['enter', 'go inside', 'view inside', 'endoscope', 'use endoscope', 'look inside'])) {
    if (matchAny(text, ['vaginal', 'vagina', 'birth canal', 'canal'])) {
      return { kind: 'endoscope', view: 'vaginal' };
    }
    if (matchAny(text, ['rectal', 'rectum', 'anus', 'colon', 'rectum', 'anal'])) {
      return { kind: 'endoscope', view: 'rectal' };
    }
  }
  if (matchAny(text, ['exit', 'exit canal', 'back out', 'pull out', 'exit endoscope', 'exit view'])) {
    return { kind: 'exitEndoscope' };
  }

  // Foreign body
  if (matchAny(text, ['insert', 'place', 'put in', 'add', 'drop in'])) {
    if (matchAny(text, ['cucumber', 'vegetable', 'foreign body'])) {
      return { kind: 'insertForeignBody', object: 'cucumber' };
    }
    if (matchAny(text, ['forceps', 'clamp', 'instrument'])) {
      return { kind: 'insertForeignBody', object: 'forceps' };
    }
    if (matchAny(text, ['thermometer'])) {
      return { kind: 'insertForeignBody', object: 'thermometer' };
    }
  }
  if (matchAny(text, ['remove foreign body', 'remove object', 'take out', 'remove the'])) {
    return { kind: 'removeForeignBody' };
  }

  // Isolate part (e.g., "isolate the heart", "just show the heart")
  if (matchAny(text, ['isolate', 'just show', 'only show', 'show me only'])) {
    const part = findPartInTranscript(text);
    if (part) {
      return { kind: 'isolatePart', part };
    }
    const layer = findLayerInTranscript(text);
    if (layer) {
      return { kind: 'isolateLayer', layer };
    }
  }

  // Rotate
  if (matchAny(text, ['rotate', 'turn', 'spin', 'rotate left', 'turn left', 'spin left', 'rotate right', 'turn right', 'spin right', 'rotate up', 'turn up', 'rotate down', 'turn down'])) {
    if (matchAny(text, ['left', 'counterclockwise', 'counter-clockwise', 'anticlockwise'])) {
      return { kind: 'rotate', direction: 'left' };
    }
    if (matchAny(text, ['right', 'clockwise'])) {
      return { kind: 'rotate', direction: 'right' };
    }
    if (matchAny(text, [' up', 'upward', 'backward', 'tilt up', 'look up'])) {
      return { kind: 'rotate', direction: 'up' };
    }
    if (matchAny(text, [' down', 'downward', 'forward', 'tilt down', 'look down'])) {
      return { kind: 'rotate', direction: 'down' };
    }
    return { kind: 'rotate', direction: 'right' }; // default
  }

  // Zoom
  if (matchAny(text, ['zoom in', 'zoom out', 'closer', 'farther', 'further', 'magnify', 'shrink', 'bigger', 'smaller', 'larger'])) {
    if (matchAny(text, ['in', 'closer', 'magnify', 'bigger', 'larger'])) {
      return { kind: 'zoom', direction: 'in' };
    }
    if (matchAny(text, ['out', 'farther', 'further', 'away', 'shrink', 'smaller'])) {
      return { kind: 'zoom', direction: 'out' };
    }
  }

  // Show / hide / toggle layer
  if (matchAny(text, ['show ', 'reveal', 'display', 'enable', 'turn on', 'turn on the', 'show me', 'show the'])) {
    const layer = findLayerInTranscript(text);
    if (layer) {
      return { kind: 'showLayer', layer };
    }
  }

  if (matchAny(text, ['hide ', 'remove', 'disable', 'turn off', 'turn off the', 'hide the', 'conceal'])) {
    const layer = findLayerInTranscript(text);
    if (layer) {
      return { kind: 'hideLayer', layer };
    }
  }

  if (matchAny(text, ['toggle', 'switch'])) {
    const layer = findLayerInTranscript(text);
    if (layer) {
      return { kind: 'toggleLayer', layer };
    }
  }

  // Fallback
  return { kind: 'unknown', transcript };
};

export const VOICE_HELP_LINES: { command: string; example: string }[] = [
  { command: 'Rotate the model', example: '"rotate left" / "turn right"' },
  { command: 'Zoom in / out', example: '"zoom in" / "closer"' },
  { command: 'Show a layer', example: '"show muscles" / "show skeleton"' },
  { command: 'Hide a layer', example: '"hide skin"' },
  { command: 'Isolate a part', example: '"isolate the heart"' },
  { command: 'Show / hide all', example: '"show all layers"' },
  { command: 'Switch patient', example: '"switch to Sarah" / "change to male patient"' },
  { command: 'Reset view', example: '"reset"' },
  { command: 'Help', example: '"help"' },
];
