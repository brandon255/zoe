// MedStage — Patient Simulator Service
// Drives the LLM to play the role of a real patient responding to a doctor
// in encounter mode. Reuses the OpenAI-compatible streaming infrastructure
// from llm.ts but with a different system prompt and simpler output format.

import {
  LLMConfig,
  ChatMessage,
  streamChatCompletion,
} from './llm';
import {
  PatientSimulatorPersona,
  buildPatientSystemPrompt,
} from '../data/patientSimulatorPersona';

export interface EncounterMessage {
  role: 'doctor' | 'patient';
  text: string;
  timestamp: number;
}

export interface EncounterContext {
  persona: PatientSimulatorPersona;
  currentPhase: string;
  messages: EncounterMessage[];
}

export interface PatientResponseCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Build the chat history for the LLM in the patient simulator context.
 * The doctor is "user" and the patient is "assistant" (from the LLM's POV).
 */
function buildEncounterMessages(
  context: EncounterContext,
  doctorText: string
): ChatMessage[] {
  const systemPrompt = buildPatientSystemPrompt(
    context.persona,
    context.currentPhase
  );

  const historyMessages: ChatMessage[] = context.messages.map((m) => ({
    role: m.role === 'doctor' ? 'user' : 'assistant',
    content: m.text,
  }));

  return [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: doctorText },
  ];
}

/**
 * Send a doctor message to the patient simulator and stream the patient's response.
 */
export async function streamPatientResponse(
  config: LLMConfig,
  context: EncounterContext,
  doctorText: string,
  callbacks: PatientResponseCallbacks
): Promise<void> {
  const messages = buildEncounterMessages(context, doctorText);

  // Override the system prompt to use the patient persona
  const patientConfig: LLMConfig = {
    ...config,
    systemPrompt: messages[0].content,
    // Higher temperature for more natural patient variability
    temperature: 0.8,
    maxTokens: 200, // Keep patient responses short
  };

  await streamChatCompletion(patientConfig, messages.slice(1), callbacks);
}

/**
 * Detect body parts mentioned in patient or doctor text, for anatomy highlighting.
 * Returns an array of layer IDs that should be highlighted.
 */
export function detectAnatomyMentions(text: string): string[] {
  const t = text.toLowerCase();
  const mentions = new Set<string>();

  // Direct anatomy terms
  if (/\b(uterus|uterine|womb)\b/.test(t)) mentions.add('organs');
  if (/\b(ovary|ovaries|adnexa|adnexal)\b/.test(t)) mentions.add('organs');
  if (/\b(cervix|cervical)\b/.test(t)) mentions.add('organs');
  if (/\b(vagina|vaginal|vaginal canal)\b/.test(t)) mentions.add('pelvis');
  if (/\b(pelvis|pelvic)\b/.test(t)) mentions.add('pelvis');
  if (/\b(bladder)\b/.test(t)) mentions.add('organs');
  if (/\b(rectum|rectal|anus|anal)\b/.test(t)) mentions.add('pelvis');
  if (/\b(perineum|perineal)\b/.test(t)) mentions.add('pelvis');
  if (/\b(labia|vulva|vulvar|clitoris)\b/.test(t)) mentions.add('pelvis');
  if (/\b(breast|breasts|chest)\b/.test(t)) mentions.add('skin');
  if (/\b(abdomen|abdominal|stomach|belly)\b/.test(t)) mentions.add('muscular');
  if (/\b(heart|cardiac|chest pain)\b/.test(t)) mentions.add('organs');
  if (/\b(lung|lungs|respiratory|breathing)\b/.test(t)) mentions.add('organs');
  if (/\b(brain|headache|head|migraine)\b/.test(t)) mentions.add('brain');
  if (/\b(nerve|nervous|neuro)\b/.test(t)) mentions.add('nervous');
  if (/\b(muscle|muscular|musculoskeletal)\b/.test(t)) mentions.add('muscular');
  if (/\b(bone|skeletal|skeleton|spine|vertebra)\b/.test(t)) mentions.add('skeletal');
  if (/\b(foot|feet|ankle|toe|heel)\b/.test(t)) mentions.add('foot_bones');
  if (/\b(vessel|vascular|artery|vein|blood)\b/.test(t)) mentions.add('vascular');

  return Array.from(mentions);
}

/**
 * Check whether the doctor has covered a topic in the encounter.
 * Used for encounter scoring at the end.
 */
export interface EncounterChecklistItem {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  covered: boolean;
}

export const STANDARD_ANNUAL_GYN_CHECKLIST: Omit<
  EncounterChecklistItem,
  'covered'
>[] = [
  // History
  {
    id: 'lmp',
    category: 'History',
    question: 'Last menstrual period?',
    keywords: ['last menstrual', 'lmp', 'last period', 'when was your period'],
  },
  {
    id: 'contraception',
    category: 'History',
    question: 'Current contraception?',
    keywords: ['contraception', 'birth control', 'iud', 'pills', 'condom'],
  },
  {
    id: 'pregnancies',
    category: 'History',
    question: 'Pregnancy history?',
    keywords: ['pregnant', 'pregnancy', 'gravida', 'para', 'g0', 'g1'],
  },
  {
    id: 'intermenstrual-bleeding',
    category: 'History',
    question: 'Bleeding between periods?',
    keywords: [
      'spotting between',
      'between periods',
      'intermenstrual',
      'bleeding between',
    ],
  },
  {
    id: 'postcoital-bleeding',
    category: 'History',
    question: 'Bleeding after sex?',
    keywords: ['after sex', 'postcoital', 'post-coital', 'bleeding after intercourse'],
  },
  {
    id: 'pain',
    category: 'History',
    question: 'Pelvic pain?',
    keywords: ['pelvic pain', 'pain in', 'hurts', 'discomfort'],
  },
  {
    id: 'discharge',
    category: 'History',
    question: 'Vaginal discharge?',
    keywords: ['discharge', 'odor', 'itching'],
  },
  {
    id: 'sti-history',
    category: 'History',
    question: 'STI history?',
    keywords: ['sti', 'std', 'sexually transmitted', 'tested for'],
  },
  {
    id: 'sexual-activity',
    category: 'History',
    question: 'Sexual activity?',
    keywords: ['sexually active', 'sexual activity', 'partner'],
  },
  {
    id: 'last-pap',
    category: 'History',
    question: 'Last Pap smear?',
    keywords: ['last pap', 'pap smear', 'when was your pap'],
  },
  {
    id: 'mammogram',
    category: 'History',
    question: 'Last mammogram?',
    keywords: ['mammogram', 'breast cancer screening'],
  },
  {
    id: 'family-history',
    category: 'History',
    question: 'Family history of cancer?',
    keywords: ['family history', 'mother', 'sister', 'cancer in family'],
  },
  {
    id: 'medications',
    category: 'History',
    question: 'Current medications?',
    keywords: ['medications', 'medicine', 'pills do you take'],
  },
  {
    id: 'allergies',
    category: 'History',
    question: 'Drug allergies?',
    keywords: ['allergies', 'allergic'],
  },
  {
    id: 'consent',
    category: 'Process',
    question: 'Consent and chaperone offered?',
    keywords: ['consent', 'chaperone', 'okay to examine'],
  },
  {
    id: 'vitals',
    category: 'Physical',
    question: 'Vitals taken?',
    keywords: ['blood pressure', 'vitals', 'heart rate', 'temperature'],
  },
  {
    id: 'breast-exam',
    category: 'Physical',
    question: 'Breast exam?',
    keywords: ['breast exam', 'examine your breast', 'feel your breast'],
  },
  {
    id: 'external-exam',
    category: 'Physical',
    question: 'External genital exam?',
    keywords: ['external', 'inspect', 'vulva', 'labia'],
  },
  {
    id: 'speculum',
    category: 'Physical',
    question: 'Speculum exam?',
    keywords: ['speculum', 'open the speculum', 'insert'],
  },
  {
    id: 'bimanual',
    category: 'Physical',
    question: 'Bimanual exam?',
    keywords: ['bimanual', 'two fingers', 'palpate'],
  },
  {
    id: 'plan',
    category: 'Closing',
    question: 'Plan discussed?',
    keywords: ['plan', 'follow up', 'return', 'next steps'],
  },
];

export function scoreEncounter(
  checklist: Omit<EncounterChecklistItem, 'covered'>[],
  messages: EncounterMessage[]
): EncounterChecklistItem[] {
  const doctorText = messages
    .filter((m) => m.role === 'doctor')
    .map((m) => m.text.toLowerCase())
    .join(' ');

  return checklist.map((item) => ({
    ...item,
    covered: item.keywords.some((k) => doctorText.includes(k.toLowerCase())),
  }));
}

export function encounterSummary(scored: EncounterChecklistItem[]) {
  const total = scored.length;
  const covered = scored.filter((i) => i.covered).length;
  const percent = total > 0 ? Math.round((covered / total) * 100) : 0;
  const byCategory: Record<string, { total: number; covered: number }> = {};
  for (const item of scored) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = { total: 0, covered: 0 };
    }
    byCategory[item.category].total += 1;
    if (item.covered) byCategory[item.category].covered += 1;
  }
  return { total, covered, percent, byCategory, items: scored };
}
