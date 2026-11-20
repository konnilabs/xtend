#!/usr/bin/env node
'use strict';
const { executeToolingBridgeOperation, TOOLING_BRIDGE_RESPONSE_SCHEMA, TOOLING_BRIDGE_RESPONSE_SCHEMA_V2 } = require('./tooling-bridge');
let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { body += chunk; });
process.stdin.on('end', async () => {
  let envelope = {};
  try {
    envelope = body.trim() ? JSON.parse(body) : {};
    const output = await executeToolingBridgeOperation(envelope, { rootDir: process.cwd() });
    const serialized = JSON.stringify(output);
    if (Buffer.byteLength(serialized) > 16 * 1024 * 1024) throw new Error('Tooling bridge output exceeds 16 MiB.');
    process.stdout.write(`${serialized}\n`);
    if (!output.ok) process.exitCode = 2;
  } catch (error) {
    const payload = envelope?.payload && typeof envelope.payload === 'object' ? envelope.payload : {};
    const options = payload.options || {};
    const project = envelope?.schema === 'xtend.compiler.tooling-bridge.v2' || payload.project === true || options.project === true
      || ['sourceSyntax', 'rmtxProvidersFile'].some(key => Object.hasOwn(payload, key) || Object.hasOwn(options, key))
      || /\.rmtx$/iu.test(payload.filePath || '');
    process.stdout.write(`${JSON.stringify({ schema: project ? TOOLING_BRIDGE_RESPONSE_SCHEMA_V2 : TOOLING_BRIDGE_RESPONSE_SCHEMA, ok: false, status: 'bridge-error', diagnostics: [{ code: 'xtend.compiler.tooling_bridge.failed', severity: 'error', message: error.message }] })}\n`);
    process.exitCode = 1;
  }
});
process.stdin.resume();
