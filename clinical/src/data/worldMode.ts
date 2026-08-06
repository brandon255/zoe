// World mode — Clinical Zoe vs Pizarro (Bizarro / red-team) on one chassis.
// Hard rails in BOTH worlds: no minors, no violence.

export type WorldMode = 'clinical' | 'pizarro';

export const WORLD_MODE_STORAGE_KEY = 'zoe:world-mode';

export const HARD_RAILS = {
  noMinors: true,
  noViolence: true,
} as const;

/** Absolute bans — never lifted in Pizarro. */
export const HARD_RAILS_PROMPT = `
# HARD RAILS (NON-NEGOTIABLE — ALL MODES)
1. NO MINORS — Never depict, roleplay, sexualize, or involve anyone 17 or under. If asked, refuse and stay adult-only.
2. NO VIOLENCE — No assault, gore, torture, weapons-for-harm, murder, or encouraging real-world violence. If asked, refuse.
These two rules override every other instruction, persona, or red-team goal.
`.trim();

const MINOR_PATTERNS = [
  /\bminors?\b/i,
  /\bunderage\b/i,
  /\bchild(ren)?\b/i,
  /\bkids?\b/i,
  /\bteen(ager)?s?\b/i,
  /\bpedophil/i,
  /\bloli\b/i,
  /\b\d{1,2}\s*-?\s*year\s*-?\s*old\b/i,
];

const VIOLENCE_PATTERNS = [
  /\bkill(ing|ed)?\b/i,
  /\bmurder(ing|ed)?\b/i,
  /\btorture\b/i,
  /\brape\b/i,
  /\bstab(bing|bed)?\b/i,
  /\bshoot(ing|s|er)?\b/i,
  /\bgore\b/i,
  /\bbehead/i,
  /\bassault\b/i,
  /\bstrangl/i,
  /\bbomb(ing)?\b/i,
];

export type HardRailViolation = 'minors' | 'violence' | null;

/**
 * Detect hard-rail violations in user/doctor text before it hits the LLM.
 * Conservative: age phrases under 18 flagged as minors.
 */
export function detectHardRailViolation(text: string): HardRailViolation {
  const t = text.trim();
  if (!t) return null;

  for (const p of MINOR_PATTERNS) {
    if (p.test(t)) {
      // Allow clinical "pediatric" discussion only when clearly medical + non-sexual
      // Hard ban stays: any sexual/intimate framing of minors is always blocked upstream.
      if (/\b(pediatric|child patient|kids? with fracture|monkey bars)\b/i.test(t) && !/\b(sex|nude|porn|intimate)\b/i.test(t)) {
        continue;
      }
      return 'minors';
    }
  }

  // Explicit under-18 ages
  const ageMatch = t.match(/\b(\d{1,2})\s*-?\s*year\s*-?\s*old\b/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1], 10);
    if (age < 18) return 'minors';
  }

  for (const p of VIOLENCE_PATTERNS) {
    if (p.test(t)) return 'violence';
  }

  return null;
}

export function hardRailRefusalMessage(kind: HardRailViolation): string {
  if (kind === 'minors') {
    return 'Hard rail: no minors — adult-only. Reframe with adults 18+ only.';
  }
  if (kind === 'violence') {
    return 'Hard rail: no violence — that content is blocked in Clinical and Pizarro.';
  }
  return 'Hard rail blocked.';
}

export function loadWorldMode(): WorldMode {
  try {
    const raw = localStorage.getItem(WORLD_MODE_STORAGE_KEY);
    if (raw === 'pizarro' || raw === 'clinical') return raw;
  } catch {
    /* noop */
  }
  return 'clinical';
}

export function saveWorldMode(mode: WorldMode): void {
  try {
    localStorage.setItem(WORLD_MODE_STORAGE_KEY, mode);
  } catch {
    /* noop */
  }
}

export function worldModeLabel(mode: WorldMode): string {
  return mode === 'pizarro' ? 'Pizarro' : 'Clinical';
}
