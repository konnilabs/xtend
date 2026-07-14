#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { executeToolingBridgeOperation } = require('../tools/tooling-bridge');

const BRIDGE_SCHEMA = 'xtend.docs.rmt-compiler-bridge.v1';

async function compileRmtVNextBridgePayload(payload = {}, options = {}) {
  const response = await executeToolingBridgeOperation({
    schema: 'xtend.compiler.tooling-bridge.v1',
    requestId: payload.requestId || 'docs-compiler-compat',
    operation: 'compile',
    payload: {
      source: String(payload.source || payload.text || ''),
      filePath: payload.filePath || payload.sourceRef || 'docs/xtendrmt-docs-shell-vnext.rmt',
      options: payload.options || {}
    }
  }, { rootDir: options.rootDir || process.cwd() });
  const result = response.result || {};
  return {
    schema: BRIDGE_SCHEMA,
    toolingBridgeSchema: response.bridgeSchema,
    ok: response.ok === true,
    status: result.status || response.status,
    filePath: payload.filePath || payload.sourceRef || 'docs/xtendrmt-docs-shell-vnext.rmt',
    compilerSchema: result.schema,
    coreDocument: result.coreDocument || null,
    coreJson: result.coreJson || null,
    diagnostics: response.diagnostics || [],
    compilerDiagnostics: result.compilerDiagnostics || []
  };
}

function parseArgs(args = []) {
  const match = args.find((value) => value === '--input-file' || String(value).startsWith('--input-file='));
  if (!match) return { inputFile: null };
  const index = args.indexOf(match);
  return { inputFile: match === '--input-file' ? args[index + 1] || null : match.slice('--input-file='.length) };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const raw = options.inputFile ? await fs.promises.readFile(options.inputFile, 'utf8') : await new Promise((resolve, reject) => {
    let body = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { body += chunk; });
    process.stdin.on('end', () => resolve(body));
    process.stdin.on('error', reject);
  });
  const result = await compileRmtVNextBridgePayload(raw.trim() ? JSON.parse(raw) : {});
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.ok) process.exitCode = 2;
}

if (require.main === module) main().catch((error) => {
  process.stdout.write(`${JSON.stringify({ schema: BRIDGE_SCHEMA, ok: false, status: 'bridge-error', diagnostics: [{ code: 'xtend.docs.rmt_compiler_bridge.failed', severity: 'error', message: error.message }] })}\n`);
  process.exitCode = 1;
});

module.exports = { BRIDGE_SCHEMA, compileRmtVNextBridgePayload, parseArgs };
