'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CHECKS, runReleasePreparationChecks } = require('../../scripts/check_release_preparation.cjs');
const { catalog } = require('../../scripts/test-runner/catalog');
const root = path.resolve(__dirname, '../..');

test('development checks validate Classic drift, observations, versions and scope without requiring implemented features', () => {
  assert.deepEqual(CHECKS, [
    ['scripts/generate_rmt_classic_contract.js', '--check'],
    ['development/rmtx-a01/inspect.cjs', '--check'],
    ['development/rmtx-a02/inspect.cjs', '--check'],
    ['development/rmtx-a02/url-history/inspect.cjs', '--check'],
    ['development/rmtx-a02/url-history/integration-inspect.cjs', '--check'],
    ['scripts/sync_xtend_package_versions.js', '--check'],
    ['scripts/release/feature-scope.cjs', '--check-plan']
  ]);
  const calls = [];
  assert.equal(runReleasePreparationChecks({ rootDir: root, execute: (binary, command, options) => {
    assert.equal(binary, process.execPath); assert.equal(options.cwd, root);
    calls.push(command); return { status: 0 };
  } }), 0);
  assert.deepEqual(calls, CHECKS);
});
test('a failed or interrupted preparation check blocks following commands', () => {
  for (const status of [1, 17, null]) {
    let calls = 0;
    assert.notEqual(runReleasePreparationChecks({ execute: () => { calls++; return { status }; } }), 0);
    assert.equal(calls, 1);
  }
  assert.throws(() => runReleasePreparationChecks({ execute: () => ({ error: Error('cannot execute') }) }), /cannot execute/);
});
test('GitHub development owners and nightly execute the same blocking preparation check', () => {
  const normal = fs.readFileSync(path.join(root, '.github/workflows/xtend-default-gates.yml'), 'utf8');
  const nightly = fs.readFileSync(path.join(root, '.github/workflows/xtend-nightly-build.yml'), 'utf8');
  const migration = fs.readFileSync(path.join(root, '.github/workflows/xtend-migration-completion.yml'), 'utf8');
  for (const [source, id] of [[normal, 'pr-fast-gates'], [normal, 'full-release-gates'], [migration, 'pr-fast-gates']]) {
    const start = source.indexOf('\n  ' + id + ':');
    assert(start >= 0, id);
    const block = source.slice(start).split(/\n  [a-z][\w-]*:\n/u)[1];
    assert(block?.includes('run: npm run check:release-preparation'), `${id} checks preparation`);
    const step = block.split('      - name: Check 0.9 development preparation\n')[1]?.split('\n      - ')[0];
    assert(step && !step.includes('continue-on-error'), `${id} blocks on contract/plan drift`);
    assert(!step.includes('release:features:check'), `${id} permits pending feature implementation`);
  }
  const nightlyStep = nightly.split('      - name: Check 0.9 development preparation\n')[1]?.split('\n      - ')[0];
  assert(nightlyStep?.includes('nightly.js phase release_preparation'));
  assert.equal(catalog.ci['ci-nightly'].phases.release_preparation.blocking, true);
  assert.deepEqual(catalog.ci['ci-nightly'].phases.release_preparation.commands, [{ command: 'npm', args: ['run', 'check:release-preparation'] }]);
  assert(catalog.ci['ci-nightly'].phases.full_release.dependsOn.includes('release_preparation'));
  assert(nightly.includes('if [ "${{ steps.release_preparation.outcome }}" != "success" ]'));
  for (const profile of ['ci-pr', 'ci-release', 'ci-nightly']) assert(catalog.ci[profile].additionalChecks.some(check =>
    check.script === 'check:release-preparation' && check.advisory === false), `${profile} owns preparation checks`);
});
