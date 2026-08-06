import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

test('Zoe Friday case and persona exist', () => {
  const cases = read('src/data/patientCases.ts');
  const persona = read('src/data/patientSimulatorPersona.ts');
  assert.match(cases, /id: 'zoe-annual-gyn'/);
  assert.match(cases, /name: 'Zoe'/);
  assert.doesNotMatch(cases, /Lovejoy/i);
  assert.match(persona, /ZOE_PATIENT/);
  assert.match(persona, /name: 'Zoe'/);
  assert.doesNotMatch(persona, /Lovejoy/i);
});

test('atlas module and overlay are wired', () => {
  const atlas = read('src/data/zoeAtlas.ts');
  const overlay = read('src/components/ZoeAtlasOverlay.tsx');
  const app = read('src/App.tsx');
  assert.match(atlas, /lithotomy/);
  assert.match(atlas, /cervix-speculum/);
  assert.match(overlay, /ZoeAtlasOverlay/);
  assert.match(app, /ZoeAtlasOverlay/);
  assert.match(app, /setAtlasView/);
});

test('voice grammar covers tray + atlas + Zoe load', () => {
  const voice = read('src/data/voiceCommands.ts');
  assert.match(voice, /insert the speculum|insert speculum/);
  assert.match(voice, /open the speculum/);
  assert.match(voice, /setExamTool/);
  assert.match(voice, /setAtlasView/);
  assert.match(voice, /zoe-annual-gyn/);
  assert.match(voice, /husband present|partner present/);
});

test('husband cam flythrough is wired', () => {
  const app = read('src/App.tsx');
  const scene = read('src/components/Scene.tsx');
  const voice = read('src/data/voiceCommands.ts');
  assert.match(app, /husbandTakeCamera/);
  assert.match(app, /husbandCamActive/);
  assert.match(scene, /HusbandFigure/);
  assert.match(scene, /HusbandCamController/);
  assert.match(voice, /husband take the camera/);
  assert.match(voice, /look at the cervix/);
});

test('seed atlas stills exist for core slots', () => {
  for (const file of [
    'public/zoe-atlas/full-front.png',
    'public/zoe-atlas/lithotomy.png',
    'public/zoe-atlas/pelvis-external.png',
  ]) {
    assert.ok(existsSync(resolve(root, file)), file);
  }
});
