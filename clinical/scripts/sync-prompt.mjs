import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'src/data/patientPersona.ts');
const outputPath = resolve(root, 'HERMES_SYSTEM_PROMPT.md');
const source = readFileSync(sourcePath, 'utf8');
const match = source.match(/export const MEDSTAGE_PATIENT_PROMPT = `([\s\S]*?)`;\s*$/);

if (!match) {
  throw new Error('Could not extract MEDSTAGE_PATIENT_PROMPT from src/data/patientPersona.ts');
}

const prompt = match[1].replaceAll('\\`', '`');
const document = `# MedStage LLM Prompt Reference

> This document is generated from \`src/data/patientPersona.ts\`. That TypeScript module is the runtime source of truth; update it first, then run \`npm run prompt:sync\`.

## === START PROMPT ===

${prompt}

## === END PROMPT ===
`;

writeFileSync(outputPath, document);
console.log(`Wrote ${outputPath}`);
