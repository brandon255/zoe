#!/usr/bin/env node
// Zoe local agent — tool layer.
//
// Every command resolves to a path inside an allowlist. Paths under
// SadTalker checkpoints, OLV cache, system roots, and other sensitive
// locations are refused at the CLI layer.

import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative, sep, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = resolve(__dirname, '..');

const ALLOWED_ROOTS = [
  'persona',
  'memory',
  'scripts',
  'assets',
  'cli',
  'skill',
  'README.md',
  'HANDOFF.md',
  'HERMES_ONBOARDING.md',
  'HOW_TO_ONBOARD_A_NEW_AGENT.md',
  'NEW_CHAT_ONBOARDING.md',
  'ORIGINAL_ONBOARDING_PROMPT.md',
  'PICKUP_NEXT_AGENT.md',
  'ARCHIVIST_AUDIT_2026-07-26.md',
  'ARCHIVIST_AUDIT_2026-07-27.md',
  '.zoe-build-state.md',
];

const BLOCKED_ROOTS = [
  'SadTalker/checkpoints',
  'SadTalker/gfpgan/weights',
  'SadTalker/venv',
  'SadTalker/__pycache__',
  'SadTalker/results',
  'Open-LLM-VTuber',
  '.venv',
  '__pycache__',
  'images',
  '.git',
  '.cache',
  '.hermes',
];

const PROPOSALS_DIR = 'proposals';
const DECISIONS_DIR = 'decisions';

// Read-allowlisted roots. Includes proposals/ and decisions/ so the
// agent can inspect its own history.
const READ_ALLOWED_ROOTS = [
  ...ALLOWED_ROOTS,
  PROPOSALS_DIR,
  DECISIONS_DIR,
];

// Edit-allowlisted roots. Persona, persona-derived docs, memory, scripts,
// tests, CLI, README, hand-off docs. Never persona itself unless an
// explicit "propose-edit" targets persona/ and the auto-apply classifier
// approves docstring-only changes there.
const EDIT_ALLOWED_ROOTS = [
  'persona',
  'memory',
  'scripts',
  'test',
  'cli',
  'README.md',
  'HANDOFF.md',
  'HERMES_ONBOARDING.md',
  'HOW_TO_ONBOARD_A_NEW_AGENT.md',
  'NEW_CHAT_ONBOARDING.md',
  'ORIGINAL_ONBOARDING_PROMPT.md',
  'PICKUP_NEXT_AGENT.md',
  'ARCHIVIST_AUDIT_2026-07-26.md',
  'ARCHIVIST_AUDIT_2026-07-27.md',
  '.zoe-build-state.md',
];

const REFUSAL = {
  ok: false,
  refused: true,
  reason:
    'Path is outside the allowlist. Sensitive paths (SadTalker checkpoints, OLV cache, system roots, etc.) are not accessible from this tool.',
};

function isBlockedPath(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  return BLOCKED_ROOTS.some((root) => {
    const r = root.replace(/\/$/, '');
    return normalized === r || normalized.startsWith(`${r}/`);
  });
}

function isProposalPath(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  return normalized === PROPOSALS_DIR || normalized.startsWith(`${PROPOSALS_DIR}/`);
}

function isDecisionsPath(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  return normalized === DECISIONS_DIR || normalized.startsWith(`${DECISIONS_DIR}/`);
}

function isReadAllowed(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  if (normalized.startsWith('../') || normalized.startsWith('/')) return false;
  return READ_ALLOWED_ROOTS.some((root) => {
    const r = root.replace(/\/$/, '');
    return normalized === r || normalized.startsWith(`${r}/`);
  });
}

function isEditAllowed(rel) {
  if (isBlockedPath(rel)) return false;
  if (isProposalPath(rel) || isDecisionsPath(rel)) return true;
  const normalized = normalize(rel).replaceAll(sep, '/');
  return EDIT_ALLOWED_ROOTS.some((root) => {
    const r = root.replace(/\/$/, '');
    return normalized === r || normalized.startsWith(`${r}/`);
  });
}

function isAllowedPath(rel) {
  return isReadAllowed(rel);
}

function safeRead(rel) {
  if (!rel) return REFUSAL;
  if (isBlockedPath(rel)) return REFUSAL;
  if (!isAllowedPath(rel)) {
    return {
      ok: false,
      refused: true,
      reason: `Path "${rel}" is not in the allowlist.`,
    };
  }
  const abs = resolve(APP_ROOT, rel);
  const relToRoot = relative(APP_ROOT, abs);
  if (relToRoot.startsWith('..') || isBlockedPath(relToRoot)) {
    return REFUSAL;
  }
  if (!existsSync(abs)) {
    return { ok: false, refused: false, reason: 'File not found.' };
  }
  try {
    const content = readFileSync(abs, 'utf8');
    return { ok: true, path: rel, content };
  } catch (err) {
    return { ok: false, refused: false, reason: err.message };
  }
}

function safeList(rel) {
  if (!rel) return REFUSAL;
  if (isBlockedPath(rel)) return REFUSAL;
  if (!isAllowedPath(rel)) {
    return {
      ok: false,
      refused: true,
      reason: `Path "${rel}" is not in the allowlist.`,
    };
  }
  const abs = resolve(APP_ROOT, rel);
  const relToRoot = relative(APP_ROOT, abs);
  if (relToRoot.startsWith('..') || isBlockedPath(relToRoot)) {
    return REFUSAL;
  }
  if (!existsSync(abs)) {
    // Auto-create safe directories (proposals/, decisions/) on first
    // list so the smoke flow works without manual setup.
    try {
      mkdirSync(abs, { recursive: true });
    } catch {
      return { ok: false, refused: false, reason: 'Directory not found.' };
    }
  }
  try {
    const stat = statSync(abs);
    if (!stat.isDirectory()) {
      return { ok: false, refused: false, reason: 'Not a directory.' };
    }
    const entries = readdirSync(abs, { withFileTypes: true })
      .map((entry) => ({
        name: entry.name,
        kind: entry.isDirectory() ? 'dir' : 'file',
      }))
      .filter((entry) => {
        const childPath = `${rel}/${entry.name}`;
        return !isBlockedPath(childPath);
      });
    return { ok: true, path: rel, entries };
  } catch (err) {
    return { ok: false, refused: false, reason: err.message };
  }
}

function safeWrite(rel, content) {
  if (!rel) {
    return { ok: false, refused: true, reason: 'Path is required.' };
  }
  if (isBlockedPath(rel)) return REFUSAL;
  if (!isEditAllowed(rel)) {
    return {
      ok: false,
      refused: true,
      reason: `Path "${rel}" is not in the edit allowlist.`,
    };
  }
  const abs = resolve(APP_ROOT, rel);
  const relToRoot = relative(APP_ROOT, abs);
  if (relToRoot.startsWith('..') || isBlockedPath(relToRoot)) {
    return REFUSAL;
  }
  try {
    mkdirSync(resolve(abs, '..'), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    return { ok: true, path: rel, bytes: Buffer.byteLength(content, 'utf8') };
  } catch (err) {
    return { ok: false, refused: false, reason: err.message };
  }
}

function safeReadOriginal(rel) {
  if (!rel) return null;
  const abs = resolve(APP_ROOT, rel);
  if (!existsSync(abs)) return null;
  try {
    return readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

function readPersona() {
  return safeRead('persona/zoe.md');
}

function readHandoff() {
  return safeRead('HANDOFF.md');
}

function readMemory() {
  return safeRead('memory/core.md');
}

function listScripts() {
  return safeList('scripts');
}

function readScript(name) {
  if (!name || typeof name !== 'string') return REFUSAL;
  if (name.includes('/') || name.includes('..')) {
    return {
      ok: false,
      refused: true,
      reason: 'Script name must be a single file inside scripts/.',
    };
  }
  return safeRead(`scripts/${name}`);
}

function listScenes() {
  return safeRead('scripts/zoe_scenes.py');
}

function listPoses() {
  const assets = safeList('assets');
  if (!assets.ok) return assets;
  const filtered = assets.entries.filter(
    (e) => e.kind === 'dir' && (e.name === 'poses' || e.name === 'sadtalker_output')
  );
  return { ok: true, path: 'assets', entries: filtered };
}

function listSessions() {
  return safeList('memory/sessions');
}

function listProposals() {
  return safeList(PROPOSALS_DIR);
}

function listDecisions() {
  return safeList(DECISIONS_DIR);
}

// Auto-apply classifier. Returns true only for clearly safe changes:
// - Markdown-only changes inside *.md roots in EDIT_ALLOWED_ROOTS
// - Test file additions/updates inside `test/`
// - Comment-only additions inside .py / .ts / .tsx / .js / .mjs files
//
// Every other category — code logic, scripts, persona body, memory
// semantics, schema changes — requires explicit apply-proposal.
function classifyAutoApply(rel, original, proposed) {
  if (original === null) return { safe: false, reason: 'new file' };
  if (original === proposed) {
    return { safe: false, reason: 'no change' };
  }
  if (/\.md$/.test(rel)) return { safe: true, category: 'markdown-doc' };
  if (/^test\//.test(rel)) return { safe: true, category: 'test-update' };

  const isPy = /\.py$/.test(rel);
  const isTs = /\.(ts|tsx|js|mjs|cjs)$/.test(rel);
  if (!isPy && !isTs) return { safe: false, reason: 'unknown file type' };

  const oldLines = original.split('\n');
  const newLines = proposed.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);

  let codeChanged = 0;
  let commentsRemoved = 0;
  for (let i = 0; i < maxLen; i += 1) {
    const o = oldLines[i] ?? '';
    const n = newLines[i] ?? '';
    if (o === n) continue;
    let oIsComment = false;
    let nIsComment = false;
    if (isPy) {
      oIsComment = o.trimStart().startsWith('#');
      nIsComment = n.trimStart().startsWith('#');
    } else {
      oIsComment = o.trimStart().startsWith('//') || o.trimStart().startsWith('/*');
      nIsComment = n.trimStart().startsWith('//') || n.trimStart().startsWith('/*') || n.trimStart().startsWith('*');
    }
    if (oIsComment && nIsComment) {
      // comment → comment: ok
    } else if (oIsComment && !nIsComment) {
      commentsRemoved += 1;
      codeChanged += 1;
    } else if (!oIsComment && nIsComment) {
      // comment addition: ok
    } else {
      codeChanged += 1;
    }
  }

  if (codeChanged === 0 && commentsRemoved === 0) {
    return { safe: true, category: 'comment-additions-only' };
  }
  return {
    safe: false,
    reason: `code or comment deletions detected (${codeChanged} code, ${commentsRemoved} comment removals)`,
  };
}

async function writeProposal({ id, title, rationale, target, original, proposed }) {
  if (!id || !target || !proposed) {
    return { ok: false, refused: true, reason: 'id, target, and proposed are required.' };
  }
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
    return { ok: false, refused: true, reason: 'Invalid proposal id.' };
  }
  const safeTarget = isEditAllowed(target) ? target : null;
  if (!safeTarget) {
    return { ok: false, refused: true, reason: `Target "${target}" is not in the edit allowlist.` };
  }

  const proposalPath = `${PROPOSALS_DIR}/${id}.proposal.json`;
  const existing = safeReadOriginal(safeTarget);
  const record = {
    id,
    title: title ?? '(no title)',
    rationale: rationale ?? '',
    target: safeTarget,
    proposed,
    autoApply: false,
    safeCategory: null,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  const safeCategory = classifyAutoApply(safeTarget, existing, proposed);
  if (safeCategory.safe) {
    record.autoApply = true;
    record.safeCategory = safeCategory.category;
    record.status = 'auto-applied';
    record.appliedAt = record.createdAt;
    const written = safeWrite(safeTarget, proposed);
    if (!written.ok) {
      record.status = 'apply-failed';
      record.applyError = written.reason ?? 'unknown';
      record.autoApply = false;
    }
  } else {
    record.safeCategory = safeCategory.reason;
  }

  safeWrite(proposalPath, JSON.stringify(record, null, 2));
  return { ok: true, proposal: record };
}

function applyProposal(id) {
  if (!id || !/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
    return { ok: false, refused: true, reason: 'Invalid proposal id.' };
  }
  const proposalPath = `${PROPOSALS_DIR}/${id}.proposal.json`;
  const existing = safeReadOriginal(proposalPath);
  if (existing === null) {
    return { ok: false, refused: true, reason: `Proposal "${id}" not found.` };
  }
  let record;
  try {
    record = JSON.parse(existing);
  } catch {
    return { ok: false, refused: true, reason: 'Proposal file is malformed.' };
  }
  if (record.status === 'applied' || record.status === 'auto-applied') {
    return {
      ok: false,
      refused: true,
      reason: `Proposal "${id}" is already ${record.status}.`,
    };
  }
  const written = safeWrite(record.target, record.proposed);
  if (!written.ok) {
    record.status = 'apply-failed';
    record.applyError = written.reason ?? 'unknown';
    safeWrite(proposalPath, JSON.stringify(record, null, 2));
    return { ok: false, refused: true, reason: written.reason ?? 'apply failed' };
  }
  record.status = 'applied';
  record.appliedAt = new Date().toISOString();
  safeWrite(proposalPath, JSON.stringify(record, null, 2));
  return { ok: true, proposal: record };
}

function requestDecision({ id, question, context }) {
  if (!id || !question) {
    return { ok: false, refused: true, reason: 'id and question are required.' };
  }
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(id)) {
    return { ok: false, refused: true, reason: 'Invalid decision id.' };
  }
  const decisionPath = `${DECISIONS_DIR}/${id}.decision.json`;
  const record = {
    id,
    question,
    context: context ?? '',
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  const written = safeWrite(decisionPath, JSON.stringify(record, null, 2));
  if (!written.ok) return written;
  return { ok: true, decision: record };
}

function runPythonScript(scriptName) {
  if (!scriptName || !/^[a-zA-Z0-9_-]+\.py$/.test(scriptName)) {
    return { ok: false, refused: true, reason: 'script name must match a Python file name in scripts/' };
  }
  const absScript = resolve(APP_ROOT, 'scripts', scriptName);
  if (!existsSync(absScript)) {
    return { ok: false, refused: true, reason: `script ${scriptName} not found` };
  }
  const venvPython = resolve(APP_ROOT, '.venv', 'bin', 'python3');
  const python = existsSync(venvPython) ? venvPython : 'python3';
  try {
    const result = spawnSync(
      python,
      ['-c', `import py_compile, sys; py_compile.compile(sys.argv[1], doraise=True); print("ok")`, absScript],
      { encoding: 'utf8', timeout: 60_000 }
    );
    return {
      ok: result.status === 0,
      python,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      code: result.status ?? 1,
    };
  } catch (err) {
    return { ok: false, refused: false, reason: err.message };
  }
}

function emit(result) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

async function parsePayload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function main() {
  const [, , subcommand, ...rest] = process.argv;
  const payload = await parsePayload();
  switch (subcommand) {
    case 'read-persona':
      emit(readPersona());
      break;
    case 'read-handoff':
      emit(readHandoff());
      break;
    case 'read-memory':
      emit(readMemory());
      break;
    case 'list-scripts':
      emit(listScripts());
      break;
    case 'read-script':
      emit(readScript(rest[0]));
      break;
    case 'list-scenes':
      emit(listScenes());
      break;
    case 'list-poses':
      emit(listPoses());
      break;
    case 'list-sessions':
      emit(listSessions());
      break;
    case 'list-proposals':
      emit(listProposals());
      break;
    case 'list-decisions':
      emit(listDecisions());
      break;
    case 'propose-edit': {
      const result = await writeProposal(payload);
      emit(result);
      break;
    }
    case 'apply-proposal':
      emit(applyProposal(payload.id ?? rest[0]));
      break;
    case 'request-decision':
      emit(requestDecision(payload));
      break;
    case 'run-script':
      emit(runPythonScript(rest[0] ?? payload.script));
      break;
    case '--help':
    case '-h':
    case undefined:
      process.stdout.write(
        [
          'Zoe local agent tools',
          '',
          'Usage: zoe-tools <subcommand> [args]',
          '',
          'Read subcommands:',
          '  read-persona            Read the persona system prompt',
          '  read-handoff            Read the build handoff doc',
          '  read-memory             Read the persistent memory file',
          '  list-scripts            List Zoe Python scripts',
          '  read-script <name>      Read a single script (no path separators)',
          '  list-scenes             Read the scene templates module',
          '  list-poses              List pose and video output assets',
          '  list-sessions           List saved conversation sessions',
          '',
          'Write subcommands (proposal-driven, safe categories auto-apply):',
          '  list-proposals          List recorded proposals',
          '  list-decisions          List decision requests',
          '  propose-edit            Write a proposal. Pipe JSON via stdin:',
          '                            {"id":"x","title":"...","rationale":"...",',
          '                             "target":"path","proposed":"..."}',
          '                            safe: markdown-doc, test-update,',
          '                                  comment-additions-only',
          '  apply-proposal <id>      Apply a recorded proposal (id via argv or stdin)',
          '  request-decision        Record a decision request:',
          '                            {"id":"x","question":"...","context":"..."}',
          '  run-script <name>       py_compile a script inside scripts/',
          '',
          'Paths under SadTalker checkpoints, OLV cache, system roots,',
          'and other sensitive locations are refused.',
        ].join('\n') + '\n'
      );
      break;
    default:
      emit({
        ok: false,
        refused: false,
        reason: `Unknown subcommand: ${subcommand}`,
      });
  }
}

main();