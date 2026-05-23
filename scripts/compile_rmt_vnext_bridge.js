#!/usr/bin/env node

const {
  compileRmtVNextSource
} = require('../tools/rmt-language/vnext-compiler');
const fs = require('fs');

const BRIDGE_SCHEMA = 'xtend.docs.rmt-compiler-bridge.v1';

function readStdin() {
  return new Promise((resolve, reject) => {
    let body = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      body += chunk;
    });
    process.stdin.on('end', () => resolve(body));
    process.stdin.on('error', reject);
    process.stdin.resume();
  });
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function parseArgs(args) {
  const options = {
    inputFile: null
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input-file') {
      options.inputFile = args[index + 1] || null;
      index += 1;
    } else if (arg.startsWith('--input-file=')) {
      options.inputFile = arg.slice('--input-file='.length);
    }
  }
  return options;
}

async function readInput(options) {
  if (options.inputFile) {
    return fs.promises.readFile(options.inputFile, 'utf8');
  }
  return readStdin();
}

function compileRmtVNextBridgePayload(payload = {}) {
  const source = String(payload.source || payload.text || '');
  const filePath = payload.filePath || payload.sourceRef || 'docs/xtendrmt-docs-shell-vnext.rmt';
  const result = compileRmtVNextSource({
    text: source,
    filePath
  }, {
    ...(payload.options || {}),
    filePath
  });

  return {
    schema: BRIDGE_SCHEMA,
    ok: result.ok === true,
    status: result.status || (result.ok ? 'compiled' : 'failed'),
    filePath,
    compilerSchema: result.schema,
    coreDocument: result.coreDocument,
    coreJson: result.coreJson,
    diagnostics: result.diagnostics || [],
    compilerDiagnostics: result.compilerDiagnostics || []
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = await readInput(options);
  let payload = {};
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch (error) {
    writeJson({
      schema: BRIDGE_SCHEMA,
      ok: false,
      status: 'invalid-json',
      coreDocument: null,
      diagnostics: [{
        code: 'xtend.docs.rmt_compiler_bridge.invalid_json',
        severity: 'error',
        message: error.message
      }]
    });
    process.exitCode = 1;
    return;
  }

  const result = compileRmtVNextBridgePayload(payload);
  writeJson(result);
  if (result.ok !== true) process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    writeJson({
      schema: BRIDGE_SCHEMA,
      ok: false,
      status: 'bridge-error',
      coreDocument: null,
      diagnostics: [{
        code: 'xtend.docs.rmt_compiler_bridge.failed',
        severity: 'error',
        message: error && error.message ? error.message : String(error)
      }]
    });
    process.exitCode = 1;
  });
}

module.exports = {
  BRIDGE_SCHEMA,
  compileRmtVNextBridgePayload,
  parseArgs
};
