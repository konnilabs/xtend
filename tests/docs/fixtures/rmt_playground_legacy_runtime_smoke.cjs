'use strict';

// This fixture can also run directly with the Docs host's Node binary. Keep
// the test runner out of this process: it has a newer runtime requirement.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '../../..');
String.prototype.replaceAll = undefined;
const { executeToolingBridgeOperation } = require('../../../tools/tooling-bridge');

async function main() {
  const source = fs.readFileSync(path.join(rootDir, 'products/rmt-maraca-kernel-orchestration/kernel-orchestration-app.rmt'), 'utf8');
  const filePath = 'docs/rmt-playground-source.rmt';
  const request = (operation, payload) => executeToolingBridgeOperation({
    operation, requestId: 'legacy-node-smoke', payload: { source, filePath, ...payload }
  }, { rootDir });

  const compiled = await request('compile');
  assert.strictEqual(compiled.ok, true);
  assert.strictEqual(compiled.result.coreDocument.surfaces.length, 15);
  const validDiagnostics = await request('language-diagnostics');
  assert.strictEqual(validDiagnostics.ok, true);
  assert(!validDiagnostics.diagnostics.some(entry => entry.severity === 'error'));
  const brokenSource = 'template broken {';
  const invalid = await request('compile', { source: brokenSource });
  assert.strictEqual(invalid.ok, false);
  assert(invalid.diagnostics.some(entry => entry.severity === 'error'));
  const diagnostics = await request('language-diagnostics', { source: brokenSource });
  assert.strictEqual(diagnostics.ok, true);
  assert(diagnostics.diagnostics.some(entry => entry.severity === 'error' && entry.range));

  const plan = await request('maraca-plan', { options: {
    profile: 'debug', lazy: 'component', css: 'external', stack: 'runtime', components: 'document',
    orchestration: 'auto', kernel: 'auto', hydration: 'auto', validation: 'auto', transitions: 'auto'
  } });
  assert.strictEqual(plan.ok, true);
  assert.strictEqual(plan.result.orchestration.summary.surfaceCount, 15);
  assert.strictEqual(plan.result.kernel.enabled, true);
  const preview = await request('safe-preview', {
    coreDocument: compiled.result.coreDocument,
    options: { componentRegistry: compiled.result.coreDocument.surfaces.map(surface => surface.component) }
  });
  assert.strictEqual(preview.ok, true);
  assert.strictEqual(preview.result.descriptor.children.length, 15);

  // Check the actual transitive CommonJS dependencies, including lazy imports,
  // so modern CI also catches syntax the older Docs Node cannot parse.
  // Escaped question marks in regular expressions are not operators.
  const incompatibleSyntax = /(?<!\\)(?:\?\.[A-Za-z_$[(]|\?\?)/u;
  const dependencies = Object.keys(require.cache).filter(file => file !== __filename
    && file.startsWith(rootDir + path.sep) && !file.includes(path.sep + 'node_modules' + path.sep));
  const incompatible = dependencies.filter(file => incompatibleSyntax.test(fs.readFileSync(file, 'utf8')));
  assert.strictEqual(incompatible.length, 0, 'Docs bridge dependency uses unsupported syntax: '
    + incompatible.map(file => path.relative(rootDir, file)).join(', '));
  process.stdout.write(JSON.stringify({ nodeVersion: process.version, dependencyCount: dependencies.length,
    operations: ['compile', 'language-diagnostics', 'maraca-plan', 'safe-preview'] }) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
