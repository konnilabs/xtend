'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const development = require('../../scripts/development-gate.cjs');
const release = require('../../scripts/release/github.cjs');
const root = path.resolve(__dirname, '../..');
const optionalFile = 'xtend-macos-optional-evidence.yml';
const read = name => fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8');
const requiredWorkflow = read('xtend-default-gates.yml');
const optionalWorkflow = read(optionalFile);
const smokeIds = ['node-native-toolchain-smoke', 'xtend-mcp-vscode-smoke'];
const optionalIds = ['optional-macos-native-toolchain', 'optional-macos-mcp-vscode'];
const nodePins = ['24.18.0', '26.5.0'];
const releaseIds = ['full-release-gates', 'rmt-vnext-primitive-gates', 'package-structure',
  'conditional-network-evidence', ...smokeIds, 'laravel-release-gates', 'core-source-artifact',
  'release-prepare', 'core-installed-consumers', 'core-security-browser'];
const developmentIds = ['core-source-artifact', 'pr-fast-gates', 'rmt-vnext-primitive-gates',
  'release-prepare', 'core-installed-consumers', 'package-structure', ...smokeIds];

// Source-bound to the repository's block-style workflows, with exact matrices.
// Syntax/expressions are also checked with actionlint; unsupported forms fail here.
function jobs(source) {
  const body = source.split('\njobs:\n')[1];
  assert.ok(body, 'workflow must expose its jobs');
  const entries = [...body.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:\n|$(?![\s\S]))/gm)];
  assert.ok(entries.length > 0);
  assert.equal(new Set(entries.map(match => match[1])).size, entries.length);
  return Object.fromEntries(entries.map(match => [match[1], match[2]]));
}
function needs(job) {
  const match = job.match(/^    needs: (\[[^\n]+\]|[\w-]+)$|^    needs:\n((?:      - [\w-]+\n)+)/m);
  if (!match) {
    assert.doesNotMatch(job, /^    needs:/m, 'unsupported needs syntax');
    return [];
  }
  return match[2] ? [...match[2].matchAll(/- ([\w-]+)/g)].map(row => row[1]) :
    match[1].replace(/[\[\]]/g, '').split(',').map(id => id.trim());
}
function matrix(job) {
  const match = job.match(/^      matrix:\n([\s\S]*?)\n    steps:\n/m);
  assert.ok(match, 'explicit matrix required');
  return match[1].trimEnd();
}
function nativeMatrix(platforms) {
  return '        include:\n' + platforms.flatMap(([runner, platform, arch]) => nodePins.map((node, i) =>
    `          - runner: ${runner}\n            runner_label: ${runner}-${arch}\n` +
    `            expected_platform: ${platform}\n            expected_arch: ${arch}\n` +
    `            node_version: '${node}'\n            runtime_lane: ${i ? 'node-26-current' : 'node-24-lts'}\n` +
    `            artifact_suffix: ${runner.replaceAll('.', '-')}-${arch}-node-${node.replaceAll('.', '-')}`
  )).join('\n');
}
function assertRequired(source) {
  const all = jobs(source);
  assert.doesNotMatch(source, /macos|darwin/i, 'macOS must stay outside required workflow');
  assert.equal(matrix(all[smokeIds[0]]), nativeMatrix([
    ['ubuntu-24.04', 'linux', 'x64'], ['windows-2025', 'win32', 'x64']
  ]));
  assert.equal(matrix(all[smokeIds[1]]), '        os:\n          - ubuntu-latest\n          - windows-latest');
  for (const id of smokeIds) {
    assert.doesNotMatch(all[id], /^    if:|continue-on-error:|\n        exclude:/m, 'required smoke must block');
    assert.match(all[id], /fail-fast: false/);
  }
  assert.match(all[smokeIds[0]], /runs-on: \$\{\{ matrix.runner \}\}/);
  assert.match(all[smokeIds[1]], /runs-on: \$\{\{ matrix.os \}\}/);
  for (const [id, job] of Object.entries(all)) for (const dependency of needs(job)) {
    assert.ok(Object.hasOwn(all, dependency), `${id} depends on an absent or optional job: ${dependency}`);
    assert.ok(!optionalIds.includes(dependency));
  }
  for (const [id, expected] of [
    ['development-core-node-rmt', developmentIds], ['release-seal', releaseIds],
    ['npm-publish-latest', [...releaseIds, 'release-seal']]
  ]) assert.deepEqual(needs(all[id]).sort(), [...expected].sort(), id + ' must retain exact required gates');
}
function assertOptional(source) {
  const all = jobs(source);
  assert.equal(source.match(/^on:\n([\s\S]*?)(?=^\S)/m)?.[1].trimEnd(), '  workflow_dispatch:');
  assert.equal(source.match(/^permissions:\n([\s\S]*?)(?=^\S)/m)?.[1].trimEnd(), '  contents: read');
  assert.deepEqual(Object.keys(all), optionalIds);
  assert.doesNotMatch(source, /\b(?:id-token|environment|secrets|needs|continue-on-error):/);
  assert.doesNotMatch(source, /^    permissions:/m, 'optional jobs cannot override read-only permissions');
  assert.match(source, /^  group: xtend-optional-macos-evidence-\$\{\{ github.ref \}\}\n  cancel-in-progress: false$/m);
  assert.doesNotMatch(source, /npm publish|release\/(?:pipeline|cli)\.cjs|actions\/download-artifact@/);
  assert.equal(matrix(all[optionalIds[0]]), nativeMatrix([['macos-15', 'darwin', 'arm64']]));
  assert.equal(matrix(all[optionalIds[1]]), '        os:\n          - macos-latest');
  // Moving a lane must retain every execution, warning-policy and upload step.
  for (let i = 0; i < smokeIds.length; i++) {
    const steps = job => job.split('\n    steps:\n')[1];
    const movedSteps = steps(all[optionalIds[i]])
      .replaceAll('github.sha', 'github.event.pull_request.head.sha || github.sha')
      .replaceAll('xtend-optional-macos-native-toolchain-', 'xtend-node-native-toolchain-smoke-')
      .replaceAll('xtend-optional-macos-mcp-vsix-', 'xtend-mcp-vsix-');
    assert.equal(movedSteps.trimEnd(), steps(jobs(requiredWorkflow)[smokeIds[i]]).trimEnd());
  }
}

test('required Linux/Windows matrices and all PR, sealing and publishing dependencies remain mandatory', () => {
  assertRequired(requiredWorkflow);
  assert.deepEqual(development.required, developmentIds);
  assert.deepEqual(release.gates, releaseIds);
});
test('macOS evidence is dispatch-only, read-only and preserves the original checks and evidence', () => {
  assertOptional(optionalWorkflow);
  for (const filename of fs.readdirSync(path.join(root, '.github/workflows')).filter(name => /\.ya?ml$/.test(name) && name !== optionalFile)) {
    assert.doesNotMatch(read(filename), /xtend-macos-optional-evidence|xtend-optional-macos-|optional-macos-(?:native-toolchain|mcp-vscode)/, filename + ' cannot call or consume optional evidence');
  }
});
for (const id of ['development-core-node-rmt', 'release-seal', 'npm-publish-latest', 'package-structure']) {
  test('rejects optional macOS as a direct or transitive prerequisite of ' + id, () => {
    const all = jobs(requiredWorkflow), job = all[id];
    const mutant = needs(job).length ? job.replace('needs:', 'needs: optional-macos-native-toolchain\n    ignored-needs:') :
      '    needs: optional-macos-native-toolchain\n' + job;
    assert.throws(() => assertRequired(requiredWorkflow.replace(job, mutant)), /macOS|optional|absent/);
  });
}
for (const id of ['development-core-node-rmt', 'release-seal', 'npm-publish-latest']) for (const smoke of smokeIds) {
  test('rejects removal of ' + smoke + ' from ' + id, () => {
    const job = jobs(requiredWorkflow)[id];
    const mutant = job.replace(', ' + smoke, '').replace('      - ' + smoke + '\n', '');
    assert.notEqual(mutant, job);
    assert.throws(() => assertRequired(requiredWorkflow.replace(job, mutant)));
  });
}
for (const [label, mutate] of [
  ['Linux native lane removed', s => s.replace(/          - runner: ubuntu-24.04\n(?:            [^\n]*\n)+/, '')],
  ['Windows native lane removed', s => s.replace(/          - runner: windows-2025\n(?:            [^\n]*\n)+/, '')],
  ['Linux VSIX lane removed', s => s.replace('          - ubuntu-latest\n', '')],
  ['Windows VSIX lane removed', s => s.replace('          - windows-latest\n', '')],
  ['macOS added to required matrix', s => s.replace('          - windows-latest\n', '          - windows-latest\n          - macos-latest\n')],
  ['native smoke allowed to fail', s => s.replace('  node-native-toolchain-smoke:\n', '  node-native-toolchain-smoke:\n    continue-on-error: true\n')],
  ['VSIX smoke skipped', s => s.replace('  xtend-mcp-vscode-smoke:\n', '  xtend-mcp-vscode-smoke:\n    if: false\n')]
]) test('rejects required coverage regression: ' + label, () => assert.throws(() => assertRequired(mutate(requiredWorkflow))));
for (const trigger of ['pull_request', 'push', 'workflow_call', 'workflow_run', 'schedule']) {
  test('rejects automatic/reusable macOS trigger: ' + trigger, () => {
    assert.throws(() => assertOptional(optionalWorkflow.replace('  workflow_dispatch:', `  ${trigger}:\n  workflow_dispatch:`)));
  });
}
test('optional workflow cannot gain publication permissions or lose the warning preload', () => {
  assert.throws(() => assertOptional(optionalWorkflow.replace('  contents: read', '  contents: read\n  id-token: write')));
  assert.throws(() => assertOptional(optionalWorkflow.replace('  optional-macos-mcp-vscode:\n', '  optional-macos-mcp-vscode:\n    permissions:\n      contents: write\n')));
  assert.throws(() => assertOptional(optionalWorkflow.replace('--require=${{ github.workspace }}/scripts/node_warning_policy.cjs', '')));
});
test('real PR and release evaluators ignore optional failures but fail closed for every required gate', () => {
  const success = Object.fromEntries([...new Set([...releaseIds, ...developmentIds]), 'release-seal'].map(id => [id, {result: 'success'}]));
  for (const state of [undefined, 'failure', 'cancelled', 'skipped', 'queued']) {
    const needs = structuredClone(success);
    if (state) for (const id of optionalIds) needs[id] = {result: state};
    assert.equal(development.evaluate(needs).status, 'passed');
    for (const sealed of [false, true]) assert.doesNotThrow(() => release.verifyNeeds(needs, {sealed}));
  }
  for (const id of Object.keys(success)) for (const state of [undefined, 'failure', 'cancelled', 'skipped', 'queued']) {
    const needs = structuredClone(success);
    if (state) needs[id].result = state; else delete needs[id];
    if (developmentIds.includes(id)) assert.equal(development.evaluate(needs).status, 'failed', id);
    if (releaseIds.includes(id) || id === 'release-seal') assert.throws(() => release.verifyNeeds(needs, {sealed: true}), /Required release gate/);
  }
});
