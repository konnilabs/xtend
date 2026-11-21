'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const {
  TARGET_MATRIX_SCHEMA, TARGET_MATRIX_API_VERSION,
  readTargetMatrix, validateTargetMatrix, assertTargetMatrix, checkTargetMatrix
} = require('../../development/rmtx-a06/release-acceptance/target-contract.cjs');
const root = path.resolve(__dirname, '../..');
const matrixFile = 'development/rmtx-a06/release-acceptance/targets.v1.json';
const inspectFile = path.join(root, 'development/rmtx-a06/release-acceptance/inspect.cjs');

function invalid(input, options = {}) {
  const report = validateTargetMatrix(input, { rootDir: root, checkSources: false, ...options });
  assert.equal(report.valid, false);
  assert.equal(report.acceptedForRelease, false);
  assert.ok(report.errors.length > 0);
  for (const error of report.errors) {
    assert.equal(typeof error.code, 'string');
    assert.equal(typeof error.path, 'string');
    assert.equal(typeof error.message, 'string');
    assert.ok(error.code && error.message);
  }
  return report;
}
function mutated(change, options) {
  const input = readTargetMatrix(root);
  const baseline = validateTargetMatrix(input, { rootDir: root, checkSources: false });
  assert.equal(baseline.valid, true, `Mutation fixture must start valid: ${JSON.stringify(baseline.errors)}`);
  change(input);
  return invalid(input, options);
}
function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'xtend-rmtx-targets-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function writeMatrix(directory, content) {
  const file = path.join(directory, matrixFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  return file;
}
function inspect(args, cwd = root) {
  return spawnSync(process.execPath, ['--max-old-space-size=256', inspectFile, ...args], {
    cwd, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024
  });
}
function snapshot(directory) {
  const result = [];
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result.push([path.relative(directory, absolute), fs.readFileSync(absolute).toString('base64')]);
    }
  }
  visit(directory);
  return result;
}

test('0.9 target contract selects scope without granting release acceptance', () => {
  assert.equal(TARGET_MATRIX_SCHEMA, 'xtend.rmtx.release-targets.v1');
  assert.equal(TARGET_MATRIX_API_VERSION, '1.0.0');
  const input = readTargetMatrix(root);
  const report = validateTargetMatrix(input, { rootDir: root });
  assert.equal(report.schema, 'xtend.rmtx.release-target-check.v1');
  assert.equal(report.apiVersion, '1.0.0');
  assert.equal(report.valid, true, JSON.stringify(report.errors));
  assert.deepEqual(report.errors, []);
  assert.equal(report.acceptedForRelease, false);
  assert.ok(report.selectedTargets > 0);
  assert.ok(report.sourceProfiles > 0);
  assert.ok(report.requiredCases > 0);
  assert.deepEqual(checkTargetMatrix({ rootDir: root }), report);
  assert.doesNotThrow(() => assertTargetMatrix(input, { rootDir: root }));
});

test('target contract rejects unknown versions, malformed objects and undeclared fields', () => {
  for (const value of [null, [], true, 'targets', {}]) invalid(value);
  for (const field of ['schema', 'apiVersion', 'targetVersion']) {
    mutated(input => { delete input[field]; });
    mutated(input => { input[field] = '99.0.0'; });
  }
  mutated(input => { input.unreviewed = true; });
  mutated(input => { input.decision.unreviewed = true; });
  mutated(input => { input.releaseAcceptance.unreviewed = true; });
  mutated(input => { input.entrypoints[0].unreviewed = true; });
  mutated(input => { input.targets[0].unreviewed = true; });
  mutated(input => { input.sourceProfiles[0].unreviewed = true; });
  mutated(input => { input.sourceProfiles[0].composition.unreviewed = true; });
  mutated(input => { input.policies[0].unreviewed = true; });
  mutated(input => { input.policies[0].rules.unreviewed = true; });
  mutated(input => { input.exclusions[0].unreviewed = true; });
  mutated(input => { input.cases[0].unreviewed = true; });
});

test('malformed nested records and reserved identities return invalid reports', () => {
  mutated(input => { input.cases.find(row => row.id === 'csr-source-1').coverage.frameworks = {}; });
  mutated(input => { input.entrypoints[0].id = '__proto__'; });
  mutated(input => { input.entrypoints.find(row => row.id === 'retained-ssr-server2').scope = 'authoring'; });
});

test('assertion errors expose the invalid target report', () => {
  const input = readTargetMatrix(root);
  input.schema = 'invalid';
  assert.throws(() => assertTargetMatrix(input, { rootDir: root, checkSources: false }), error => {
    assert.equal(error.code, 'xtend.rmtx.targets_invalid');
    assert.equal(error.report.valid, false);
    assert.equal(error.report.acceptedForRelease, false);
    assert.ok(error.report.errors.length > 0);
    return true;
  });
});

test('missing and malformed target files return invalid reports', t => {
  const directory = temporary(t);
  const missing = checkTargetMatrix({ rootDir: directory });
  assert.equal(missing.valid, false);
  assert.equal(missing.acceptedForRelease, false);
  assert.ok(missing.errors.length > 0);
  writeMatrix(directory, '{');
  const malformed = checkTargetMatrix({ rootDir: directory });
  assert.equal(malformed.valid, false);
  assert.equal(malformed.acceptedForRelease, false);
  assert.ok(malformed.errors.length > 0);
});

test('inspection CLI rejects invalid roots and flags without writing files', t => {
  const directory = temporary(t);
  writeMatrix(directory, '{');
  const before = snapshot(directory);
  const result = inspect(['--check', '--json', '--root', directory], directory);
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, false);
  assert.deepEqual(snapshot(directory), before);
  for (const args of [['--unknown'], ['--root'], ['--check', '--root', directory, '--unexpected']]) {
    const rejected = inspect(args, directory);
    assert.equal(rejected.error, undefined);
    assert.equal(rejected.status, 1);
  }
  assert.deepEqual(snapshot(directory), before);
});

test('selected release scope cannot silently grow or lose targets and Source profiles', () => {
  mutated(input => { input.targets.pop(); });
  mutated(input => { input.targets.push(structuredClone(input.targets[0])); });
  mutated(input => { input.targets[0].frameworks.push('angular'); });
  mutated(input => { input.targets[0].mode = 'streaming-ssr'; });
  mutated(input => { input.targets[0].projectModes.push('portable-php'); });
  mutated(input => { input.sourceProfiles.pop(); });
  mutated(input => { input.sourceProfiles.push(structuredClone(input.sourceProfiles[0])); });
  mutated(input => { input.sourceProfiles[0].version = '2.0.0'; });
  mutated(input => { input.sourceProfiles[0].compileSchema = 'unsupported'; });
  mutated(input => { input.targets[0].sourceProfiles.push('source-99'); });
});

test('required cases must exist and match their positive or negative reference', () => {
  mutated(input => { input.cases.pop(); });
  mutated(input => { input.cases.push(structuredClone(input.cases[0])); });
  mutated(input => { input.targets[0].positiveCases = []; });
  mutated(input => { input.targets[0].negativeCases = []; });
  mutated(input => { input.targets[0].positiveCases[0] = 'unregistered-case'; });
  mutated(input => { input.targets[0].negativeCases[0] = input.targets[0].positiveCases[0]; });
  mutated(input => { input.policies[0].positiveCases = []; });
  mutated(input => { input.policies[0].negativeCases = []; });
  mutated(input => { input.policies[0].positiveCases[0] = input.policies[0].negativeCases[0]; });
  mutated(input => { input.cases[0].status = 'passed'; });
});

test('selected policies and explicit exclusions cannot be weakened or omitted', () => {
  mutated(input => { input.policies.pop(); });
  mutated(input => { input.policies.push(structuredClone(input.policies[0])); });
  mutated(input => { input.exclusions.pop(); });
  mutated(input => { input.exclusions[0].negativeCases = []; });
  mutated(input => { input.entrypoints.pop(); });
  mutated(input => { input.entrypoints[0].apiVersion = '99.0.0'; });
  mutated(input => { input.policies.find(row => row.id === 'ssr').rules.streaming = true; });
  mutated(input => { input.policies.find(row => row.id === 'layout').rules.platformClsGuarantee = true; });
  mutated(input => { input.policies.find(row => row.id === 'lanes').rules.viewportActivation = true; });
  mutated(input => { input.policies.find(row => row.id === 'authority').rules.parallelController = true; });
});

test('policy-specific obligations cannot be replaced with unrelated existing cases', () => {
  mutated(input => {
    const policy = input.policies.find(row => row.id === 'lanes');
    const removed = new Set([...policy.positiveCases, ...policy.negativeCases]);
    input.cases = input.cases.filter(row => !removed.has(row.id));
    policy.positiveCases = ['csr-source-1'];
    policy.negativeCases = ['ssr-identity-mismatch'];
    // Keep shared loading obligations intact to isolate the lane contract.
    input.cases.push(readTargetMatrix(root).cases.find(row => row.id === 'no-admission-no-load'));
  });
  mutated(input => {
    const policy = input.policies.find(row => row.id === 'fallback');
    policy.negativeCases = ['csr-invalid-boundary'];
  });
});

test('planned cases retain every selected Framework, Source and project-mode combination', () => {
  mutated(input => {
    const row = input.cases.find(item => item.id === 'csr-source-1');
    row.coverage.projectModes.pop();
  });
  mutated(input => {
    const row = input.cases.find(item => item.id === 'ssr-source-1');
    row.coverage.frameworks.pop();
  });
  mutated(input => {
    const target = input.targets.find(row => row.id === 'framework-node-ssr');
    target.positiveCases = target.positiveCases.filter(id => id !== 'ssr-source-1');
  });
});

test('scope selection cannot claim release readiness or substitute execution evidence', () => {
  mutated(input => { input.releaseAcceptance.acceptedForRelease = true; });
  mutated(input => { input.releaseAcceptance.status = 'accepted'; });
  mutated(input => { input.releaseAcceptance.executionEvidence = { status: 'passed' }; });
  mutated(input => { input.releaseAcceptance.milestone = 'A06.6.1'; });
});

test('source references reject traversal, absolute paths and missing files', () => {
  for (const reference of ['../outside.cjs', path.join(os.tmpdir(), 'outside.cjs'), 'development/../outside.cjs']) {
    const report = mutated(input => { input.cases[0].referencePaths = [reference]; });
    assert.ok(report.errors.some(error => error.code === 'xtend.rmtx.targets.source_path'));
  }
  const missing = mutated(input => {
    input.cases[0].referencePaths = ['development/rmtx-a06/release-acceptance/missing-case.cjs'];
  }, { checkSources: true });
  assert.ok(missing.errors.some(error => error.code === 'xtend.rmtx.targets.source_unavailable'));
});


test('inspection CLI validates a complete source fixture and leaves every file unchanged', t => {
  const directory = temporary(t);
  const input = readTargetMatrix(root);
  writeMatrix(directory, input);
  const references = new Set([
    ...input.entrypoints.map(row => row.path),
    ...input.sourceProfiles.flatMap(row => [row.composition.referencePath, row.csrCoveragePath]),
    ...input.cases.flatMap(row => row.referencePaths)
  ]);
  for (const reference of references) {
    const destination = path.join(directory, reference);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, reference), destination);
  }
  const before = snapshot(directory);
  for (const args of [['--check', '--root', directory], ['--check', '--json', '--root', directory]]) {
    const result = inspect(args, directory);
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const report = JSON.parse(result.stdout);
    assert.equal(report.valid, true);
    assert.equal(report.acceptedForRelease, false);
    assert.equal(report.selectedTargets, input.targets.length);
    assert.equal(report.sourceProfiles, input.sourceProfiles.length);
    assert.equal(report.requiredCases, input.cases.length);
    assert.deepEqual(snapshot(directory), before);
  }
  const entrypoint = path.join(directory, input.entrypoints[0].path);
  fs.unlinkSync(entrypoint);
  const missingSource = checkTargetMatrix({ rootDir: directory });
  assert.equal(missingSource.valid, false);
  assert.ok(missingSource.errors.some(error => error.code === 'xtend.rmtx.targets.source_unavailable'));
  fs.symlinkSync(path.join(root, input.entrypoints[0].path), entrypoint);
  const escapedSource = checkTargetMatrix({ rootDir: directory });
  assert.equal(escapedSource.valid, false);
  assert.ok(escapedSource.errors.some(error => error.code === 'xtend.rmtx.targets.source_unavailable'));
});
