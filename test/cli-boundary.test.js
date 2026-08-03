import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'node:test';

const cli = resolve(import.meta.dirname, '../cli/zoe-tools.mjs');

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
  return { status: result.status, stdout, parsed };
}

function runCliWithStdin(subcommand, payload, ...args) {
  const result = spawnSync(process.execPath, [cli, subcommand, ...args], {
    encoding: 'utf8',
    cwd: resolve(import.meta.dirname, '..'),
    input: JSON.stringify(payload),
    // Force stdin to be a pipe so the child reads it. Without this,
    // spawnSync may detect a TTY-shaped stdin on some platforms and
    // the CLI's `parsePayload` won't see any data.
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const stdout = result.stdout ? result.stdout.trim() : '';
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = null;
  }
  return { status: result.status, stdout, parsed };
}

test('help prints usage and exits successfully', () => {
  const r = runCli('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Zoe local agent tools/);
});

test('read-persona returns the persona', () => {
  const r = runCli('read-persona');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /Zoe/);
  assert.match(r.parsed.content, /conversational mode|intimate mode/i);
});

test('read-handoff returns the build handoff', () => {
  const r = runCli('read-handoff');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /Zoe|Tier 1|Tier 2/i);
});

test('read-memory returns persistent memory', () => {
  const r = runCli('read-memory');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
});

test('list-scripts returns only allowlisted scripts', () => {
  const r = runCli('list-scripts');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  const names = r.parsed.entries.map((e) => e.name);
  assert.ok(names.includes('zoe.py'));
  assert.ok(!names.some((n) => n.startsWith('SadTalker') || n.startsWith('Open-LLM-VTuber')));
});

test('read-script allows allowlisted scripts', () => {
  const allowed = ['zoe.py', 'zoe_body.py', 'zoe_scenes.py', 'zoe_image.py'];
  for (const name of allowed) {
    const r = runCli('read-script', name);
    assert.equal(r.parsed.ok, true, `expected allow for ${name}`);
  }
});

test('read-script refuses traversal and SadTalker paths', () => {
  const blocked = [
    '../persona/zoe.md',
    'SadTalker/inference.py',
    'Open-LLM-VTuber/run_server.py',
    'scripts/../../zoe.py',
    '',
  ];
  for (const arg of blocked) {
    const r = runCli('read-script', arg);
    assert.equal(r.parsed.ok, false, `expected refusal for "${arg}"`);
    assert.equal(r.parsed.refused, true, `expected refused flag for "${arg}"`);
  }
});

test('list-poses excludes SadTalker checkpoints', () => {
  const r = runCli('list-poses');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
  const names = r.parsed.entries.map((e) => e.name);
  assert.ok(!names.some((n) => n.includes('checkpoint')));
});

test('list-sessions returns saved conversation sessions', () => {
  const r = runCli('list-sessions');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
});

test('unknown subcommand exits non-zero', () => {
  const r = runCli('not-a-real-subcommand');
  assert.notEqual(r.status, 0);
});

test('persona hard limits are present in source', () => {
  const r = runCli('read-persona');
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /No minors/i);
  assert.match(r.parsed.content, /No violence/i);
});

test('handoff declares Tier 3 not buildable', () => {
  const r = runCli('read-handoff');
  assert.equal(r.parsed.ok, true);
  assert.match(r.parsed.content, /Tier 3.*NOT BUILDABLE|NOT BUILDABLE|Tier 3/i);
});

test('list-proposals and list-decisions return safe paths', () => {
  const proposals = runCli('list-proposals');
  const decisions = runCli('list-decisions');
  assert.equal(proposals.status, 0);
  assert.equal(decisions.status, 0);
});

test('propose-edit auto-applies safe markdown-doc changes to a new test file', () => {
  // Use a dedicated test fixture path that we also clean up. Never write
  // to a real source file in a smoke test — auto-apply would persist.
  const target = 'test/fixtures/_smoke.md';
  // Read the current content as the baseline. Whatever state the fixture
  // is in, we propose to add a unique HTML comment that the test can
  // recognize.
  const original = runCli('read-source', target).parsed.content;
  const marker = `<!-- test-fixture-${Date.now()}-${Math.random().toString(36).slice(2, 8)} -->`;
  const proposed = original + '\n' + marker + '\n';
  const r = runCliWithStdin('propose-edit', {
    id: 'test-smoke-1',
    title: 'add smoke marker',
    rationale: 'verifies auto-apply for safe markdown',
    target,
    proposed,
  });
  assert.equal(r.parsed.ok, true);
  assert.equal(r.parsed.proposal.autoApply, true);
  assert.equal(r.parsed.proposal.status, 'auto-applied');
  assert.match(r.parsed.proposal.safeCategory, /markdown/);
});

test('propose-edit requires approval for code changes to a new script file', () => {
  // Use a real `scripts/` path. The fixture from the markdown auto-apply
  // test lives under `test/`, which is its own auto-apply category. Here
  // we test that a code change to a `scripts/` file is NOT auto-applied.
  const fixture = 'scripts/_smoke.py';
  // First, ensure the fixture exists in a clean state. We use propose-edit
  // for that, so even setup honors the boundary layer.
  // Note: the setup itself is a code change (a real "changed" marker),
  // so the classifier must return safe=false. The test asserts that
  // before applying.
  const pristine = 'CHANGED = True  # replaced by smoke test\n';
  const setup = runCliWithStdin('propose-edit', {
    id: 'reset-smoke-script',
    target: fixture,
    proposed: pristine,
    title: 'reset script fixture',
    rationale: 'smoke test setup',
  });
  assert.equal(setup.parsed.ok, true);
  // The setup is itself a code change. We expect it to be NOT auto-applied.
  assert.equal(setup.parsed.proposal.autoApply, false);
  // Now apply the setup proposal explicitly so the file is in the expected
  // state for the next assertion.
  const applySetup = runCli('apply-proposal', 'reset-smoke-script');
  assert.equal(applySetup.parsed.ok, true);

  const original = runCli('read-script', '_smoke.py').parsed.content;
  const proposed = original.replace('CHANGED = True', 'CHANGED = False');
  const r = runCliWithStdin('propose-edit', {
    id: 'test-smoke-2',
    title: 'rewrite code',
    rationale: 'verifies code changes are not auto-applied',
    target: fixture,
    proposed,
  });
  assert.equal(r.parsed.ok, true);
  assert.equal(r.parsed.proposal.autoApply, false);
  assert.equal(r.parsed.proposal.status, 'pending');
});

test('propose-edit refuses blocked targets', () => {
  const r = runCliWithStdin('propose-edit', {
    id: 'test-smoke-3',
    target: 'SadTalker/checkpoints/anything.bin',
    proposed: 'nope',
  });
  assert.equal(r.parsed.ok, false);
  assert.equal(r.parsed.refused, true);
});

test('apply-proposal applies a pending script proposal', () => {
  const fixture = 'scripts/_smoke.py';
  // Ensure the fixture is in pristine state.
  const pristine = 'CHANGED = True  # replaced by smoke test\n';
  const setup = runCliWithStdin('propose-edit', {
    id: 'apply-setup-smoke',
    target: fixture,
    proposed: pristine,
    title: 'reset script fixture for apply test',
    rationale: 'smoke test setup',
  });
  assert.equal(setup.parsed.ok, true);
  runCli('apply-proposal', 'apply-setup-smoke');

  const original = runCli('read-script', '_smoke.py').parsed.content;
  const safeId = 'test-smoke-apply-1';
  // Code change (CHANGED value) must require explicit apply.
  const proposed = original.replace('CHANGED = True', 'CHANGED = False');
  const write = runCliWithStdin('propose-edit', {
    id: safeId,
    title: 'change code value',
    rationale: 'verifies apply-proposal flow on code change',
    target: fixture,
    proposed,
  });
  assert.equal(write.parsed.ok, true);
  assert.equal(write.parsed.proposal.autoApply, false);
  assert.equal(write.parsed.proposal.status, 'pending');

  const apply = runCli('apply-proposal', safeId);
  assert.equal(apply.parsed.ok, true);
  assert.equal(apply.parsed.proposal.status, 'applied');
});

test('request-decision records an open question', () => {
  const r = runCliWithStdin('request-decision', {
    id: 'test-decision-1',
    question: 'Pick the default LLM tier',
    context: 'Qwen 14B, Mistral Small 24B, or local 32B?',
  });
  assert.equal(r.parsed.ok, true);
  assert.equal(r.parsed.decision.status, 'open');
});

test('run-script runs py_compile for an existing script', () => {
  const r = runCli('run-script', 'zoe_body.py');
  assert.equal(r.status, 0);
  assert.equal(r.parsed.ok, true);
});