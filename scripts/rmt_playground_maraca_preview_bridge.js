#!/usr/bin/env node
'use strict';

const { executeToolingBridgeOperation } = require('../tools/tooling-bridge');
const BRIDGE_SCHEMA = 'xtend.docs.rmt-playground.maraca-preview-bridge.v1';
const RESPONSE_SCHEMA = 'xtend.docs.rmt-playground.maraca-preview.v1';

async function createMaracaPreviewBridgePayload(payload = {}, options = {}) {
  const response = await executeToolingBridgeOperation({
    schema: 'xtend.compiler.tooling-bridge.v1', requestId: payload.requestId || 'docs-maraca-compat', operation: 'maraca-plan',
    payload: { source: String(payload.source || payload.sourceText || ''), filePath: payload.filePath || payload.virtualSourcePath || 'docs/rmt-playground-source.rmt', options: { ...(payload.options || {}), ...(payload.maraca || payload.features || {}) } }
  }, { rootDir: options.rootDir || process.cwd() });
  const plan = response.result || {};
  return { schema: RESPONSE_SCHEMA, bridgeSchema: BRIDGE_SCHEMA, toolingBridgeSchema: response.bridgeSchema, ok: response.ok === true, status: plan.status || response.status, diagnostics: response.diagnostics || [], plan };
}

async function main() {
  let body = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { body += chunk; });
  process.stdin.on('end', async () => {
    try { const result = await createMaracaPreviewBridgePayload(body.trim() ? JSON.parse(body) : {}); process.stdout.write(`${JSON.stringify(result)}\n`); if (!result.ok) process.exitCode = 2; }
    catch (error) { process.stdout.write(`${JSON.stringify({ schema: RESPONSE_SCHEMA, bridgeSchema: BRIDGE_SCHEMA, ok: false, status: 'bridge-error', diagnostics: [{ code: 'xtend.docs.rmt_playground.maraca_bridge.failed', severity: 'error', message: error.message }] })}\n`); process.exitCode = 1; }
  });
  process.stdin.resume();
}

if (require.main === module) main();
module.exports = { BRIDGE_SCHEMA, RESPONSE_SCHEMA, createMaracaPreviewBridgePayload };
