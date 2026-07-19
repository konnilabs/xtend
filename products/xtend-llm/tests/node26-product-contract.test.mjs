import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(productRoot, 'package.json'), 'utf8'));
const scripts = manifest.scripts || {};

assert.equal(manifest.engines?.node, '>=24');
assert.equal(manifest.packageManager, 'npm@11.17.0');
assert.deepEqual(manifest.devEngines, {
  runtime: {
    name: 'node',
    version: '^24.18.0 || ^26.5.0',
    onFail: 'error'
  },
  packageManager: {
    name: 'npm',
    version: '11.17.0',
    onFail: 'error'
  }
});

for (const [name, command] of Object.entries(scripts)) {
  assert.doesNotMatch(command, /\benv\s+-u\s+ELECTRON_RUN_AS_NODE\b/u, `${name} must use the portable launcher`);
}
for (const name of ['dev', 'start', 'test:layout', 'test:llm', 'test:llm:qwen3-8b', 'test:llm:fake']) {
  assert.match(scripts[name], /node scripts\/run-electron\.mjs/u, `${name} must use the portable launcher`);
}
assert.equal(
  scripts['test:n26:contracts'],
  'node tests/node26-product-contract.test.mjs && node tests/electron-launcher.test.mjs && node tests/tiny-onnx-identity.test.mjs'
);
assert.equal(scripts['test:catfood'], 'npm run test:catfood:ci');
assert.equal(
  scripts['test:catfood:ci'],
  'node scripts/rmt-build.mjs --profile production --quiet && npm run test:catfood:check'
);
assert.equal(
  scripts['test:catfood:electron'],
  'node scripts/rmt-build.mjs --profile production --quiet && node scripts/run-layout-smoke.mjs && npm run test:catfood:check -- --include-electron'
);
assert.equal(scripts['test:catfood:smoke'], 'npm run test:catfood:electron');
assert.equal(scripts['test:catfood:full'], undefined);
for (const name of ['test:catfood', 'test:catfood:ci', 'test:node24:product', 'test:node26:product']) {
  assert.doesNotMatch(scripts[name], /electron|run-layout-smoke|test:layout|test:runtime|test:native/iu, `${name} must remain Electron-free`);
}
for (const name of ['test:node24:product', 'test:node26:product']) {
  assert.doesNotMatch(scripts[name], /(?:^|&&\s*)npm run test(?:\s*&&|$)/u, `${name} must not inherit unrelated product-test blockers`);
  assert.equal(scripts[name], 'npm run test:n26:contracts && npm run test:catfood:ci', `${name} must prove N26 contracts and CI-safe AppServices catfood only`);
}
for (const [name, lane] of [['test:electron:node24:product', 'node24'], ['test:electron:node26:product', 'node26']]) {
  assert.match(scripts[name], /^npm run test:n26:contracts\s+&&\s+npm run test:catfood:electron\s+&&/u, `${name} must start with contracts and local Electron catfood`);
  assert.match(scripts[name], new RegExp(`test:runtime:electron:${lane}`, 'u'));
  assert.match(scripts[name], new RegExp(`test:native:runtime:${lane}`, 'u'));
}
assert.equal(scripts['runtime:install:electron'], 'install-electron');
for (const name of [
  'test:runtime:electron:node24',
  'test:runtime:electron:node26',
  'test:native:runtime:node24',
  'test:native:runtime:node26'
]) {
  assert.match(scripts[name], /--xtend-require-installed/u, `${name} must not enter Electron's lazy-download path`);
}

const policy = manifest.xtendLlm?.nodeRuntimePolicy;
assert.equal(policy?.publicEngine, '>=24');
assert.equal(policy?.hostLanes?.['node-24-lts']?.node, '24.18.0');
assert.equal(policy?.hostLanes?.['node-26-current']?.node, '26.5.0');
assert.equal(policy?.electron?.major, 42);
assert.equal(policy?.electron?.embeddedNodeMajor, 24);
assert.equal(policy?.electron?.upstreamOwnedRuntime, true);

for (const relativePath of [
  'scripts/electron-launcher.mjs',
  'scripts/run-electron.mjs',
  policy.runtimeEvidenceScript,
  policy.nativeEvidenceScript,
  policy.nativeEvidenceBacklog
]) {
  assert.ok(fs.existsSync(path.join(productRoot, relativePath)), `${relativePath} must exist`);
}

console.log('ok - XTend LLM declares the Node 24 floor and Node 26 product evidence contract');
