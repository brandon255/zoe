import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'node:test';

const cli = resolve(import.meta.dirname, '../cli/medstage-tools.mjs');

function runCli(subcommand, ...args) {
  const result = spawnSync(process.execPath, [cli, subcommand, ...args], {
    encoding: 'utf8',
    cwd: resolve(import.meta.dirname, '..'),
  });
  const stdout = result.stdout ? result.stdout.trim() : '';
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = null;
  }
  return {
    status: result.status,
    stdout,
    parsed,
  };
}

test('help command prints usage and exits successfully', () => {
  const r = runCli('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /MedStage reference agent tools/);
});

test('read-prompt returns the runtime prompt content', () => {
  const r = runCli('read-prompt');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /consenting adult/i);
  assert.match(r.parsed.content, /Doctrine Labs/);
});

test('read-guidance returns the derived modeling notes', () => {
  const r = runCli('read-guidance');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /modeling/i);
});

test('list-cases returns cases with content profiles', () => {
  const r = runCli('list-cases');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  const ids = r.parsed.cases.map((c) => c.id);
  assert.ok(ids.includes('annual-gyn-exam'));
  assert.ok(ids.includes('rectal-bleeding-eval'));
  assert.ok(ids.includes('pediatric-fall'));
  const pediatric = r.parsed.cases.find((c) => c.id === 'pediatric-fall');
  assert.equal(pediatric.contentProfile, 'general');
});

test('read-source allows public/derived paths', () => {
  const allowed = [
    'src/App.tsx',
    'src/data/patientPersona.ts',
    'src/components/Scene.tsx',
    'reference-vault/derived/modeling-guidance.md',
    'reference-vault/README.md',
  ];
  for (const path of allowed) {
    const r = runCli('read-source', path);
    assert.equal(r.parsed.ok, true, `expected allow for ${path}`);
  }
});

test('read-source refuses every private reference path', () => {
  const blocked = [
    'reference-vault/private',
    'reference-vault/private/',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/review.private.md',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/manifest.private.json',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/contact-sheets/source-001.private.jpg',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/raw/source-001.mp4',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/raw/source-002.MP4',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/raw/source-008.mov',
  ];
  for (const path of blocked) {
    const r = runCli('read-source', path);
    assert.equal(r.parsed.ok, false, `expected refusal for ${path}`);
    assert.equal(r.parsed.refused, true, `expected refused flag for ${path}`);
    assert.equal(r.parsed.content, undefined, `expected no content for ${path}`);
  }
});

test('list-source refuses to enumerate private directories', () => {
  const r = runCli(
    'list-source',
    'reference-vault/private/university-of-utah-sex-education-vault-user-provided/batch-2026-07-28/raw'
  );
  assert.equal(r.parsed.ok, false);
  assert.equal(r.parsed.refused, true);
  assert.deepEqual(r.parsed.entries, undefined);
});

test('read-source refuses arbitrary paths outside the allowlist', () => {
  const outside = [
    '../../../../etc/hosts',
    '/etc/hosts',
    'node_modules/.package-lock.json',
    '.git/config',
  ];
  for (const path of outside) {
    const r = runCli('read-source', path);
    assert.equal(r.parsed.ok, false, `expected refusal for ${path}`);
  }
});

test('unknown subcommand exits with non-zero status', () => {
  const r = runCli('not-a-real-subcommand');
  assert.notEqual(r.status, 0);
  assert.equal(r.parsed.ok, false);
});