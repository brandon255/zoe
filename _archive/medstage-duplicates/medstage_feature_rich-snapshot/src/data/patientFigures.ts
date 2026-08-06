// MedStage — Patient figure definitions
// Each figure is a complete body type with proportions, anatomy landmarks, skin tone, hair.
// All values are in meters, relative to figure's Y-up orientation:
//   - y = 0 is feet
//   - y ≈ 1.7-1.85 is top of head
//   - X is left/right, Z is front/back
//
// Proportions follow real anatomical references for fit 40-45 year old adults.
// Heights use 7.5-8 head-heights for proportional adult figures.

export type Sex = 'male' | 'female';
export type Build = 'slim' | 'fit' | 'average' | 'muscular';
export type HairStyle = 'short' | 'medium' | 'long' | 'bald';

export interface PatientFigure {
  id: string;
  name: string;
  sex: Sex;
  age: number;
  height: number; // meters
  build: Build;
  skinTone: string; // hex color
  hairColor: string; // hex color
  hairStyle: HairStyle;
  hasFacialHair: boolean;
  /** Pronouns for the persona */
  pronouns: { subject: string; object: string; possessive: string };
  /** Brief background for the LLM persona */
  background: string;
  /** Voice persona notes for the LLM */
  voice: string;
  /** Anatomical proportions (all in meters, relative to feet at y=0) */
  proportions: {
    headRadius: number;
    neckHeight: number;
    neckRadius: number;
    shoulderWidth: number;
    shoulderThickness: number;
    chestDepth: number;
    chestWidth: number;
    waistWidth: number;
    waistDepth: number;
    hipWidth: number;
    hipDepth: number;
    torsoHeight: number;
    upperArmLength: number;
    upperArmRadius: number;
    forearmLength: number;
    forearmRadius: number;
    handSize: number;
    thighLength: number;
    thighRadius: number;
    calfLength: number;
    calfRadius: number;
    footLength: number;
    footHeight: number;
    /** Y-position of the head center (so props can be positioned) */
    headY: number;
    /** Y-position of the face center */
    faceY: number;
    /** Y-position of the eyes */
    eyeY: number;
    /** Y-position of the shoulders */
    shoulderY: number;
    /** Y-position of the chest center */
    chestY: number;
    /** Y-position of the waist */
    waistY: number;
    /** Y-position of the hips */
    hipY: number;
    /** Y-position of the knees */
    kneeY: number;
  };
}

// Male 45, fit
const MALE_FIT_45: PatientFigure = {
  id: 'male-45-fit',
  name: 'James',
  sex: 'male',
  age: 45,
  height: 1.78,
  build: 'fit',
  skinTone: '#d4a373',
  hairColor: '#3a2a20',
  hairStyle: 'short',
  hasFacialHair: true,
  pronouns: { subject: 'he', object: 'him', possessive: 'his' },
  background:
    '45-year-old male, software engineer, comes in for an annual physical. Generally healthy, exercises 3-4x/week, slight lower back pain from sitting.',
  voice: 'Measured, friendly, uses dry humor occasionally. Asks clarifying questions about his own symptoms.',
  proportions: {
    headRadius: 0.115,
    neckHeight: 0.13,
    neckRadius: 0.055,
    shoulderWidth: 0.255,
    shoulderThickness: 0.085,
    chestDepth: 0.235,
    chestWidth: 0.225,
    waistWidth: 0.195,
    waistDepth: 0.205,
    hipWidth: 0.205,
    hipDepth: 0.225,
    torsoHeight: 0.62,
    upperArmLength: 0.36,
    upperArmRadius: 0.072,
    forearmLength: 0.36,
    forearmRadius: 0.062,
    handSize: 0.085,
    thighLength: 0.46,
    thighRadius: 0.10,
    calfLength: 0.46,
    calfRadius: 0.078,
    footLength: 0.28,
    footHeight: 0.06,
    headY: 1.62,
    faceY: 1.6,
    eyeY: 1.6,
    shoulderY: 1.36,
    chestY: 1.21,
    waistY: 0.96,
    hipY: 0.85,
    kneeY: 0.45,
  },
};

// Female 42, fit
const FEMALE_FIT_42: PatientFigure = {
  id: 'female-42-fit',
  name: 'Sarah',
  sex: 'female',
  age: 42,
  height: 1.68,
  build: 'fit',
  skinTone: '#e0b496',
  hairColor: '#5a3a25',
  hairStyle: 'medium',
  hasFacialHair: false,
  pronouns: { subject: 'she', object: 'her', possessive: 'her' },
  background:
    '42-year-old female, marathon runner, comes in for a sports physical. Very fit, no major health issues, occasional knee discomfort after long runs.',
  voice: 'Warm, direct, energetic. Knows her body well, asks specific questions.',
  proportions: {
    headRadius: 0.108,
    neckHeight: 0.115,
    neckRadius: 0.045,
    shoulderWidth: 0.205,
    shoulderThickness: 0.075,
    chestDepth: 0.215,
    chestWidth: 0.215,
    waistWidth: 0.165,
    waistDepth: 0.185,
    hipWidth: 0.235,
    hipDepth: 0.235,
    torsoHeight: 0.58,
    upperArmLength: 0.32,
    upperArmRadius: 0.06,
    forearmLength: 0.32,
    forearmRadius: 0.052,
    handSize: 0.075,
    thighLength: 0.44,
    thighRadius: 0.105,
    calfLength: 0.43,
    calfRadius: 0.073,
    footLength: 0.255,
    footHeight: 0.055,
    headY: 1.55,
    faceY: 1.535,
    eyeY: 1.535,
    shoulderY: 1.31,
    chestY: 1.18,
    waistY: 0.97,
    hipY: 0.86,
    kneeY: 0.43,
  },
};

export const PATIENT_FIGURES: PatientFigure[] = [MALE_FIT_45, FEMALE_FIT_42];

export const DEFAULT_FIGURE_ID = MALE_FIT_45.id;

export const getFigureById = (id: string): PatientFigure => {
  return PATIENT_FIGURES.find((f) => f.id === id) || MALE_FIT_45;
};
