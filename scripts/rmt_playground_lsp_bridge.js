#!/usr/bin/env node
'use strict';

const { executeToolingBridgeOperation } = require('../tools/tooling-bridge');
const BRIDGE_SCHEMA = 'xtend.docs.rmt-playground.lsp-bridge.v1';

function normalizeLspDiagnostic(diagnostic = {}) {
  return { schema: 'xtend.docs.rmt-playground.diagnostic.v1', source: diagnostic.source || 'xtend-rmt-language-server', code: diagnostic.code || 'rmt.lsp.diagnostic', severity: diagnostic.severity || 'info', message: diagnostic.message || 'RMT diagnostic', range: diagnostic.range || null };
}

async function compileDiagnosticsPayload(payload = {}, options = {}) {
  const response = await executeToolingBridgeOperation({
    schema: 'xtend.compiler.tooling-bridge.v1', requestId: payload.requestId || 'docs-lsp-compat', operation: 'language-diagnostics',
    payload: { source: String(payload.source || payload.text || ''), filePath: payload.filePath || 'docs/rmt-playground-source.rmt', uri: payload.uri, version: payload.version }
  }, { rootDir: options.rootDir || process.cwd() });
  const result = response.result || {};
  return { schema: BRIDGE_SCHEMA, toolingBridgeSchema: response.bridgeSchema, ok: response.ok === true, status: result.status || response.status, uri: result.uri || '', version: payload.version || 1, languageMode: result.languageMode || 'unknown', diagnostics: (response.diagnostics || []).map(normalizeLspDiagnostic), lspDiagnostics: result.diagnostics || [] };
}

async function main() {
  let body = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { body += chunk; });
  process.stdin.on('end', async () => {
    try { process.stdout.write(`${JSON.stringify(await compileDiagnosticsPayload(body.trim() ? JSON.parse(body) : {}))}\n`); }
    catch (error) { process.stdout.write(`${JSON.stringify({ schema: BRIDGE_SCHEMA, ok: false, status: 'bridge-error', diagnostics: [normalizeLspDiagnostic({ code: 'docs.rmt.playground.lsp.bridge_error', severity: 'error', message: error.message })] })}\n`); process.exitCode = 1; }
  });
  process.stdin.resume();
}

if (require.main === module) main();
module.exports = { BRIDGE_SCHEMA, compileDiagnosticsPayload, normalizeLspDiagnostic };
