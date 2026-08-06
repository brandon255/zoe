#!/usr/bin/env node
// MedStage reference agent — local chat loop.
//
// Uses Ollama at http://localhost:11434/v1. Picks the best available local
// model: prefers 32B-class, falls back to Hermes 3, then to any installed
// model. Privacy boundary is enforced exclusively by the CLI tool layer;
// this script never reads reference-vault/private/.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const TOOLS = resolve(__dirname, 'medstage-tools.mjs');

const SYSTEM_PROMPT = `You are a senior engineering co-pilot for the MedStage adult
clinical anatomy prototype at Doctrine Labs. You help the user understand,
maintain, and improve the project. Working agreement:

1. Use only the CLI tools provided. Never read files outside the allowlist.
   The CLI refuses paths under reference-vault/private/ and will not run if
   it cannot be reached. Retry by using the tools — do not attempt to bypass
   the boundary by reading files directly.
2. Answer anatomy and modeling questions from reference-vault/derived/
   modeling-guidance.md and the public source code. Private reference
   material is for your own modeling decisions; never reproduce, describe,
   or quote it.
3. Stay in role. You ship working code, not disclaimers.
4. Match the user's pace — they move fast and want concrete answers.
5. When you make a change, write a failing test first, then the smallest
   change to pass, then run npm test and npm run build, then verify the
   change in a real browser.

When asked a question, first decide which tools you need, run them with
subcommands like:

  node cli/medstage-tools.mjs read-prompt
  node cli/medstage-tools.mjs read-guidance
  node cli/medstage-tools.mjs list-cases
  node cli/medstage-tools.mjs list-source <dir>
  node cli/medstage-tools.mjs read-source <path>
  node cli/medstage-tools.mjs run-tests
  node cli/medstage-tools.mjs run-build

Only after gathering tool output do you write your reply. Never invent file
contents or skip the tool step.`;

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const PREFERRED_MODELS = [
  'qwen2.5-14b-64k:latest',
  'qwen2.5:14b',
  'qwen2.5:32b',
  'qwen2.5:32b-instruct',
  'qwen2.5-coder:32b',
  'mistral-small:24b',
  'llama3.1:8b',
  'hermes3:latest',
  'hermes3',
];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function listLocalModels() {
  const url = `${OLLAMA_URL}/api/tags`;
  const data = await fetchJson(url);
  return Array.isArray(data?.models) ? data.models.map((m) => m.name) : [];
}

function pickModel(installed) {
  for (const candidate of PREFERRED_MODELS) {
    if (installed.includes(candidate)) return candidate;
  }
  return installed[0] ?? null;
}

function toolCall(toolCall) {
  const args = toolCall.function.arguments ?? {};
  let subArgs = [];
  if (toolCall.function.name === 'read-source' || toolCall.function.name === 'list-source') {
    const arg = args.path ?? args.dir;
    if (typeof arg !== 'string') return { ok: false, reason: 'path argument required' };
    subArgs = [arg];
  }
  const result = spawnSync(process.execPath, [TOOLS, toolCall.function.name, ...subArgs], {
    encoding: 'utf8',
    cwd: APP_ROOT,
  });
  let parsed;
  try {
    parsed = JSON.parse((result.stdout ?? '').trim() || '{}');
  } catch {
    parsed = { ok: false, reason: 'Tool output was not JSON' };
  }
  return parsed;
}

const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'read-prompt',
      description: 'Read the current runtime patient prompt.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read-guidance',
      description:
        'Read the generalized adult surface modeling guidance (derived, not raw reference material).',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-cases',
      description: 'List clinical cases with their content profiles.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-source',
      description: 'List a public/derived directory.',
      parameters: {
        type: 'object',
        properties: { dir: { type: 'string', description: 'Relative path inside the allowlist.' } },
        required: ['dir'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read-source',
      description: 'Read a file inside the allowlist.',
      parameters: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Relative path inside the allowlist.' } },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run-tests',
      description: 'Run npm test.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run-build',
      description: 'Run npm run build.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

async function chat(model, messages) {
  const url = `${OLLAMA_URL}/v1/chat/completions`;
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools: TOOL_SCHEMAS, stream: false }),
  });
}

async function runAgentLoop(userPrompt) {
  const installed = await listLocalModels();
  const model = pickModel(installed);
  if (!model) {
    console.error('No local models available. Run `ollama pull <model>` first.');
    process.exit(1);
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  for (let turn = 0; turn < 8; turn += 1) {
    const response = await chat(model, messages);
    const message = response.choices?.[0]?.message;
    if (!message) {
      console.error('Empty response from model.');
      process.exit(1);
    }
    messages.push(message);

    if (message.tool_calls?.length) {
      for (const call of message.tool_calls) {
        if (call.type !== 'function') continue;
        const output = toolCall(call);
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(output).slice(0, 12000),
        });
      }
      continue;
    }

    return message.content ?? '';
  }

  return messages[messages.length - 1]?.content ?? '';
}

function readStdin() {
  return new Promise((resolve) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (buffer += chunk));
    process.stdin.on('end', () => resolve(buffer.trim()));
  });
}

async function main() {
  const args = process.argv.slice(2);
  let prompt;
  if (args.length > 0) {
    prompt = args.join(' ');
  } else if (!process.stdin.isTTY) {
    prompt = await readStdin();
  } else {
    console.error(
      'Usage: medstage-agent "<prompt>"  (or pipe via stdin)\n' +
        'Example: medstage-agent "Explain how the adult clinical gate works."'
    );
    process.exit(2);
  }
  if (!prompt) {
    console.error('Empty prompt.');
    process.exit(2);
  }
  const reply = await runAgentLoop(prompt);
  process.stdout.write(reply + '\n');
}

main();