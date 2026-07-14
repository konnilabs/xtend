#!/usr/bin/env node
'use strict';
const { executeToolingBridgeOperation, TOOLING_BRIDGE_RESPONSE_SCHEMA } = require('./tooling-bridge');
let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { body += chunk; });
process.stdin.on('end', async () => {
  try {
    const envelope = body.trim() ? JSON.parse(body) : {};
    const output = await executeToolingBridgeOperation(envelope, { rootDir: process.cwd() });
    const serialized = JSON.stringify(output);
    if (Buffer.byteLength(serialized) > 16 * 1024 * 1024) throw new Error('Tooling bridge output exceeds 16 MiB.');
    process.stdout.write(`${serialized}\n`);
    if (!output.ok) process.exitCode = 2;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ schema: TOOLING_BRIDGE_RESPONSE_SCHEMA, ok: false, status: 'bridge-error', diagnostics: [{ code: 'xtend.compiler.tooling_bridge.failed', severity: 'error', message: error.message }] })}\n`);
    process.exitCode = 1;
  }
});
process.stdin.resume();
