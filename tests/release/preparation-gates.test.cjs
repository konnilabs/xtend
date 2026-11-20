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
  ['scripts/sync_rmt_compiler_contracts.cjs', '--check', '--json'],
    ['--test', 'tests/rmt-language/action-execution-lowering.test.cjs', 'tests/rmt-language/event-condition-guards.test.cjs', 'tests/rmt-language/action-backend-regressions.test.cjs', 'tests/rmt/renderer-structural-ownership.test.cjs'],
    ['--test', 'tests/rmt/surface-materialize-lifetime.test.cjs', 'tests/rmt/maraca-view-lifecycle.test.cjs', 'tests/maraca/native-surface-lifecycle.test.mjs'],
    ['--test', 'tests/rmt-language/backend-ast-result.test.cjs', 'tests/rmt-language/rmtx-frontend.test.cjs', 'tests/rmt-language/rmtx-maraca-integration.test.cjs'],
    ['development/rmtx-a06/frontend/inspect.cjs', '--check'],
    ['--test', 'tests/rmt-language/rmtx-operator-profiles.test.cjs', 'tests/rmt-language/rmtx-selector-dependencies.test.cjs', 'tests/rmt-language/rmtx-selectors.test.cjs'],
    ['development/rmtx-a06/selector-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-host-scopes.test.cjs', 'tests/rmt-language/rmtx-profile3-backend.test.cjs', 'tests/rmt-language/rmtx-maraca-host-scopes.test.cjs'],
  ['development/rmtx-a06/keyed-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-extended-operators.test.cjs', 'tests/rmt-language/rmtx-orchestration.test.cjs', 'tests/rmt-language/rmtx-inline-components.test.cjs', 'tests/rmt-language/action-input-contract.test.cjs', 'tests/xtensions/projected-state-binding.test.cjs', 'tests/xtensions/projected-url-state.test.cjs', 'tests/xtensions/platform-projection-profile.test.cjs', 'tests/xtensions/projected-xrouter-url-state.test.cjs'],
  ['development/rmtx-a06/orchestration-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-native-view.test.cjs', 'tests/xtensions/native-view-projection.test.cjs', 'tests/xtensions/native-state-binding.test.cjs', 'tests/xtensions/native-url-state.test.cjs', 'tests/xtensions/native-composition-profile.test.cjs', 'tests/rmt/renderer-preflight.test.cjs', 'tests/maraca/rmtx-native-boundaries.test.mjs'],
  ['development/rmtx-a06/native-view-profile/inspect.cjs', '--check'],
  ['--test', 'tests/rmt-language/rmtx-lifecycle.test.cjs', 'tests/xtensions/native-lifecycle-protocol.test.cjs', 'tests/xtensions/lifecycle-composition-profile.test.cjs', 'tests/xtensions/lifecycle-browser-profile.test.cjs', 'tests/maraca/rmtx-lifecycle.test.mjs'],
  ['development/rmtx-a06/lifecycle-profile/inspect.cjs', '--check'],
  ['--test', '--test-concurrency=1', 'tests/rmt-language/rmtx-native-orchestration.test.cjs', 'tests/xtensions/native-orchestrated-contracts.test.cjs', 'tests/xtensions/native-orchestrated-prewarm.test.cjs', 'tests/xtensions/native-surface-projection.test.cjs', 'tests/maraca/rmtx-surface-graph.test.mjs', 'tests/maraca/rmtx-orchestration.test.mjs'],
  ['development/rmtx-a06/native-components/generate.cjs', '--check'],
  ['development/rmtx-a06/native-orchestration-profile/inspect.cjs', '--check'],
  ['development/rmtx-a06/native-component-catalog/generate.cjs', '--check'],
  ['--test', '--test-concurrency=1', 'tests/rmt-language/native-component-catalog-v2.test.cjs', 'tests/rmt-language/native-component-catalog-projection.test.cjs', 'tests/rmt-language/native-component-catalog-types.test.cjs', 'tests/rmt-language/native-managed-renderer.test.mjs'],
  ['--test', '--test-concurrency=1', 'tests/components/native-managed-ui.test.mjs', 'tests/components/native-platform-services.test.mjs', 'tests/components/component-source.test.cjs', 'tests/components/native-demo-reference.test.mjs', 'tests/maraca/rmtx-managed.test.mjs', 'tests/maraca/native-platform-managed.test.mjs', 'tests/maraca/native-private-cores.test.mjs', 'tests/maraca/native-data-literal.test.cjs'],
    ['development/rmtx-a01/inspect.cjs', '--check'],
    ['development/rmtx-a02/inspect.cjs', '--check'],
    ['development/rmtx-a02/url-history/inspect.cjs', '--check'],
    ['development/rmtx-a02/url-history/integration-inspect.cjs', '--check'],
    ['development/rmtx-a03/inspect.cjs', '--check'],
    ['development/rmtx-a03/graph-inspect.cjs', '--check'],
    ['development/rmtx-a03/budget-inspect.cjs', '--check'],
    ['development/rmtx-a03/capability-inspect.cjs', '--check'],
    ['development/rmtx-a04/inspect.cjs', '--check'],
    ['development/rmtx-a04/integration-inspect.cjs', '--check'],
    ['development/rmtx-a04/graph-inspect.cjs', '--check'],
    ['development/rmtx-a04/loading-inspect.cjs', '--check'],
    ['development/rmtx-a04/peer-inspect.cjs', '--check'],
    ['development/rmtx-a04/delivery-inspect.cjs', '--check'],
    ['development/rmtx-a04/integrity-inspect.cjs', '--check'],
    ['development/rmtx-a04/runtime-inspect.cjs', '--check'],
    ['development/rmtx-a04/updates-inspect.cjs', '--check'],
  ['development/rmtx-a05/inspect.cjs', '--check'],
    ['development/rmtx-a06/two-host-inspect.cjs', '--check'],
    ['--test', 'tests/xtensions/component-interface.test.cjs'],
    ['development/rmtx-a06/automatic-inspect.cjs', '--check'],
    ['--test', 'tests/xtensions/component-composition.test.cjs'],
    ['development/rmtx-a06/scoped-inspect.cjs', '--check'],
    ['--test', 'tests/xtensions/scoped-components.test.cjs'],
    ['scripts/sync_xtend_package_versions.js', '--check'],
    ['--test', '--test-concurrency=1', 'tests/rmt-language/rmt-project.test.cjs', 'tests/rmt-language/rmtx-language-service.test.cjs', 'tests/rmt-language/rmtx-language-server.test.cjs', 'tests/rmt-language/rmtx-editor.test.cjs', 'tests/rmt-language/rmt-project-integrations.test.cjs'],
    ['scripts/release/feature-scope.cjs', '--check-plan']
  ]);
  const calls = [];
  assert.equal(runReleasePreparationChecks({ rootDir: root, execute: (binary, command, options) => {
    assert.equal(binary, process.execPath); assert.equal(options.cwd, root);assert.equal(options.timeout,240000);
    calls.push(command); return { status: 0 };
  } }), 0);
  assert.deepEqual(calls, CHECKS.map(command => ['--max-old-space-size=1024', ...(command[0]==='--test'&&!command.some(value=>value.startsWith('--test-concurrency='))?['--test-concurrency=1']:[]), ...command]));
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
  for (const name of ['delivery', 'integrity', 'deployment-runtime', 'deployment-update', 'ssr']) {
    const artifact = `.xtend-test-results/xtend-xtensions-${name}-report.json`;
    for (const source of [normal, migration, nightly]) assert(source.includes(artifact), `${name} browser evidence is uploaded`);
    assert(catalog.ci['ci-nightly'].artifacts.some(row => row.path === artifact && row.producer === 'full_release' && row.expectedSchema === `xtend.xtensions.${name}-acceptance-report.v1`));
  }
  for (const [mode, expectedMode] of [['node', 'jsdom-native-esm'], ['browser', 'chromium-sealed-native-esm']]) {
    const artifact = `.xtend-test-results/xtend-rmtx-native-view-runtime-${mode}-report.json`;
    for (const source of [normal, migration, nightly]) assert(source.includes(artifact), `${mode} Native evidence is uploaded`);
    assert(catalog.ci['ci-nightly'].artifacts.some(row => row.path === artifact && row.producer === 'full_release'
      && row.expectedSchema === 'xtend.rmtx.native-view-runtime-acceptance.v1' && row.expectedMode === expectedMode));
  }
  for (const mode of ['node','browser']) {
    const artifact = `.xtend-test-results/xtend-rmtx-native-orchestration-runtime-${mode}-report.json`;
    for (const source of [normal,migration,nightly]) assert(source.includes(artifact));
    assert(catalog.ci['ci-nightly'].artifacts.some(row=>row.path===artifact && row.expectedSchema==='xtend.rmtx.native-orchestration-runtime-acceptance.v1'));
  }
  for (const mode of ['node','browser']) {
    const artifact = `.xtend-test-results/xtend-rmtx-native-managed-runtime-${mode}-report.json`;
    for (const source of [normal,migration,nightly]) assert(source.includes(artifact));
    assert(catalog.ci['ci-nightly'].artifacts.some(row=>row.path===artifact && row.expectedSchema==='xtend.rmtx.native-managed-runtime-acceptance.v1'));
  }
  const catalogBrowserArtifact='.xtend-test-results/xtend-rmtx-native-catalog-browser-report.json';
  for(const source of [normal,migration,nightly]) assert(source.includes(catalogBrowserArtifact));
  assert(catalog.ci['ci-nightly'].artifacts.some(row=>row.path===catalogBrowserArtifact && row.expectedSchema==='xtend.rmtx.native-catalog-browser-acceptance.v1'));
  const coldArtifact='.xtend-test-results/xtend-rmtx-native-cold-registry-browser-report.json';
  for(const source of [normal,migration,nightly]) assert(source.includes(coldArtifact));
  assert(catalog.ci['ci-nightly'].artifacts.some(row=>row.path===coldArtifact&&row.expectedSchema==='xtend.rmtx.native-cold-registry-browser-acceptance.v1'));
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
