#!/usr/bin/env node
// MedStage reference agent — tool layer.
//
// Every command resolves to a path inside an allowlist. Any access under
// reference-vault/private/, node_modules/, dist/, .git/, or any other
// disallowed root is refused at the CLI layer. Refusals are fixed.
//
// Tools:
//   read-source <relative-path>
//   list-source <relative-dir>
//   read-prompt
//   read-guidance
//   list-parameters
//   list-cases
//   run-tests
//   run-build

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, relative, sep, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = resolve(__dirname, '..');

const ALLOWED_ROOTS = [
  'src',
  'test',
  'scripts',
  'public',
  'python',
  'package.json',
  'package-lock.json',
  'README.md',
  'HERMES_SYSTEM_PROMPT.md',
  'MINIMAX_HANDOFF.md',
  '.gitignore',
  'reference-vault/README.md',
  'reference-vault/derived',
  'reference-vault/manifest.json',
];

const BLOCKED_ROOTS = [
  'reference-vault/private',
  'reference-vault/private/',
  'node_modules',
  'dist',
  '.git',
  '.cache',
  '.hermes',
];

const REFUSAL = {
  ok: false,
  refused: true,
  reason:
    'Path is outside the allowlist. Private reference material is not accessible from this tool.',
};

function isBlockedPath(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  return BLOCKED_ROOTS.some((root) => {
    const r = root.replace(/\/$/, '');
    return normalized === r || normalized.startsWith(`${r}/`);
  });
}

function isAllowedPath(rel) {
  const normalized = normalize(rel).replaceAll(sep, '/');
  if (normalized.startsWith('../') || normalized.startsWith('/')) return false;
  return ALLOWED_ROOTS.some((root) => {
    const r = root.replace(/\/$/, '');
    return normalized === r || normalized.startsWith(`${r}/`);
  });
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
  // Double-check after resolution: ensure the resolved path is still
  // inside APP_ROOT.
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
    return { ok: false, refused: false, reason: 'Directory not found.' };
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

function readPrompt() {
  const prompt = safeRead('src/data/patientPersona.ts');
  if (!prompt.ok) return prompt;
  const match = prompt.content.match(
    /export const MEDSTAGE_PATIENT_PROMPT = `([\s\S]*?)`;/
  );
  if (!match) {
    return {
      ok: false,
      refused: false,
      reason: 'MEDSTAGE_PATIENT_PROMPT not found in patientPersona.ts',
    };
  }
  return { ok: true, path: 'src/data/patientPersona.ts', content: match[1] };
}

function readGuidance() {
  return safeRead('reference-vault/derived/modeling-guidance.md');
}

function listParameters() {
  return {
    ok: true,
    path: 'src/data/adultSurfaceParams.ts',
    note: 'Use read-source on src/data/adultSurfaceParams.ts to inspect.',
  };
}

function listCases() {
  const cases = safeRead('src/data/patientCases.ts');
  if (!cases.ok) return cases;
  // Match `mkCase({ id: 'X', contentProfile: 'Y', name: 'Z', ... })`
  const re = /mkCase\(\s*\{([\s\S]*?)\}\s*\)/g;
  const profileById = new Map();
  const nameById = new Map();
  let m;
  while ((m = re.exec(cases.content)) !== null) {
    const block = m[1];
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const profileMatch = block.match(/contentProfile:\s*'([^']+)'/);
    const nameMatch = block.match(/name:\s*'([^']+)'/);
    if (!idMatch) continue;
    const id = idMatch[1];
    if (profileMatch) profileById.set(id, profileMatch[1]);
    if (nameMatch) nameById.set(id, nameMatch[1]);
  }
  const ids = [...profileById.keys()];
  return {
    ok: true,
    path: 'src/data/patientCases.ts',
    cases: ids.map((id) => ({
      id,
      name: nameById.get(id) ?? id,
      contentProfile: profileById.get(id) ?? 'general',
    })),
  };
}

function runCommand(cmd) {
  try {
    const stdout = execFileSync(cmd, ['-c', cmd], {
      cwd: APP_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: '/bin/sh',
    });
    return { ok: true, command: cmd, stdout };
  } catch (err) {
    return {
      ok: false,
      command: cmd,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : '',
      code: err.status ?? 1,
    };
  }
}

function runTests() {
  return runCommand('npm test');
}

function runBuild() {
  return runCommand('npm run build');
}

function emit(result) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  if (!result.ok) {
    process.exitCode = 1;
  }
}

function main() {
  const [, , subcommand, ...rest] = process.argv;
  switch (subcommand) {
    case 'read-source':
      emit(safeRead(rest[0]));
      break;
    case 'list-source':
      emit(safeList(rest[0]));
      break;
    case 'read-prompt':
      emit(readPrompt());
      break;
    case 'read-guidance':
      emit(readGuidance());
      break;
    case 'list-parameters':
      emit(listParameters());
      break;
    case 'list-cases':
      emit(listCases());
      break;
    case 'run-tests':
      emit(runTests());
      break;
    case 'run-build':
      emit(runBuild());
      break;
    case '--help':
    case '-h':
    case undefined:
      process.stdout.write(
        [
          'MedStage reference agent tools',
          '',
          'Usage: medstage-tools <subcommand> [args]',
          '',
          'Subcommands:',
          '  read-source <path>       Read a file inside the allowlist',
          '  list-source <dir>        List a directory inside the allowlist',
          '  read-prompt              Return the current runtime patient prompt',
          '  read-guidance            Return the derived modeling guidance',
          '  list-parameters          Pointer to the adult parameter module',
          '  list-cases               List cases with content profiles',
          '  run-tests                Run npm test',
          '  run-build                Run npm run build',
          '',
          'Paths under reference-vault/private/ are refused.',
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