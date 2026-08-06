import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

test('institutional branding is independent Doctrine Labs prototype language', () => {
  const files = [
    'README.md',
    'HERMES_SYSTEM_PROMPT.md',
    'index.html',
    'package.json',
    'public/models/README.md',
    'src/components/BrandHeader.tsx',
    'src/components/WelcomeOverlay.tsx',
    'src/data/patientPersona.ts',
    'src/styles/index.css',
  ];
  for (const file of files) {
    const content = read(file);
    assert.doesNotMatch(content, /University of Utah|U of Utah|stakeholder sign[- ]off/i, file);
  }
});

test('runtime prompt and documentation come from the same source file', () => {
  const app = read('src/App.tsx');
  const promptModule = read('src/data/patientPersona.ts');
  const docs = read('HERMES_SYSTEM_PROMPT.md');
  assert.match(promptModule, /MEDSTAGE_PATIENT_PROMPT/);
  assert.match(app, /MEDSTAGE_PATIENT_PROMPT/);
  assert.match(docs, /generated from [`]?src\/data\/patientPersona\.ts[`]?/i);
});

test('clinical insertion props use configurable medical names and no cucumber token', () => {
  const files = [
    'src/App.tsx',
    'src/types/index.ts',
    'src/data/voiceCommands.ts',
    'src/components/PelvicCavities.tsx',
    'HERMES_SYSTEM_PROMPT.md',
    'src/data/patientPersona.ts',
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), /cucumber/i, file);
  }
  assert.match(read('src/types/index.ts'), /ClinicalInsertionProp/);
});

test('pediatric cases explicitly disable intimate anatomy and insertion training', () => {
  const cases = read('src/data/patientCases.ts');
  assert.match(cases, /contentProfile\??:/);
  assert.match(cases, /id: 'pediatric-fall'[\s\S]*contentProfile: 'general'/);
});

test('procedural figure does not render Three materials as React children', () => {
  const figure = read('src/components/PatientFigure.tsx');
  assert.doesNotMatch(figure, /^\s*material=\{skinMat as any\}\s*$/m);
});

test('scene gates intimate anatomy and respects gown attachment state', () => {
  const scene = read('src/components/Scene.tsx');
  assert.match(scene, /intimateAnatomyEnabled/);
  assert.match(scene, /attachedObjects\.gown/);
  assert.doesNotMatch(scene, /<PelvicAnatomy[\s\S]{0,120}visible=\{true\}/);
});
