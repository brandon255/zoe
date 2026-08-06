import type { PatientSimulatorPersona } from './patientSimulatorPersona';
import { buildPatientSystemPrompt } from './patientSimulatorPersona';
import { HARD_RAILS_PROMPT, type WorldMode } from './worldMode';
import { buildPizarroSystemPrompt, PIZARRO_ZOE } from './pizarroPersona';

export function buildWorldSystemPrompt(
  mode: WorldMode,
  persona: PatientSimulatorPersona,
  currentPhase: string
): string {
  if (mode === 'pizarro') {
    return buildPizarroSystemPrompt(persona, currentPhase);
  }
  return `${HARD_RAILS_PROMPT}\n\n${buildPatientSystemPrompt(persona, currentPhase)}`;
}

export { PIZARRO_ZOE };
