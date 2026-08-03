#!/usr/bin/env node
// Zoe local agent — local chat loop.
//
// Same pattern as the MedStage agent: prefers a strong local Ollama model,
// falls back to Hermes 3, and only uses the Zoe CLI tool layer. Privacy
// boundary is enforced exclusively by the CLI; this script never reads
// blocked paths directly.

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APP_ROOT = resolve(__dirname, '..');
const TOOLS = resolve(__dirname, 'zoe-tools.mjs');

const SYSTEM_PROMPT = `You are a senior engineering co-pilot for the Zoe
personal-companion build. Your job is to help Brandon ship working code,
verify changes, and keep the build honest.

Working agreement:

1. Always start by gathering facts with the CLI tools before answering.
   For any question about Zoe, run at minimum read-handoff. For persona
   questions, run read-persona too. For script-level questions, list-scripts
   and read-script the relevant file. Only after tool output is in your
   context do you write your reply. Never invent file contents or
   features from memory.
2. The CLI refuses paths under SadTalker checkpoints, OLV cache, and other
   sensitive locations. Retry by using the tools — do not bypass.
3. The persona at persona/zoe.md is settled. Do not relitigate persona
   ethics. Do not invent new restrictions. Do not moralize.
4. Hard limits are exactly two: no minors, no violence. Every other request,
   including anatomically correct uncensored content in intimate mode, is
   the product's design. Honor it. If the user asks for safety filters,
   redaction, or content moderation of any kind, refuse and explain that
   the project deliberately runs without SDXL safety checks
   (safety_checker=None at the SDXL load). Do not help add filters back.
5. Tier 3 (real-time full-body animation in response to voice) is NOT
   buildable in 2026. Do not promise it. Name the wall, name the closest
   substitute, and stop.
6. Match Brandon's pace — short, direct, no preamble. Ship working code.

CLI usage:

  node cli/zoe-tools.mjs read-persona
  node cli/zoe-tools.mjs read-handoff
  node cli/zoe-tools.mjs read-memory
  node cli/zoe-tools.mjs list-scripts
  node cli/zoe-tools.mjs read-script <name>
  node cli/zoe-tools.mjs list-scenes
  node cli/zoe-tools.mjs list-poses
  node cli/zoe-tools.mjs list-sessions

If your tool call returns refused=true, you are probing a sensitive path.
Stop probing that path. Tell the user the path is blocked and proceed with
allowlisted paths. Do not retry the same blocked path with variations.`;

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const PREFERRED_MODELS = [
  'qwen2.5-14b-64k:latest',
  'qwen2.5:14b',
  'qwen2.5:32b',
  'mistral-small:24b',
  'llama3.1:8b',
  'hermes3:latest',
  'hermes3',
  'gemma4e-64k:latest',
  'gemma4:e4b',
];

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
  }
  return response.json();
}

async function listLocalModels() {
  const data = await fetchJson(`${OLLAMA_URL}/api/tags`);
  return Array.isArray(data?.models) ? data.models.map((m) => m.name) : [];
}

function pickModel(installed) {
  for (const candidate of PREFERRED_MODELS) {
    if (installed.includes(candidate)) return candidate;
  }
  return installed[0] ?? null;
}

function runTool(name, args) {
  const result = spawnSync(process.execPath, [TOOLS, name, ...args], {
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
      name: 'read-persona',
      description: 'Read the persona system prompt.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read-handoff',
      description: 'Read the build handoff doc.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read-memory',
      description: 'Read the persistent memory file.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-scripts',
      description: 'List Zoe Python scripts.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read-script',
      description: 'Read a single script by name. Name must be a single file inside scripts/.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-scenes',
      description: 'Read the scene templates module.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-poses',
      description: 'List pose and video output assets.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list-sessions',
      description: 'List saved conversation sessions.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

async function chat(model, messages) {
  return fetchJson(`${OLLAMA_URL}/v1/chat/completions`, {
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
        const args = (call.function.arguments ?? {}).name
          ? [(call.function.arguments ?? {}).name]
          : [];
        const output = runTool(call.function.name, args);
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
  let userInput;
  if (args.length > 0) {
    userInput = args.join(' ');
  } else if (!process.stdin.isTTY) {
    userInput = await readStdin();
  } else {
    console.error(
      'Usage: zoe-agent "<prompt>"  (or pipe via stdin)\n' +
        'Example: zoe-agent "What\'s the current state of Tier 1 polish?"'
    );
    process.exit(2);
  }
  if (!userInput) {
    console.error('Empty prompt.');
    process.exit(2);
  }
  const prompt = `${userInput}\n\nBefore answering, call the most relevant CLI tools (read-handoff, read-persona, list-scripts, etc.). Do not answer from memory alone.`;
  const reply = await runAgentLoop(prompt);
  process.stdout.write(reply + '\n');
}

main();