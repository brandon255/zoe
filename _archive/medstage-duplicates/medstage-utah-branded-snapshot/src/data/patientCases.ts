// MedStage — Patient Case Library
// Pre-built clinical scenarios for medical training.
// Each case includes the patient figure + scenario metadata (presenting complaint,
// relevant findings, suggested commands). Doctors/students load a case to step
// into a specific clinical situation.

import type { PatientFigure } from './patientFigures';
import { PATIENT_FIGURES, getFigureById } from './patientFigures';

export type InjuryType =
  | 'head_bandage'
  | 'cervical_collar'
  | 'arm_cast_left'
  | 'arm_cast_right'
  | 'leg_cast_left'
  | 'leg_cast_right'
  | 'bruise_face'
  | 'bruise_arm'
  | 'bruise_leg'
  | 'scar_chest'
  | 'scar_abdomen'
  | 'rash_torso'
  | 'ice_pack'
  | 'crutches';

export interface PatientCase {
  id: string;
  name: string;
  /** Short clinical title */
  title: string;
  /** Specialty this case best serves */
  specialty: 'neurosurgery' | 'orthopedics' | 'proctology' | 'gynecology' | 'general' | 'cardiology';
  /** The presenting complaint / chief complaint */
  chiefComplaint: string;
  /** Background story for the patient */
  history: string;
  /** Pre-attached objects (props + injuries) */
  attachedObjects: Record<string, boolean>;
  /** Photo reference (data URL) — if user uploaded one */
  photoDataUrl?: string;
  /** Video reference (data URL) — if user uploaded one */
  videoDataUrl?: string;
  /** Default starting layers (skin always on) */
  defaultLayers: Record<string, boolean>;
  /** Voice suggestions to get the student started */
  suggestedCommands: string[];
  /** The figure (either by reference to a built-in or full custom definition) */
  figureId?: string;
  customFigure?: PatientFigure;
  /** Whether this is a built-in case or user-saved */
  builtin?: boolean;
  /** Free-form notes from the doctor/student */
  notes?: string;
  /** When the case was created */
  createdAt?: string;
}

const mkCase = (
  base: Omit<PatientCase, 'id' | 'createdAt' | 'builtin'> & { id: string }
): PatientCase => ({
  ...base,
  builtin: true,
  createdAt: new Date().toISOString(),
});

export const BUILTIN_CASES: PatientCase[] = [
  mkCase({
    id: 'head-injury-mvc',
    name: 'Head Injury — MVC',
    title: '45M s/p motor vehicle collision',
    specialty: 'neurosurgery',
    chiefComplaint: "I'm seeing stars. My head hurts where I hit the steering wheel.",
    history:
      '45-year-old male driver, restrained, frontal impact at ~35mph. Brief LOC at scene (<1 min), GCS 14 at arrival. Tender left frontal scalp, no active bleeding. Wearing cervical collar.',
    attachedObjects: {
      glasses: false,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
      head_bandage: true,
      cervical_collar: true,
    },
    defaultLayers: { skin: true, skeletal: true },
    suggestedCommands: [
      "Show me the head",
      "What's his GCS",
      "Did I lose consciousness",
      "Show the brain",
      "Remove the bandage",
    ],
    figureId: 'male-45-fit',
  }),

  mkCase({
    id: 'lower-back-pain-office-worker',
    name: 'Lower Back Pain — Office Worker',
    title: '48M with chronic LBP',
    specialty: 'orthopedics',
    chiefComplaint: "My back has been killing me for three weeks. Sitting makes it worse.",
    history:
      '48-year-old male software engineer, sedentary job, BMI 27. Three weeks of L4-L5 region pain, worse with flexion and prolonged sitting, no radiculopathy, no bowel/bladder symptoms.',
    attachedObjects: {
      glasses: true,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
    },
    defaultLayers: { skin: true, skeletal: true, muscular: true },
    suggestedCommands: [
      'Show me the spine',
      'Isolate the lower back',
      'What movements make it worse',
      "Let's see the muscles",
    ],
    figureId: 'male-45-fit',
  }),

  mkCase({
    id: 'achilles-tendinopathy-runner',
    name: 'Achilles Tendinopathy',
    title: '38F runner with heel pain',
    specialty: 'orthopedics',
    chiefComplaint: 'My heel has been sore after long runs. It stiffens up if I sit for a while.',
    history:
      '38-year-old female marathon runner, 50mpw, pain at the insertion of the Achilles tendon, worse in the morning and after activity. Limited dorsiflexion.',
    attachedObjects: {
      glasses: false,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
    },
    defaultLayers: { skin: true, skeletal: true, foot_bones: true },
    suggestedCommands: [
      'Show me the foot',
      'Isolate the Achilles',
      'How do I examine her',
      "Let's see the heel",
    ],
    customFigure: {
      ...getFigureById('female-42-fit'),
      id: 'female-38-runner',
      name: 'Megan',
      age: 38,
      background:
        '38-year-old female marathon runner, 50mpw. Pain at the insertion of the Achilles tendon.',
      voice: 'Active, focused on her running, frustrated about the pain affecting her training.',
    },
  }),

  mkCase({
    id: 'rectal-bleeding-eval',
    name: 'Rectal Bleeding — Initial Workup',
    title: '52M with painless rectal bleeding',
    specialty: 'proctology',
    chiefComplaint: "I've been bleeding when I go to the bathroom. No pain though.",
    history:
      '52-year-old male, BMI 28, family history of colon cancer (father at 58). Noticed bright red blood on toilet paper for past 6 weeks, no pain, no change in bowel habits. No weight loss.',
    attachedObjects: {
      glasses: false,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
    },
    defaultLayers: { skin: true, organs: true },
    suggestedCommands: [
      'What should I examine first',
      'What are the most likely causes',
      "When do I need a colonoscopy",
      'Show the lower GI tract',
    ],
    figureId: 'male-45-fit',
  }),

  mkCase({
    id: 'annual-gyn-exam',
    name: 'Annual Gynecologic Exam',
    title: '40F annual well-woman visit',
    specialty: 'gynecology',
    chiefComplaint: "Just here for my annual exam, doc.",
    history:
      '40-year-old female, generally healthy, G2P2, last menstrual period 2 weeks ago, regular cycles. No complaints. Family history of breast cancer (mother at 52).',
    attachedObjects: {
      glasses: false,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
    },
    defaultLayers: { skin: true, organs: true },
    suggestedCommands: [
      'What should I screen for',
      'When is her next mammogram',
      'Show the pelvic anatomy',
      'What does a normal exam look like',
    ],
    customFigure: {
      ...getFigureById('female-42-fit'),
      id: 'female-40-wellness',
      name: 'Lisa',
      age: 40,
      background:
        '40-year-old female, G2P2, generally healthy, here for annual well-woman visit.',
      voice: 'Calm, professional, asks good questions about preventive health.',
    },
  }),

  mkCase({
    id: 'pediatric-fall',
    name: 'Pediatric Fall — Wrist Injury',
    title: '8F fell off monkey bars',
    specialty: 'orthopedics',
    chiefComplaint: "I fell off the bars and my arm really hurts.",
    history:
      '8-year-old female, FOOSH (fall on outstretched hand) from monkey bars ~4 feet. Tender, swollen left distal radius, neurovascular intact. Likely buckle fracture.',
    attachedObjects: {
      glasses: false,
      stethoscope: false,
      gown: true,
      sandwich: false,
      clipboard: false,
      arm_cast_left: true,
    },
    defaultLayers: { skin: true, skeletal: true, foot_bones: true },
    suggestedCommands: [
      'What type of fracture is this',
      'Show the wrist',
      'How do I splint it',
      'What is the healing time',
    ],
    customFigure: {
      ...getFigureById('female-42-fit'),
      id: 'female-08-pediatric',
      name: 'Emma',
      age: 8,
      height: 1.27,
      build: 'slim',
      skinTone: '#f0d4b8',
      hairColor: '#6a4025',
      hairStyle: 'long',
      hasFacialHair: false,
      pronouns: { subject: 'she', object: 'her', possessive: 'her' },
      background: '8-year-old female, active kid, fell off monkey bars.',
      voice: 'Scared, in pain, looking to her parent for reassurance.',
      proportions: scaleProportions(getFigureById('female-42-fit').proportions, 1.27 / 1.68),
    },
  }),
];

/** Scale a proportions object for a different height (used for pediatric scaling) */
function scaleProportions(p: PatientFigure['proportions'], factor: number): PatientFigure['proportions'] {
  const scaled: any = {};
  for (const key of Object.keys(p)) {
    const val = (p as any)[key];
    if (typeof val === 'number') {
      scaled[key] = val * factor;
    } else {
      scaled[key] = val;
    }
  }
  return scaled as PatientFigure['proportions'];
}

export const getCaseById = (id: string): PatientCase | undefined => {
  return [...BUILTIN_CASES, ...getUserCases()].find((c) => c.id === id);
};

export const getUserCases = (): PatientCase[] => {
  try {
    const raw = localStorage.getItem('medstage:user-cases');
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return [];
};

export const saveUserCase = (c: PatientCase): void => {
  const cases = getUserCases();
  const existing = cases.findIndex((x) => x.id === c.id);
  if (existing >= 0) cases[existing] = c;
  else cases.push(c);
  try {
    localStorage.setItem('medstage:user-cases', JSON.stringify(cases));
  } catch (err) {
    console.warn('Failed to save case (localStorage may be full):', err);
  }
};

export const deleteUserCase = (id: string): void => {
  const cases = getUserCases().filter((c) => c.id !== id);
  try {
    localStorage.setItem('medstage:user-cases', JSON.stringify(cases));
  } catch {
    /* noop */
  }
};

export const getAllCases = (): PatientCase[] => {
  return [...BUILTIN_CASES, ...getUserCases()];
};
